use cml_chain::address::{Address, BaseAddress, EnterpriseAddress, RewardAddress};
use cml_chain::certs::StakeCredential;
use cml_chain::genesis::network_info::NetworkInfo;
use cml_crypto::{Bip32PrivateKey, Ed25519KeyHash, PrivateKey};
use derive_more::{From, Into};

use cardano_explorer::constants::get_network_id;
use spectrum_cardano_lib::PaymentCredential;

#[derive(serde::Deserialize, Debug, Clone, Into, From)]
pub struct OperatorRewardAddress(pub Address);

#[derive(serde::Deserialize, Debug, Copy, Clone, Into, From)]
pub struct OperatorCred(pub Ed25519KeyHash);

pub fn operator_creds(operator_sk_raw: &str) -> (PrivateKey, PaymentCredential, OperatorCred) {
    let operator_prv_bip32 = Bip32PrivateKey::from_bech32(operator_sk_raw).expect("wallet error");
    let operator_prv = operator_prv_bip32.to_raw_key();
    let operator_pk = operator_prv.to_public();
    let operator_pkh = operator_pk.hash();
    (
        operator_prv,
        operator_pkh.to_bech32("addr_vkh").unwrap().into(),
        operator_pkh.into(),
    )
}

pub fn operator_creds_base_address(
    operator_sk_raw: &str,
    network_magic: u64,
) -> (
    Address,
    RewardAddress,
    PaymentCredential,
    OperatorCred,
    PrivateKey,
) {
    let root_key = Bip32PrivateKey::from_bech32(operator_sk_raw).expect("wallet error");
    let account_key = root_key
        .derive(1852 + 0x80000000)
        .derive(1815 + 0x80000000)
        .derive(0x80000000);
    let payment_key = account_key.derive(0).derive(0).to_raw_key();
    let stake_key = account_key.derive(2).derive(0).to_raw_key();

    let payment_key_hash = payment_key.to_public().hash();
    let stake_key_hash = stake_key.to_public().hash();

    let network_id = get_network_id(network_magic);
    let addr = BaseAddress::new(
        network_id,
        StakeCredential::new_pub_key(payment_key_hash),
        StakeCredential::new_pub_key(stake_key_hash),
    )
    .to_address();
    let reward_addr = RewardAddress::new(network_id, StakeCredential::new_pub_key(stake_key_hash));
    let encoded_addr = addr.to_bech32(None).unwrap();
    let payment_cred = payment_key_hash.to_bech32("addr_vkh").unwrap().into();
    println!("PAYMENT_CRED raw bytes: {:?}", payment_key_hash);
    println!(
        "ADDRESS raw bytes: {:?}",
        account_key.to_public().to_raw_key().hash()
    );
    println!("PAYMENT_CRED: {:?}", payment_cred);
    println!("ADDRESS: {:?}", encoded_addr);
    (
        addr,
        reward_addr,
        payment_cred,
        payment_key_hash.into(),
        payment_key,
    )
}
