use std::{
    marker::PhantomData,
    sync::{Arc, Once},
    time::UNIX_EPOCH,
};

use async_trait::async_trait;
use bounded_integer::BoundedU8;
use cardano_chain_sync::{
    cache::LedgerCacheRocksDB, chain_sync_stream, client::ChainSyncClient, event_source::ledger_transactions,
};
use cardano_explorer::Maestro;
use cardano_submit_api::client::LocalTxSubmissionClient;
use chrono::Duration;
use clap::Parser;
use cml_chain::{address::RewardAddress, assets::AssetName, transaction::Transaction, PolicyId};
use config::AppConfig;
use spectrum_cardano_lib::constants::BABBAGE_ERA_ID;
use spectrum_offchain::{
    backlog::{persistence::BacklogStoreRocksDB, BacklogConfig, PersistentPriorityBacklog},
    rocks::RocksConfig,
};
use spectrum_offchain_cardano::{
    collateral::pull_collateral,
    creds::operator_creds_base_address,
    prover::operator::OperatorProver,
    tx_submission::{tx_submission_agent_stream, TxSubmissionAgent},
};
use splash_dao_offchain::{
    deployment::{DaoDeployment, ProtocolDeployment},
    entities::offchain::voting_order::VotingOrder,
    protocol_config::{ProtocolConfig, ProtocolTokens},
    routines::inflation::{actions::CardanoInflationActions, Behaviour},
    state_projection::StateProjectionRocksDB,
    time::{NetworkTime, NetworkTimeProvider},
};
use tokio::sync::Mutex;
use tracing::info;
use tracing_subscriber::fmt::Subscriber;

mod config;

#[tokio::main]
async fn main() {
    let subscriber = Subscriber::new();
    tracing::subscriber::set_global_default(subscriber).expect("setting tracing default failed");
    let args = AppArgs::parse();
    let raw_config = std::fs::read_to_string(args.config_path).expect("Cannot load configuration file");
    let config: AppConfig = serde_json::from_str(&raw_config).expect("Invalid configuration file");

    let raw_deployment = std::fs::read_to_string(args.deployment_path).expect("Cannot load deployment file");
    let deployment: DaoDeployment = serde_json::from_str(&raw_deployment).expect("Invalid deployment file");

    log4rs::init_file(args.log4rs_path, Default::default()).unwrap();

    info!("Starting DAO Agent ..");

    let explorer = Maestro::new(config.maestro_key_path, config.network_id.into())
        .await
        .expect("Maestro instantiation failed");
    let protocol_deployment = ProtocolDeployment::unsafe_pull(deployment.validators, &explorer).await;

    let chain_sync_cache = Arc::new(Mutex::new(LedgerCacheRocksDB::new(config.chain_sync.db_path)));
    let chain_sync = ChainSyncClient::init(
        Arc::clone(&chain_sync_cache),
        config.node.path,
        config.node.magic,
        config.chain_sync.starting_point,
    )
    .await
    .expect("ChainSync initialization failed");

    // n2c clients:
    let tx_submission_client =
        LocalTxSubmissionClient::<BABBAGE_ERA_ID, Transaction>::init(config.node.path, config.node.magic)
            .await
            .expect("LocalTxSubmission initialization failed");
    let (tx_submission_agent, tx_submission_channel) =
        TxSubmissionAgent::new(tx_submission_client, config.tx_submission_buffer_size);

    // prepare upstreams
    let tx_submission_stream = tx_submission_agent_stream(tx_submission_agent);
    let (signal_tip_reached_snd, signal_tip_reached_recv) = tokio::sync::broadcast::channel(1);
    let ledger_stream = Box::pin(ledger_transactions(
        chain_sync_cache,
        chain_sync_stream(chain_sync, signal_tip_reached_snd),
        config.chain_sync.disable_rollbacks_until,
        config.chain_sync.replay_from_point,
    ));

    // We assume the batcher's private key is associated with a Cardano base address, which also
    // includes a reward address.
    let (_, reward_address, payment_cred, operator_cred, operator_sk) =
        operator_creds_base_address(config.batcher_private_key, 0);

    let collateral = pull_collateral(payment_cred, &explorer)
        .await
        .expect("Couldn't retrieve collateral");

    let splash_policy =
        PolicyId::from_hex("40079b8ba147fb87a00da10deff7ddd13d64daf48802bb3f82530c3e").unwrap();
    let splash_name = AssetName::from(spectrum_cardano_lib::AssetName::utf8_unsafe("SplashTEST".into()));

    let node_magic: u8 = config.network_id.into();
    let protocol_config = ProtocolConfig {
        deployed_validators: protocol_deployment,
        tokens: ProtocolTokens::from_minted_tokens(deployment.nfts, splash_policy, splash_name),
        operator_sk: config.batcher_private_key.into(),
        node_magic: node_magic as u64,
        reward_address,
        collateral,
        genesis_time: config.genesis_start_time.into(),
    };

    let prover = OperatorProver::new(&operator_sk);
    let inflation_actions = CardanoInflationActions::from(protocol_config.clone());

    let behaviour = Behaviour::new(
        StateProjectionRocksDB::new(config.inflation_box_persistence_config),
        StateProjectionRocksDB::new(config.poll_factory_persistence_config),
        StateProjectionRocksDB::new(config.weighting_poll_persistence_config),
        StateProjectionRocksDB::new(config.voting_escrow_persistence_config),
        StateProjectionRocksDB::new(config.smart_farm_persistence_config),
        StateProjectionRocksDB::new(config.perm_manager_persistence_config),
        setup_order_backlog(config.order_backlog_config).await,
        NetworkTimeSource {},
        inflation_actions,
        protocol_config,
        PhantomData,
        tx_submission_channel,
        prover,
    );
}

async fn setup_order_backlog(
    store_conf: RocksConfig,
) -> PersistentPriorityBacklog<VotingOrder, BacklogStoreRocksDB> {
    let store = BacklogStoreRocksDB::new(store_conf);
    let backlog_config = BacklogConfig {
        order_lifespan: Duration::try_hours(1).unwrap(),
        order_exec_time: Duration::try_minutes(5).unwrap(),
        retry_suspended_prob: BoundedU8::new(60).unwrap(),
    };

    PersistentPriorityBacklog::new::<VotingOrder>(store, backlog_config).await
}

#[derive(Parser)]
#[command(name = "splash-dao-agent")]
#[command(author = "Spectrum Labs")]
#[command(version = "1.0.0")]
#[command(about = "Splash DAO Agent", long_about = None)]
struct AppArgs {
    /// Path to the JSON configuration file.
    #[arg(long, short)]
    config_path: String,
    /// Path to the JSON deployment configuration file .
    #[arg(long, short)]
    deployment_path: String,
    /// Path to the log4rs YAML configuration file.
    #[arg(long, short)]
    log4rs_path: String,
}

struct NetworkTimeSource;

#[async_trait]
impl NetworkTimeProvider for NetworkTimeSource {
    async fn network_time(&self) -> NetworkTime {
        std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}
