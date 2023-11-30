use std::fmt::{Debug, Formatter};

use rand::{thread_rng, RngCore};

mod effect;
mod interpreter;
pub mod liquidity_book;
mod source_db;

#[derive(Copy, Clone, Eq, PartialEq, Hash)]
pub struct SourceId([u8; 32]);

impl SourceId {
    #[cfg(test)]
    pub fn random() -> SourceId {
        let mut bf = [0u8; 32];
        thread_rng().fill_bytes(&mut bf);
        SourceId(bf)
    }
}

impl Debug for SourceId {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*hex::encode(&self.0))
    }
}
