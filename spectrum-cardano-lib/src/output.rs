use cml_chain::transaction::TransactionOutput;
use cml_multi_era::babbage::BabbageTransactionOutput;
use serde::{Deserialize, Serialize};

use crate::transaction::BabbageTransactionOutputExtension;
use crate::OutputRef;

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct FinalizedTxOut(pub TransactionOutput, pub OutputRef);

impl FinalizedTxOut {
    pub fn new(out: BabbageTransactionOutput, out_ref: OutputRef) -> Self {
        Self(out.upcast(), out_ref)
    }
}
