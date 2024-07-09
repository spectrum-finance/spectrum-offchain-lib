import {
  Data,
  fromHex,
  fromText,
  Lucid,
  Script,
  toHex,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.5.9/index.js";
import { getLucid } from "./lucid.ts";
import { setupWallet } from "./wallet.ts";
import {
  DeploymentMintingOnetimeMint,
  PermManagerPermManager,
  VeFactoryMintVeCompositionToken,
} from "./../plutus.ts";
import { VotingEscrowVotingEscrow } from "../plutus.ts";
import { VotingEscrowMintGovernancePower } from "../plutus.ts";
import { GovProxyGovProxy } from "../plutus.ts";
import { VeFactoryVeFactory } from "../plutus.ts";
import { WeightingPollWpFactory } from "../plutus.ts";
import { WeightingPollMintWpAuthToken } from "../plutus.ts";
import { SmartFarmMintFarmAuthToken } from "../plutus.ts";
import { SmartFarmFarmFactory } from "../plutus.ts";
import { VotingEscrowMintWeightingPower } from "../plutus.ts";
import { InflationInflation } from "../plutus.ts";
import {
  BuiltValidators,
  DaoInput,
  DeployedValidators,
  NFTDetails,
  ScriptNames,
} from "./types.ts";
import { NFTNames } from "./types.ts";
import { sleep } from "../../splash-testing-cardano/src/helpers.ts";
import { walletFromSeed } from "https://deno.land/x/lucid@0.10.7/src/misc/wallet.ts";
import { mnemonicToEntropy } from "https://deno.land/x/lucid@0.10.7/src/misc/bip39.ts";
import { Bip32PrivateKey } from "https://deno.land/x/lucid@0.10.7/src/core/libs/cardano_multiplatform_lib/cardano_multiplatform_lib.generated.js";

const NFT_JSON_FILENAME = "nfts.json";
const BUILT_VALIDATORS_JSON_FILENAME = "validators.json";
const DEPLOYED_VALIDATORS_JSON_FILENAME = "deployedValidators.json";
const PREPROD_DEPLOYMENT_JSON_FILENAME = "preprod.deployment.json";
const TX_CONFIRMATION_WAIT_TIME = 120000;

const SPLASH_POLICY_ID =
  "adf2425c138138efce80fd0b2ed8f227caf052f9ec44b8a92e942dfa";
const SPLASH_ASSET_NAME = fromText("SPLASH");

const ZEROTH_EPOCH_START = 1717577607;
const INFLATION_BOX_INITIAL_SPLASH_QTY = 32000000000000n;

async function main() {
  // console.log(toHex(cbor.encode(new Uint8Array([]))));
  const lucid = await getLucid();
  const pubKey = await setupWallet(lucid);

  // SPECIFY SETTINGS HERE -------------------------------------------------------------------------

  // To differentiate different deployments for testing
  const postfix = "_22";
  const acceptedAssets = new Map();
  acceptedAssets.set({
    policy: SPLASH_POLICY_ID,
    name: SPLASH_ASSET_NAME,
  }, { num: 100n, den: 1000n });

  const daoInput: DaoInput = {
    inflation: 1n,
    votingEscrow: {
      lockedUntil: { Def: [1n] },
      owner: { PubKey: [pubKey] },
      maxExFee: 100000n,
      version: 1n,
      lastWpEpoch: 1n,
      lastGpDeadline: 1n,
    },
    farmFactory: {
      lastFarmId: 10007199254740991n,
      farmSeedData: toHex(cbor.encode(new Uint8Array([]))),
    },
    wpFactory: {
      lastPollEpoch: 0n,
      activeFarms: [fromText("farm0"), fromText("f1")],
    },
    veFactory: {
      acceptedAssets,
      legacyAcceptedAssets: new Map(),
    },
  };

  const theDatum = Data.to(daoInput.farmFactory, SmartFarmFarmFactory.state);
  console.log("Datum: " + theDatum);
  console.log("Datum hash: " + lucid.utils.datumToHash(theDatum));

  //------------------------------------------------------------------------------------------------

  //await mintNFTs(lucid, postfix);

  const nftDetails = JSON.parse(
    await Deno.readTextFile(NFT_JSON_FILENAME),
  );

  const txs = await deployValidators(lucid);
  const builtValidators = JSON.parse(
    await Deno.readTextFile(BUILT_VALIDATORS_JSON_FILENAME),
  );

  await getDeployedValidators(
    lucid,
    builtValidators,
    txs,
  );
  const deployedValidators = JSON.parse(
    await Deno.readTextFile(DEPLOYED_VALIDATORS_JSON_FILENAME),
  );

  await createEntities(lucid, deployedValidators, nftDetails, daoInput);
  const preprodConfig = {
    validators: deployedValidators,
    nfts: nftDetails,
  };
  await Deno.writeTextFile(
    PREPROD_DEPLOYMENT_JSON_FILENAME,
    toJson(preprodConfig),
  );
}

async function createMultipleMintingUtxOs(
  lucid: Lucid,
  addr: string,
  firstValuePerBox: bigint,
  subsequentValuePerBox: bigint,
) {
  const tx = await lucid.newTx()
    .payToAddress(addr, { lovelace: firstValuePerBox })
    .payToAddress(addr, { lovelace: subsequentValuePerBox })
    .payToAddress(addr, { lovelace: subsequentValuePerBox })
    .payToAddress(addr, { lovelace: subsequentValuePerBox })
    .payToAddress(addr, { lovelace: subsequentValuePerBox })
    .payToAddress(addr, { lovelace: subsequentValuePerBox })
    .payToAddress(addr, { lovelace: subsequentValuePerBox })
    .complete();

  const signedTx = await tx.sign().complete();

  const txHash = await signedTx.submit();
  console.log("Creating UTxOs. tx hash: " + txHash);
  await lucid.awaitTx(txHash);
  await sleep(TX_CONFIRMATION_WAIT_TIME);
  console.log("created multiple UTxOs.");
  return txHash;
}

async function mintNFTs(
  lucid: Lucid,
  namePostfix: string,
) {
  const myAddr = await lucid.wallet.address();

  const multipleUTxOTxId = await createMultipleMintingUtxOs(
    lucid,
    myAddr,
    20000000n,
    20000000n,
  );

  const utxos = (await lucid.utxosAt(myAddr)).filter((utxo) =>
    utxo.txHash === multipleUTxOTxId
  );

  const nftDetails = buildNFTDetails(
    lucid,
    multipleUTxOTxId,
    namePostfix,
  );
  let txBuilder = lucid.newTx().collectFrom(utxos);

  const keys = Object.keys(nftDetails) as NFTNames[];
  for (const key of keys) {
    const { script, policyId, assetName, quantity } = nftDetails[key];
    console.log("Policy ID for " + assetName + ": " + policyId);
    const unit = policyId + assetName;
    txBuilder = txBuilder
      .mintAssets({ [unit]: quantity }, Data.void())
      .attachMintingPolicy(script);
    console.log("Added mint to TX for " + assetName);
  }

  // Write to JSON
  const filePath = NFT_JSON_FILENAME;

  // Write the object to a JSON file
  await Deno.writeTextFile(filePath, toJson(nftDetails));

  const tx = await txBuilder.complete();
  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log("Minting NFTs. tx hash: " + txHash);
  console.log("Waiting for TX to be confirmed");
  await lucid.awaitTx(txHash);
  await sleep(TX_CONFIRMATION_WAIT_TIME);

  console.log("Minted NFTs.");
}

function buildNFTDetails(
  lucid: Lucid,
  multipleUTxOTxId: string,
  namePostfix: string,
): NFTDetails {
  const toMint: [Script, string][] = [];
  // 6 NFTs
  for (let i = 0; i < 6; i++) {
    const script = new DeploymentMintingOnetimeMint(
      {
        transactionId: { hash: multipleUTxOTxId },
        outputIndex: BigInt(i),
      },
      1n,
    );

    const policyId = lucid.utils.mintingPolicyToId(script);
    toMint.push([script, policyId]);
  }

  // gt_policy tokens
  const gtTokenQty = 45000000000000000n;
  const mintGTScript = new DeploymentMintingOnetimeMint({
    transactionId: { hash: multipleUTxOTxId },
    outputIndex: BigInt(6),
  }, gtTokenQty);
  const gtPolicyId = lucid.utils.mintingPolicyToId(mintGTScript);

  toMint.push([mintGTScript, gtPolicyId]);

  const toBuiltPolicy = (
    e: [Script, string],
    assetName: string,
    quantity: bigint,
  ) => {
    return {
      script: e[0],
      policyId: e[1],
      assetName: fromText(assetName + namePostfix),
      quantity,
    };
  };

  const toBuiltPolicyWithFixedName = (
    e: [Script, string],
    quantity: bigint,
  ) => {
    return {
      script: e[0],
      policyId: e[1],
      assetName: "a4",
      quantity,
    };
  };

  return {
    factory_auth: toBuiltPolicyWithFixedName(toMint[0], 1n),
    ve_factory_auth: toBuiltPolicyWithFixedName(toMint[1], 1n),
    perm_auth: toBuiltPolicyWithFixedName(toMint[2], 1n),
    proposal_auth: toBuiltPolicy(toMint[3], "proposal_auth", 1n),
    edao_msig: toBuiltPolicy(toMint[4], "edao_msig", 1n),
    ve_identifier: toBuiltPolicyWithFixedName(toMint[5], 1n),
    gt: toBuiltPolicy(toMint[6], "gt", gtTokenQty),
  };
}

async function deployValidators(
  lucid: Lucid,
): Promise<[string, string]> {
  const nftDetails = JSON.parse(await Deno.readTextFile(NFT_JSON_FILENAME));
  const factoryAuthPolicy = nftDetails.factory_auth.policyId;
  const gtPolicy = nftDetails.gt.policyId;
  const veFactoryAuthPolicy = nftDetails.ve_factory_auth.policyId;
  const proposalAuthPolicy = nftDetails.proposal_auth.policyId;
  const permManagerAuthPolicy = nftDetails.perm_auth.policyId;
  const edaoMSig = nftDetails.edao_msig.policyId;
  const veIdentifierPolicy = nftDetails.ve_identifier.policyId;

  const governancePowerScript = new VotingEscrowMintGovernancePower(
    proposalAuthPolicy,
    gtPolicy,
  );
  const governancePowerPolicy = lucid.utils.mintingPolicyToId(
    governancePowerScript,
  );

  const govProxyScript = new GovProxyGovProxy(
    veFactoryAuthPolicy,
    proposalAuthPolicy,
    governancePowerPolicy,
    gtPolicy,
  );
  const govProxyScriptHash = lucid.utils.validatorToScriptHash(govProxyScript);

  const veCompositionScript = new VeFactoryMintVeCompositionToken(
    factoryAuthPolicy,
  );
  const veCompositionPolicy = lucid.utils.mintingPolicyToId(
    veCompositionScript,
  );

  const votingEscrowScript = new VotingEscrowVotingEscrow(
    veFactoryAuthPolicy,
    veCompositionPolicy,
  );

  const veScriptHash = lucid.utils.validatorToScriptHash(
    votingEscrowScript,
  );

  const veFactoryScript = new VeFactoryVeFactory(
    factoryAuthPolicy,
    veIdentifierPolicy,
    veCompositionPolicy,
    gtPolicy,
    veScriptHash,
    govProxyScriptHash,
  );
  const veFactoryScriptHash = lucid.utils.mintingPolicyToId(veFactoryScript);

  // `mint_farm_auth_token` is a multivalidator with `smart_farm`
  const farmAuthScript = new SmartFarmMintFarmAuthToken(
    SPLASH_POLICY_ID,
    factoryAuthPolicy,
  );

  const farmAuthScriptHash = lucid.utils.validatorToScriptHash(
    farmAuthScript,
  );

  const farmAuthPolicy = lucid.utils.mintingPolicyToId(farmAuthScript);
  const zerothEpochStart = 1000n;

  const wpAuthScript = new WeightingPollMintWpAuthToken(
    SPLASH_POLICY_ID,
    farmAuthPolicy,
    factoryAuthPolicy,
    zerothEpochStart,
  );
  const wpAuthPolicy = lucid.utils.mintingPolicyToId(wpAuthScript);

  const wpFactoryScript = new WeightingPollWpFactory(
    wpAuthPolicy,
    govProxyScriptHash,
  );
  const wpFactoryScriptHash = lucid.utils.validatorToScriptHash(
    wpFactoryScript,
  );

  const farmFactoryScript = new SmartFarmFarmFactory(
    farmAuthPolicy,
    govProxyScriptHash,
  );

  const farmFactoryScriptHash = lucid.utils.validatorToScriptHash(
    farmFactoryScript,
  );

  const weightingPowerScript = new VotingEscrowMintWeightingPower(
    zerothEpochStart,
    proposalAuthPolicy,
    gtPolicy,
  );

  const weightingPowerScriptHash = lucid.utils.validatorToScriptHash(
    weightingPowerScript,
  );

  const weightingPowerPolicy = lucid.utils.mintingPolicyToId(
    weightingPowerScript,
  );

  const inflationScript = new InflationInflation(
    SPLASH_POLICY_ID,
    wpAuthPolicy,
    weightingPowerPolicy,
    zerothEpochStart,
  );

  const inflationScriptHash = lucid.utils.validatorToScriptHash(
    inflationScript,
  );

  const permManagerScript = new PermManagerPermManager(
    edaoMSig,
    permManagerAuthPolicy,
  );
  const permManagerScriptHash = lucid.utils.validatorToScriptHash(
    permManagerScript,
  );

  const builtValidators: BuiltValidators = {
    inflation: {
      script: inflationScript,
      hash: inflationScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    votingEscrow: {
      script: votingEscrowScript,
      hash: veScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    farmFactory: {
      script: farmFactoryScript,
      hash: farmFactoryScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    wpFactory: {
      script: wpFactoryScript,
      hash: wpFactoryScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    veFactory: {
      script: veFactoryScript,
      hash: veFactoryScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    govProxy: {
      script: govProxyScript,
      hash: govProxyScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    permManager: {
      script: permManagerScript,
      hash: permManagerScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    mintWPAuthToken: {
      script: wpAuthScript,
      hash: wpAuthPolicy,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    mintVECompositionToken: {
      script: veCompositionScript,
      hash: veCompositionPolicy,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    weightingPower: {
      script: weightingPowerScript,
      hash: weightingPowerScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
    smartFarm: {
      script: farmAuthScript,
      hash: farmAuthScriptHash,
      cost: {
        mem: 500000n,
        steps: 200000000n,
      },
    },
  };

  // Write the object to a JSON file
  await Deno.writeTextFile(
    BUILT_VALIDATORS_JSON_FILENAME,
    toJson(builtValidators),
  );

  const ns: Script = lucid.utils.nativeScriptFromJson({
    type: "before",
    slot: 0,
  });
  const lockScript = lucid.utils.validatorToAddress(ns);
  //const tx0 = await lucid
  //  .newTx()
  //  .payToAddressWithData(
  //    lockScript,
  //    { scriptRef: builtValidators.inflation.script },
  //    {},
  //  )
  //  .payToAddressWithData(
  //    lockScript,
  //    { scriptRef: builtValidators.votingEscrow.script },
  //    {},
  //  )
  //  .payToAddressWithData(
  //    lockScript,
  //    { scriptRef: builtValidators.farmFactory.script },
  //    {},
  //  )
  //  .payToAddressWithData(
  //    lockScript,
  //    { scriptRef: builtValidators.wpFactory.script },
  //    {},
  //  )
  //  .payToAddressWithData(
  //    lockScript,
  //    { scriptRef: builtValidators.mintVECompositionToken.script },
  //    {},
  //  )
  //  .complete();
  //const signedTx0 = await tx0.sign().complete();
  //const txHash0 = await signedTx0.submit();
  //console.log("Deploying validators (first batch). tx hash: " + txHash0);
  //console.log("Waiting for TX to be confirmed");
  //await lucid.awaitTx(txHash0);
  //await sleep(TX_CONFIRMATION_WAIT_TIME);

  const tx = await lucid
    .newTx()
    .payToAddressWithData(
      lockScript,
      { scriptRef: builtValidators.veFactory.script },
      {},
    )
    .payToAddressWithData(
      lockScript,
      { scriptRef: builtValidators.govProxy.script },
      {},
    )
    .payToAddressWithData(
      lockScript,
      { scriptRef: builtValidators.permManager.script },
      {},
    )
    .payToAddressWithData(
      lockScript,
      { scriptRef: builtValidators.mintWPAuthToken.script },
      {},
    )
    .payToAddressWithData(
      lockScript,
      { scriptRef: builtValidators.weightingPower.script },
      {},
    )
    .payToAddressWithData(
      lockScript,
      { scriptRef: builtValidators.smartFarm.script },
      {},
    )
    .complete();
  const signedTx = await tx.sign().complete();
  const txHash1 = await signedTx.submit();
  console.log("Deploying validators (2nd batch). tx hash: " + txHash1);
  console.log("Waiting for TX to be confirmed");
  await lucid.awaitTx(txHash1);
  await sleep(TX_CONFIRMATION_WAIT_TIME);

  const txHash0 =
    "32e373da8cde77e7d3742ba0a392b1e296fadbd9bb6d169783a3a54fa8d26f23";
  return [txHash0, txHash1];
}

async function createEntities(
  lucid: Lucid,
  dv: DeployedValidators,
  nftDetails: NFTDetails,
  daoInput: DaoInput,
) {
  const permManagerAuthToken = nftDetails.perm_auth.policyId +
    nftDetails.perm_auth.assetName;
  const veFactoryAuthToken = nftDetails.ve_factory_auth.policyId +
    nftDetails.ve_factory_auth.assetName;
  const gtToken = nftDetails.gt.policyId + nftDetails.gt.assetName;
  const factoryAuthToken = nftDetails.factory_auth.policyId +
    nftDetails.factory_auth.assetName;

  const toAddr = (hash: string) =>
    lucid.utils.credentialToAddress(
      { hash, type: "Script" },
    );

  const qty = 10000000n;

  const tx = await lucid.newTx()
    .readFrom([
      dv.inflation.referenceUtxo,
      dv.votingEscrow.referenceUtxo,
      dv.farmFactory.referenceUtxo,
      dv.wpFactory.referenceUtxo,
      dv.veFactory.referenceUtxo,
      dv.govProxy.referenceUtxo,
      dv.permManager.referenceUtxo,
    ])
    .payToContract(
      toAddr(dv.inflation.hash),
      Data.to(daoInput.inflation, InflationInflation.epoch),
      { lovelace: qty },
    )
    .payToContract(
      toAddr(dv.votingEscrow.hash),
      Data.to(daoInput.votingEscrow, VotingEscrowVotingEscrow.state),
      {
        lovelace: qty,
        [veFactoryAuthToken]: 1n,
        [gtToken]: BigInt(nftDetails.gt.quantity),
      },
    )
    .payToContract(
      toAddr(dv.farmFactory.hash),
      { inline: Data.to(daoInput.farmFactory, SmartFarmFarmFactory.state) },
      { lovelace: 5n * qty, [factoryAuthToken]: 1n },
    )
    .payToContract(
      toAddr(dv.wpFactory.hash),
      Data.to(daoInput.wpFactory, WeightingPollWpFactory.state),
      { lovelace: qty },
    )
    .payToContract(
      toAddr(dv.veFactory.hash),
      Data.to(daoInput.veFactory, VeFactoryVeFactory.conf),
      { lovelace: qty },
    )
    .payToAddress(
      toAddr(dv.govProxy.hash),
      { lovelace: qty },
    )
    .payToContract(
      toAddr(dv.permManager.hash),
      Data.void(),
      { lovelace: qty, [permManagerAuthToken]: 1n },
    ).complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log("Creating entities. TX hash: " + txHash);
  console.log("Waiting for TX to be confirmed");
  await lucid.awaitTx(txHash);
  await sleep(TX_CONFIRMATION_WAIT_TIME);

  console.log("Entities created.");

  // Create smart_farm and farm_factory
  //
  // farm_auth token
  const mintFarmAuthScript = new SmartFarmMintFarmAuthToken(
    SPLASH_POLICY_ID,
    nftDetails.factory_auth.policyId,
  );
  const mintFarmAuthScriptHash = lucid.utils.validatorToScriptHash(
    mintFarmAuthScript,
  );
  console.log("mint_farm_auth_script_hash: " + mintFarmAuthScriptHash);

  const newFarmId = daoInput.farmFactory.lastFarmId + 1n;
  console.log("new farm id: " + newFarmId);
  const farmAssetName = toHex(cbor.encode(newFarmId));
  console.log("farm asset name: " + farmAssetName);
  const farmAuthToken = mintFarmAuthScriptHash + farmAssetName;

  const factoryOutDatum = {
    lastFarmId: newFarmId,
    farmSeedData: daoInput.farmFactory.farmSeedData,
  };

  const farmFactoryAddr = await lucid.utils.validatorToAddress(
    dv.farmFactory.script,
  );

  console.log(farmFactoryAddr);

  const utxos = (await lucid.utxosAt(farmFactoryAddr)).filter((utxo) =>
    utxo.txHash === txHash
  );
  console.log(utxos);

  const step0 = lucid.newTx()
    .readFrom([
      dv.farmFactory.referenceUtxo,
      // dv.smartFarm.referenceUtxo,
    ])
    .collectFrom(
      utxos,
      Data.to("CreateFarm", SmartFarmFarmFactory.action),
    )
    .attachMintingPolicy(mintFarmAuthScript)
    .mintAssets(
      { [farmAuthToken]: 1n },
      Data.to(
        { MintAuthToken: { factoryInIx: 0n } },
        SmartFarmMintFarmAuthToken.action,
      ),
    );

  console.log("added minting to TX");
  const step1 = step0.payToContract(
    toAddr(dv.farmFactory.hash),
    { inline: Data.to(factoryOutDatum, SmartFarmFarmFactory.state) },
    { lovelace: 5n * qty, [factoryAuthToken]: 1n },
  );
  console.log("add output to factory ");
  try {
    const farmTx0 = step1
      .payToContract(
        toAddr(mintFarmAuthScriptHash),
        { inline: Data.to(toHex(new Uint8Array([]))) },
        { lovelace: qty, [farmAuthToken]: 1n },
      );
    //const farmTx = await farmTx0.complete({ nativeUplc: true });
    const farmTx = await farmTx0.complete();

    console.log("Trying to sign TX");
    const txComplete = farmTx.sign();
    console.log("TX successfully signed");
    const signedFarmTx = await txComplete.complete();
    console.log("TX successfully completed");
    const farmTxHash = await signedFarmTx.submit();
    console.log("Creating smart_farm and farm_factory. TX hash: " + farmTxHash);
    console.log("Waiting for TX to be confirmed");
    await lucid.awaitTx(farmTxHash);
    await sleep(TX_CONFIRMATION_WAIT_TIME);

    console.log("smart_farm and farm_factory created.");
  } catch (error) {
    console.log(error);
  }
}

async function getDeployedValidators(
  lucid: Lucid,
  builtValidators: BuiltValidators,
  deployedValidatorsTxId: [string, string],
) {
  try {
    const builtValidatorsKeys = Object.keys(builtValidators) as ScriptNames[];
    const left = builtValidatorsKeys.slice(0, 5).map((_, index) => ({
      txHash: deployedValidatorsTxId[0],
      outputIndex: index,
    }));
    const right = builtValidatorsKeys.slice(5, builtValidatorsKeys.length).map((
      _,
      index,
    ) => ({
      txHash: deployedValidatorsTxId[1],
      outputIndex: index,
    }));

    const utxosByOutRefsRequest = left.concat(right);

    const validatorsUtxos = await lucid.utxosByOutRef(utxosByOutRefsRequest);

    const deployedValidators = builtValidatorsKeys.reduce((
      acc,
      key: ScriptNames,
      index,
    ) => {
      const { script, hash, cost } = builtValidators[key];
      const referenceUtxo = validatorsUtxos[index];

      return {
        [key]: {
          script,
          hash,
          referenceUtxo,
          cost,
        },
        ...acc,
      };
    }, {} as DeployedValidators);

    console.log(deployedValidators);

    const filepath = DEPLOYED_VALIDATORS_JSON_FILENAME;
    // Write the object to a JSON file
    await Deno.writeTextFile(
      filepath,
      toJson(deployedValidators),
    );
  } catch (error) {
    console.error("Failed to get deployed validators:", error);
    throw error;
  }
}

async function createInflationBox() {
  const lucid = await getLucid();
  const _ = await setupWallet(lucid);

  const toAddr = (hash: string) =>
    lucid.utils.credentialToAddress(
      { hash, type: "Script" },
    );

  const deployedValidators: DeployedValidators = JSON.parse(
    await Deno.readTextFile(DEPLOYED_VALIDATORS_JSON_FILENAME),
  );

  const splashToken = SPLASH_POLICY_ID + SPLASH_ASSET_NAME;

  const tx = await lucid.newTx()
    .readFrom([
      deployedValidators.inflation.referenceUtxo,
      deployedValidators.wpFactory.referenceUtxo,
    ])
    .payToContract(toAddr(deployedValidators.inflation.hash), {
      inline: Data.to(0n),
    }, { lovelace: 3000000n, [splashToken]: INFLATION_BOX_INITIAL_SPLASH_QTY })
    .payToContract(toAddr(deployedValidators.wpFactory.hash), {
      inline: Data.to({
        lastPollEpoch: 0n,
        activeFarms: [fromText("farm0"), fromText("f1")],
      }, WeightingPollWpFactory.state),
    }, { lovelace: 3000000n })
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log("Creating inflation box. TX hash: " + txHash);
  console.log("Waiting for TX to be confirmed");
  await lucid.awaitTx(txHash);
}

// From: https://stackoverflow.com/a/58253280
function toJson(data) {
  if (data !== undefined) {
    return JSON.stringify(
      data,
      (_, v) => typeof v === "bigint" ? `${v}#bigint` : v,
    )
      .replace(/"(-?\d+)#bigint"/g, (_, a) => a);
  }
}

// Utility function to generate a new wallet seed
async function generateSeed() {
  const lucid = await getLucid();
  const seedPhrase = lucid.utils.generateSeedPhrase();
  const fromSeed = walletFromSeed(
    seedPhrase,
    {
      addressType: "Base",
      accountIndex: 0,
    },
  );
  console.log(seedPhrase);
  console.log(fromSeed.address);
}

function computePrivateKeyFromSeedPhrase(seedPhrase: string) {
  const entropy = mnemonicToEntropy(seedPhrase);

  // Encode the string into a Uint8Array
  console.log(
    Bip32PrivateKey.from_bip39_entropy(fromHex(entropy), new Uint8Array())
      .to_bech32(),
  );
  const s = walletFromSeed(seedPhrase, {
    addressType: "Base",
    accountIndex: 0,
  });
  console.log(s.address);
}

async function mintTestSplashTokens() {
  const lucid = await getLucid();
  const pubKey = await setupWallet(lucid);
  const { paymentCredential } = lucid.utils.getAddressDetails(
    await lucid.wallet.address(),
  );

  const mintingPolicy = lucid.utils.nativeScriptFromJson(
    {
      type: "all",
      scripts: [
        { type: "sig", keyHash: paymentCredential.hash },
        {
          type: "before",
          slot: lucid.utils.unixTimeToSlot(Date.now() + 1000000),
        },
      ],
    },
  );

  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);

  const unit = policyId + SPLASH_ASSET_NAME;
  console.log("SPLASH policy id: " + policyId);

  const tx = await lucid.newTx()
    .mintAssets({ [unit]: 32000000000000n })
    .validTo(Date.now() + 200000)
    .attachMintingPolicy(mintingPolicy)
    .complete();

  const signedTx = await tx.sign().complete();

  console.log("Minting test Splash tokens");
  const txHash = await signedTx.submit();
  console.log("Splash mint TX hash: " + txHash);
}

async function payToAddress(addr: string) {
  const lucid = await getLucid();
  const _ = await setupWallet(lucid);
  const tx = await lucid.newTx().payToAddress(addr, { lovelace: 8500000000n })
    .complete();
  const signedTx = await tx.sign().complete();

  console.log("Pay to " + addr);
  const txHash = await signedTx.submit();
  console.log("TX hash: " + txHash);
}

// generateSeed();
// payToAddress(
//   "addr_test1qpwzf2m5v6asfh6zwm43qepax5qt4na4eutzlr87xle49u3gckxq0mxjqykxc6pmgn8fdy02nv8ahxuxsyj69tpf8q3s3xr02r",
// );
// main();
// mintTestSplashTokens();
createInflationBox();