use cardano_explorer::constants::get_network_id;
use cml_chain::address::{Address, EnterpriseAddress};
use cml_chain::assets::AssetName;
use cml_chain::builders::tx_builder::TransactionUnspentOutput;
use cml_chain::certs::StakeCredential;
use cml_chain::PolicyId;
use cml_crypto::{Bip32PrivateKey, Ed25519KeyHash, PrivateKey};
use spectrum_cardano_lib::collateral::Collateral;
use spectrum_offchain::data::Has;
use spectrum_offchain_cardano::creds::operator_creds;
use spectrum_offchain_cardano::deployment::DeployedScriptInfo;
use type_equalities::IsEqual;

use crate::deployment::{DeployedValidators, MintedTokens, ProtocolDeployment, ProtocolValidator};
use crate::entities::onchain::inflation_box::InflationBoxId;
use crate::entities::onchain::permission_manager::PermManagerId;
use crate::entities::onchain::poll_factory::PollFactoryId;
use crate::entities::onchain::weighting_poll::WeightingPollId;
use crate::time::ProtocolEpoch;
use crate::GenesisEpochStartTime;

#[derive(Clone)]
pub struct ProtocolConfig {
    pub deployed_validators: ProtocolDeployment,
    pub tokens: ProtocolTokens,
    pub operator_sk: String,
    pub node_magic: u64,
    pub reward_address: cml_chain::address::RewardAddress,
    pub collateral: Collateral,
    pub genesis_time: GenesisEpochStartTime,
}

impl ProtocolConfig {
    pub fn poll_id(&self, epoch: ProtocolEpoch) -> WeightingPollId {
        WeightingPollId(0)
    }
}

#[derive(Clone)]
pub struct ProtocolTokens {
    pub splash_policy: PolicyId,
    pub splash_name: AssetName,
    pub factory_auth_policy: PolicyId,
    pub ve_factory_auth_policy: PolicyId,
    pub ve_factory_auth_name: AssetName,
    pub edao_msig_policy: PolicyId,
    pub perm_manager_auth_policy: PolicyId,
    pub perm_manager_auth_name: AssetName,
    pub gt_policy: PolicyId,
    pub gt_name: AssetName,
}

impl ProtocolTokens {
    pub fn from_minted_tokens(value: MintedTokens, splash_policy: PolicyId, splash_name: AssetName) -> Self {
        Self {
            splash_policy,
            splash_name,
            factory_auth_policy: value.factory_auth.policy_id,
            ve_factory_auth_policy: value.ve_factory_auth.policy_id,
            ve_factory_auth_name: value.ve_factory_auth.asset_name,
            edao_msig_policy: value.edao_msig.policy_id,
            perm_manager_auth_policy: value.perm_auth.policy_id,
            perm_manager_auth_name: value.perm_auth.asset_name,
            gt_policy: value.gt.policy_id,
            gt_name: value.gt.asset_name,
        }
    }
}

#[derive(Debug, Clone)]
pub struct InflationBoxRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct Reward(pub cml_chain::address::RewardAddress);

#[derive(Debug, Clone)]
pub struct SplashPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct SplashAssetName(pub AssetName);

#[derive(Debug, Clone)]
pub struct PollFactoryRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct WPAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct WPAuthRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct FarmAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct FarmAuthRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct FactoryAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct VEFactoryAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct VEFactoryAuthName(pub AssetName);

#[derive(Debug, Clone)]
pub struct VotingEscrowRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct WeightingPowerRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct PermManagerBoxRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct GovProxyRefScriptOutput(pub TransactionUnspentOutput);

#[derive(Debug, Clone)]
pub struct EDaoMSigAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct PermManagerAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct PermManagerAuthName(pub AssetName);

#[derive(Debug, Clone)]
pub struct GTAuthPolicy(pub PolicyId);

#[derive(Debug, Clone)]
pub struct GTAuthName(pub AssetName);

#[derive(Debug, Clone)]
pub struct NodeMagic(pub u64);

pub struct OperatorCreds(pub PrivateKey, pub Ed25519KeyHash, pub Address);

impl Has<Reward> for ProtocolConfig {
    fn select<U: IsEqual<Reward>>(&self) -> Reward {
        Reward(self.reward_address.clone())
    }
}

impl Has<Collateral> for ProtocolConfig {
    fn select<U: IsEqual<Collateral>>(&self) -> Collateral {
        self.collateral.clone()
    }
}

impl Has<SplashPolicy> for ProtocolConfig {
    fn select<U: IsEqual<SplashPolicy>>(&self) -> SplashPolicy {
        SplashPolicy(self.tokens.splash_policy)
    }
}

impl Has<SplashAssetName> for ProtocolConfig {
    fn select<U: IsEqual<SplashAssetName>>(&self) -> SplashAssetName {
        SplashAssetName(self.tokens.splash_name.clone())
    }
}

impl Has<InflationBoxRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<InflationBoxRefScriptOutput>>(&self) -> InflationBoxRefScriptOutput {
        InflationBoxRefScriptOutput(self.deployed_validators.inflation.reference_utxo.clone())
    }
}

impl Has<PollFactoryRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<PollFactoryRefScriptOutput>>(&self) -> PollFactoryRefScriptOutput {
        PollFactoryRefScriptOutput(self.deployed_validators.wp_factory.reference_utxo.clone())
    }
}

impl Has<WPAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<WPAuthPolicy>>(&self) -> WPAuthPolicy {
        WPAuthPolicy(self.deployed_validators.mint_wpauth_token.hash)
    }
}

impl Has<WPAuthRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<WPAuthRefScriptOutput>>(&self) -> WPAuthRefScriptOutput {
        WPAuthRefScriptOutput(self.deployed_validators.mint_wpauth_token.reference_utxo.clone())
    }
}

impl Has<FarmAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<FarmAuthPolicy>>(&self) -> FarmAuthPolicy {
        // Note that this policy is a multivalidator with `smart_farm`
        FarmAuthPolicy(self.deployed_validators.smart_farm.hash)
    }
}

impl Has<FarmAuthRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<FarmAuthRefScriptOutput>>(&self) -> FarmAuthRefScriptOutput {
        FarmAuthRefScriptOutput(self.deployed_validators.smart_farm.reference_utxo.clone())
    }
}

impl Has<FactoryAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<FactoryAuthPolicy>>(&self) -> FactoryAuthPolicy {
        FactoryAuthPolicy(self.tokens.factory_auth_policy)
    }
}

impl Has<VEFactoryAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<VEFactoryAuthPolicy>>(&self) -> VEFactoryAuthPolicy {
        VEFactoryAuthPolicy(self.tokens.ve_factory_auth_policy)
    }
}

impl Has<VEFactoryAuthName> for ProtocolConfig {
    fn select<U: IsEqual<VEFactoryAuthName>>(&self) -> VEFactoryAuthName {
        VEFactoryAuthName(self.tokens.ve_factory_auth_name.clone())
    }
}

impl Has<VotingEscrowRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<VotingEscrowRefScriptOutput>>(&self) -> VotingEscrowRefScriptOutput {
        VotingEscrowRefScriptOutput(self.deployed_validators.voting_escrow.reference_utxo.clone())
    }
}

impl Has<WeightingPowerRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<WeightingPowerRefScriptOutput>>(&self) -> WeightingPowerRefScriptOutput {
        todo!()
    }
}

impl Has<PermManagerBoxRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<PermManagerBoxRefScriptOutput>>(&self) -> PermManagerBoxRefScriptOutput {
        PermManagerBoxRefScriptOutput(self.deployed_validators.perm_manager.reference_utxo.clone())
    }
}

impl Has<EDaoMSigAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<EDaoMSigAuthPolicy>>(&self) -> EDaoMSigAuthPolicy {
        EDaoMSigAuthPolicy(self.tokens.edao_msig_policy)
    }
}

impl Has<PermManagerAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<PermManagerAuthPolicy>>(&self) -> PermManagerAuthPolicy {
        PermManagerAuthPolicy(self.tokens.perm_manager_auth_policy)
    }
}

impl Has<PermManagerAuthName> for ProtocolConfig {
    fn select<U: IsEqual<PermManagerAuthName>>(&self) -> PermManagerAuthName {
        PermManagerAuthName(self.tokens.perm_manager_auth_name.clone())
    }
}

impl Has<GovProxyRefScriptOutput> for ProtocolConfig {
    fn select<U: IsEqual<GovProxyRefScriptOutput>>(&self) -> GovProxyRefScriptOutput {
        GovProxyRefScriptOutput(self.deployed_validators.gov_proxy.reference_utxo.clone())
    }
}

impl Has<GTAuthPolicy> for ProtocolConfig {
    fn select<U: IsEqual<GTAuthPolicy>>(&self) -> GTAuthPolicy {
        GTAuthPolicy(self.tokens.gt_policy)
    }
}

impl Has<GTAuthName> for ProtocolConfig {
    fn select<U: IsEqual<GTAuthName>>(&self) -> GTAuthName {
        GTAuthName(self.tokens.gt_name.clone())
    }
}

impl Has<GenesisEpochStartTime> for ProtocolConfig {
    fn select<U: IsEqual<GenesisEpochStartTime>>(&self) -> GenesisEpochStartTime {
        self.genesis_time
    }
}

impl Has<NodeMagic> for ProtocolConfig {
    fn select<U: IsEqual<NodeMagic>>(&self) -> NodeMagic {
        NodeMagic(self.node_magic)
    }
}

impl Has<OperatorCreds> for ProtocolConfig {
    fn select<U: IsEqual<OperatorCreds>>(&self) -> OperatorCreds {
        let (operator_sk, _operator_pkh, operator_cred) = operator_creds(&self.operator_sk);
        let operator_pk = operator_sk.to_public();
        let operator_pkh = operator_pk.hash();
        let network_id = get_network_id(self.node_magic);
        let addr =
            EnterpriseAddress::new(network_id, StakeCredential::new_pub_key(operator_pkh)).to_address();
        OperatorCreds(operator_sk, operator_cred.0, addr)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::GovProxy as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::GovProxy as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::GovProxy as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.gov_proxy)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::WpAuthPolicy as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::WpAuthPolicy as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::WpAuthPolicy as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.mint_wpauth_token)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::VotingEscrow as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::VotingEscrow as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::VotingEscrow as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.voting_escrow)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::Inflation as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::Inflation as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::Inflation as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.inflation)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::PermManager as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::PermManager as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::PermManager as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.perm_manager)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::WpFactory as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::WpFactory as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::WpFactory as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.wp_factory)
    }
}

impl Has<DeployedScriptInfo<{ ProtocolValidator::SmartFarm as u8 }>> for ProtocolConfig {
    fn select<U: IsEqual<DeployedScriptInfo<{ ProtocolValidator::SmartFarm as u8 }>>>(
        &self,
    ) -> DeployedScriptInfo<{ ProtocolValidator::SmartFarm as u8 }> {
        DeployedScriptInfo::from(&self.deployed_validators.smart_farm)
    }
}

pub const TX_FEE_CORRECTION: u64 = 1000;
