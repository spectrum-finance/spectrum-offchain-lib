use cml_chain::PolicyId;
use lazy_static::lazy_static;

use serde::{Deserialize, Serialize};
use spectrum_cardano_lib::{AssetClass, AssetName};

#[derive(Clone, Serialize, Deserialize)]
pub struct Splash;

lazy_static! {
    pub static ref SPLASH_AC: AssetClass = AssetClass::Token((
        PolicyId::from_hex("adf2425c138138efce80fd0b2ed8f227caf052f9ec44b8a92e942dfa").unwrap(),
        AssetName::utf8_unsafe("SPLASH".to_string())
    ));
}
