use async_trait::async_trait;
use cardano_chain_sync::data::LedgerTxEvent;
use cml_crypto::TransactionHash;
use cml_multi_era::babbage::BabbageTransaction;
use spectrum_offchain::event_sink::event_handler::EventHandler;

type ProcessingTransaction = (TransactionHash, BabbageTransaction);

/// This event handler simply forwards the [`LedgerTxEvent`] to the `Behaviour` since the
/// deserialization of [`crate::entities::onchain::weighting_poll::WeightingPoll`]
/// requires the current epoch, which is only obtainable from `Behaviour`
pub struct DaoHandler {
    tx: tokio::sync::mpsc::Sender<LedgerTxEvent<ProcessingTransaction>>,
}

impl DaoHandler {
    pub fn new(tx: tokio::sync::mpsc::Sender<LedgerTxEvent<ProcessingTransaction>>) -> Self {
        Self { tx }
    }
}

#[async_trait(?Send)]
impl EventHandler<LedgerTxEvent<ProcessingTransaction>> for DaoHandler {
    async fn try_handle(
        &mut self,
        ev: LedgerTxEvent<ProcessingTransaction>,
    ) -> Option<LedgerTxEvent<ProcessingTransaction>> {
        self.tx.send(ev).await.unwrap();
        None
    }
}
