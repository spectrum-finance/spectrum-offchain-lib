use pallas_network::miniprotocols::Point;

#[derive(Clone)]
pub enum ChainUpgrade<Block> {
    RollForward(Block),
    RollBackward(Point),
}

#[derive(Clone, Debug)]
pub enum LedgerTxEvent<Tx> {
    TxApplied { tx: Tx, slot: u64 },
    TxUnapplied(Tx),
}
