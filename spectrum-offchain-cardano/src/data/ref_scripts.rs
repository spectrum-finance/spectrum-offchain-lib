use crate::constants::{DEPOSIT_SCRIPT, POOL_V1_SCRIPT, POOL_V2_SCRIPT, REDEEM_SCRIPT, SWAP_SCRIPT};
use crate::RefScriptsConfig;
use cardano_explorer::client::Explorer;
use cml_chain::builders::tx_builder::TransactionUnspentOutput;
use cml_chain::plutus::PlutusV2Script;
use cml_chain::transaction::{ScriptRef, TransactionOutput};
use cml_chain::Script;
use spectrum_cardano_lib::OutputRef;

#[derive(Clone)]
pub struct RefScriptsOutputs {
    pub pool_v1: TransactionUnspentOutput,
    pub pool_v2: TransactionUnspentOutput,
    pub swap: TransactionUnspentOutput,
    pub deposit: TransactionUnspentOutput,
    pub redeem: TransactionUnspentOutput,
}

impl RefScriptsOutputs {
    pub async fn new<'a>(config: RefScriptsConfig, explorer: Explorer<'a>) -> Option<RefScriptsOutputs> {
        async fn process_utxo_with_ref_script<'a>(
            tx_out: OutputRef,
            raw_ref_script: &str,
            explorer: Explorer<'a>,
        ) -> Option<TransactionUnspentOutput> {
            let previous_output: TransactionUnspentOutput =
                explorer.get_utxo(tx_out).await.unwrap().try_into().ok()?;

            let script_ref: Option<ScriptRef> = Some(Script::new_plutus_v2(PlutusV2Script::new(
                hex::decode(raw_ref_script).unwrap(),
            )));

            let updated_new_output = TransactionOutput::new(
                previous_output.output.address().clone(),
                previous_output.output.amount().clone(),
                previous_output.output.datum(),
                script_ref,
            );

            Some(TransactionUnspentOutput::new(
                previous_output.input,
                updated_new_output,
            ))
        }

        let pool_v1 =
            process_utxo_with_ref_script(OutputRef::from(config.pool_v1_ref), POOL_V1_SCRIPT, explorer)
                .await?;
        let pool_v2 =
            process_utxo_with_ref_script(OutputRef::from(config.pool_v2_ref), POOL_V2_SCRIPT, explorer)
                .await?;
        let swap =
            process_utxo_with_ref_script(OutputRef::from(config.swap_ref), SWAP_SCRIPT, explorer).await?;
        let deposit =
            process_utxo_with_ref_script(OutputRef::from(config.deposit_ref), DEPOSIT_SCRIPT, explorer)
                .await?;
        let redeem =
            process_utxo_with_ref_script(OutputRef::from(config.redeem_ref), REDEEM_SCRIPT, explorer).await?;
        Some(RefScriptsOutputs {
            pool_v1,
            pool_v2,
            swap,
            deposit,
            redeem,
        })
    }
}