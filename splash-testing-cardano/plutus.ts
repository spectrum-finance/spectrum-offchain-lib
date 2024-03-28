// deno-lint-ignore-file
import {
  applyParamsToScript,
  Data,
  Validator,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";

export interface IBeaconBeacon {
  new (
    ref: { transactionId: { hash: string }; outputIndex: bigint },
  ): Validator;
  _: Data;
}

export const BeaconBeacon = Object.assign(
  function (ref: { transactionId: { hash: string }; outputIndex: bigint }) {
    return {
      type: "PlutusV2",
      script: applyParamsToScript(
        "5901f001000032323232323232323222253330063253330073370e90001803000899191919299980599b88480000044c94ccc030cdc3a40006016002266ebcc00cc028c044c02800402458ccc8c0040048894ccc044008530103d87a80001323253330103370e0069000099ba548000cc0500092f5c0266600a00a00266e0400d2002301500330130023758600460126004601200c90000a5132323232533300e3370e90010008a400026eb4c04cc030008c030004c94ccc034cdc3a40040022980103d87a8000132323300100100222533301300114c103d87a800013232323253330143371e91101010000213374a90001980c1ba80014bd700998030030019bad3015003375c6026004602e004602a0026eacc048c02c008c02c004c8cc004004008894ccc0400045300103d87a800013232323253330113371e012004266e95200033015374c00297ae0133006006003375660240066eb8c040008c050008c048004c8c8cc004004008894ccc04000452f5bded8c0264646464a66602266e3d221000021003133015337606ea4008dd3000998030030019bab3012003375c6020004602800460240026eacc03cc040c040c040c040c020c004c0200148c03c004dd7180680098028008b1805980618020008a4c26cac4600a6ea80048c00cdd5000ab9a5573aaae7955cfaba05742ae881",
        [ref],
        {
          "dataType": "list",
          "items": [{
            "title": "OutputReference",
            "description":
              "An `OutputReference` is a unique reference to an output on-chain. The `output_index`\n corresponds to the position in the output list of the transaction (identified by its id)\n that produced that output",
            "anyOf": [{
              "title": "OutputReference",
              "dataType": "constructor",
              "index": 0,
              "fields": [{
                "title": "transactionId",
                "description":
                  "A unique transaction identifier, as the hash of a transaction body. Note that the transaction id\n isn't a direct hash of the `Transaction` as visible on-chain. Rather, they correspond to hash\n digests of transaction body as they are serialized on the network.",
                "anyOf": [{
                  "title": "TransactionId",
                  "dataType": "constructor",
                  "index": 0,
                  "fields": [{ "dataType": "bytes", "title": "hash" }],
                }],
              }, { "dataType": "integer", "title": "outputIndex" }],
            }],
          }],
        },
      ),
    };
  },
  { _: { "title": "Data", "description": "Any Plutus data." } },
) as unknown as IBeaconBeacon;

export interface ILiquidityLockerLiquidityLocker {
  new (): Validator;
  conf: { lockedUntil: bigint; redeemer: string };
  successorIx: bigint;
}

export const LiquidityLockerLiquidityLocker = Object.assign(
  function () {
    return {
      type: "PlutusV2",
      script:
        "5903f6010000323232323232323232222323232533300932323232533300d3370e90011806000899191919299980899b8748000c0400044c8c8c8c8c8c94ccc05ccdc3a4000602c002264646464a66603600220042940cc88c8cc00400400c894ccc08400452809919299981019b8f00200514a2266008008002604a0046eb8c08c004dd6180f98101810181018101810181018101810180c1805980c00a9bae3007301801753330193375e6014602e00a6014602e002264a66603466e1d2004301900113232323232325333020002100114a066e24dd69808180e80e1bad3010301d00432323300100100222533302400114a226464a666046646464646466e24004c8c8c94ccc0accdc3a40040022900009bad30303029002302900132533302a3370e90010008a60103d87a8000132323300100100222533303000114c103d87a800013232323253330313371e018004266e95200033035375000297ae0133006006003375a60640066eb8c0c0008c0d0008c0c8004dd598179814001181400099198008008061129998168008a6103d87a8000132323232533302e3371e016004266e95200033032374c00297ae01330060060033756605e0066eb8c0b4008c0c4008c0bc004dd6981600098160011bae302a001302a003375c60500042660080080022940c0a0008dd618130009919198008008011129998120008a5eb804c8ccc888c8cc00400400c894ccc0a8004400c4c8cc0b0dd3998161ba90063302c37526eb8c0a4004cc0b0dd41bad302a0014bd7019801801981700118160009bae302300137566048002660060066050004604c0026eacc02cc070028dd59805180d802980b0009810000980c0008b1802180b800899911919299980e99b87480080044c8c94ccc07ccdc3a400460406ea8c030c074c040c0740184cdc4002800899b89005001375a604600260360042940c06c004c030c064c030c064008c078c07cc07cc07cc07cc07cc07cc07cc05c03cdd69805180b80b180e800980a8008b19991800800911299980e0010a6103d87a800013232533301b3370e0069000099ba548000cc07c0092f5c0266600a00a00266e0400d20023020003301e00237586002602801801c460366038603800260026024004460326034002602e002601e0022c64646600200200444a66602c0022980103d87a80001323253330153375e600c602600400e266e952000330190024bd70099802002000980d001180c0009bac3001300e006230150013013001300b0011630110013011002300f001300700414984d958dd68021800802119299980419b87480000044c8c8c8c94ccc03cc04800852616375c602000260200046eb4c038004c01800858c0180048c014dd5000918019baa0015734aae7555cf2ab9f5740ae855d11",
    };
  },
  {
    conf: {
      "title": "Config",
      "anyOf": [{
        "title": "Config",
        "dataType": "constructor",
        "index": 0,
        "fields": [{ "dataType": "integer", "title": "lockedUntil" }, {
          "dataType": "bytes",
          "title": "redeemer",
        }],
      }],
    },
  },
  { successorIx: { "dataType": "integer" } },
) as unknown as ILiquidityLockerLiquidityLocker;

export interface IAuctionAuction {
  new (): Validator;
  conf: {
    base: { policy: string; name: string };
    quote: { policy: string; name: string };
    priceStart: { num: bigint; denom: bigint };
    startTime: bigint;
    stepLen: bigint;
    steps: bigint;
    priceDacayNum: bigint;
    feePerQuote: { num: bigint; denom: bigint };
    redeemer: string;
  };
  action: { Exec: { spanIx: bigint; successorIx: bigint } } | "Cancel";
}

export const AuctionAuction = Object.assign(
  function () {
    return {
      type: "PlutusV2",
      script:
        "5906bc01000032323232323232323222232325333008323232533300b3370e900000189919191919191919299980999b8748008c0480044c8c8c94ccc058cdc3a4000602a0022646464646464646464646464a66604466e1d2000302100113232323232323232323232323232323232323232323232533303953330395333039533303901b100114a0200e2940400852808040a503232533303a3370e900000089919299981e19b8f375c60666074072002266e1c04d200014a06eb8c100004c0e00084cdd79818181c00d9818181c00b981c0009817181b1817181b00a99b873370401200266e0801c008ccc00800cdd6980c981a180b181a0199119b82002483403cccc004008dd698159819980a98198191119b82002375a6078607a607a607a607a607a607a606a06844464666002002008006444a66607a004200226660060066080004660080026eb4c0fc008c8cc004005200022533303533710052002297ae013303937500026600400466e0000520023371090000022999818a9998188030a51100514a2266e24c8cdc098009bab3015303001330013756602a606001e466601800291100488100002533303000413370266e0402401c0044cdc080480399b83337040026eb4c094c0b4008dd6980918168012999817001899b833370466e04010018dd69808981600099b80375a602260580026eb4c090c0b00044cdc08020031809181581519b8f008489003371e00c9101003330043756601a605000e00a6eb8c034c0a0c034c0a009cccc00cdd5980618138030029bae300c3027301f302702633300237566016604c0120066eb8c02cc098c02cc098094ccc004dd5980518128040019bae300a3025301d3025024222323232533302c3370e90010008a400026eb4c0c4c0a8008c0a8004c94ccc0accdc3a4004002298103d87a8000132323300100100222533303100114c103d87a800013232323253330323371e014004266e95200033036375000297ae0133006006003375a60660066eb8c0c4008c0d4008c0cc004dd598181814801181480099198008008021129998170008a6103d87a8000132323232533302f3371e010004266e95200033033374c00297ae0133006006003375660600066eb8c0b8008c0c8008c0c0004dd7180d9811980418118111bae301a3022301a3022021302800130200011633323001001222533302700214c0103d87a80001323253330263370e0069000099ba548000cc0a80092f5c0266600a00a00266e0400d2002302b003302900237586002603e0220264604c604e604e0026004603a010a66603ca66603c66e20048dd6981198121812181218121812180e00d89919299981019b87480080044c8c94ccc088cdc3a400460466ea8c014c080c060c0800184cdc4004800899b89009001375a604c002603c0042940c078004c050c070c050c07000852809919299981019b87480080044c8c94ccc088cdc3a400460466ea8c014c080c014c0800184cdc4000804099b89001008375a604c002603c0042940c078004c050c070c004c0700085281181198120009800980d00611810981118111811181118111811181100099b80001002337006eb4c078c07cc07cc07cc05c058cdc10008069bad301d301e301e301e301e3016015301c00130140011632323300100100222533301b00114c103d87a800013232533301a3375e6020603000400c266e9520003301e0024bd70099802002000980f801180e8009bac300b30130053019001301100116301700130170023015001300d00a375a602600260260046eb4c044004c02401c4cc88c8cc00400400c894ccc04800452809919299980899b8f00200514a2266008008002602c0046eb8c050004dd618011804980098048031bae30023009008230100012300f30103010301030103010301030103010001300700414984d958c94ccc020cdc3a4000002264646464a66601e60240042930b1bad30100013010002375a601c002600c0082a66601066e1d20020011533300b300600414985858c01800cc8c8c94ccc024cdc3a40000022646464646464646464646464646464646464a66603c604200426464646493180b803180b007980b008180a8088b1bae301f001301f002301d001301d002375a603600260360046eb4c064004c064008dd6980b800980b8011bad301500130150023013001301300230110013011002300f001300700616300700523253330093370e9000000899191919299980818098010a4c2c6eb4c044004c044008dd6980780098038010b1803800919299980419b87480000044c8c8c8c94ccc03cc04800852616375c602000260200046eb8c038004c01800858c0180048c014dd5000918019baa0015734aae7555cf2ab9f5740ae855d11",
    };
  },
  {
    conf: {
      "title": "Config",
      "anyOf": [{
        "title": "Config",
        "dataType": "constructor",
        "index": 0,
        "fields": [
          {
            "title": "base",
            "anyOf": [{
              "title": "Asset",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "bytes", "title": "policy" }, {
                "dataType": "bytes",
                "title": "name",
              }],
            }],
          },
          {
            "title": "quote",
            "anyOf": [{
              "title": "Asset",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "bytes", "title": "policy" }, {
                "dataType": "bytes",
                "title": "name",
              }],
            }],
          },
          {
            "title": "priceStart",
            "anyOf": [{
              "title": "Rational",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "integer", "title": "num" }, {
                "dataType": "integer",
                "title": "denom",
              }],
            }],
          },
          { "dataType": "integer", "title": "startTime" },
          { "dataType": "integer", "title": "stepLen" },
          { "dataType": "integer", "title": "steps" },
          { "dataType": "integer", "title": "priceDacayNum" },
          {
            "title": "feePerQuote",
            "anyOf": [{
              "title": "Rational",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "integer", "title": "num" }, {
                "dataType": "integer",
                "title": "denom",
              }],
            }],
          },
          { "dataType": "bytes", "title": "redeemer" },
        ],
      }],
    },
  },
  {
    action: {
      "title": "Action",
      "anyOf": [{
        "title": "Exec",
        "description": "Execute order",
        "dataType": "constructor",
        "index": 0,
        "fields": [{ "dataType": "integer", "title": "spanIx" }, {
          "dataType": "integer",
          "title": "successorIx",
        }],
      }, {
        "title": "Cancel",
        "dataType": "constructor",
        "index": 1,
        "fields": [],
      }],
    },
  },
) as unknown as IAuctionAuction;

export interface ILimitOrderBatchWitness {
  new (): Validator;
  _: Data;
}

export const LimitOrderBatchWitness = Object.assign(
  function () {
    return {
      type: "PlutusV2",
      script:
        "590784010000323232323232323232225333005323253330073370e900218030008991919191999911119199980080080280225122225333016003100113232533301800414a0264646666010010006002a66602e00a26660120080040142940c070014c068010c068010c06000cdd6180218048019bac30013009003375860046012006646464646464644446464a66602e66e1d2004301600113232323232533301c3375e00298010241000013232323232323232323232323232323232323232323232323232325333037002100114a064a66607400229444c8c8cc00400400c894ccc0f400452809919299981e19b8f00200514a226600800800260820046eb8c0fc004dd7181e0119bac303b303c303c303c303c303c303c303c303c303c303c303c303401e533303500113232325333038002100114a0a66606e028266e2402ccdc019b80008007009153330370131337120160102a66606e66e2402c0204cdc499b8148000028cdc00038048a503371266e0801cdd69817981a00299b82001375a6062606800aa66606a022266e00cdc00050028038805099299981b19b8748010c0d40044c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c94ccc1194ccc1194ccc1194ccc1194ccc118020401c52808030a50100414a020062940400452819baf00e001323232323232323374a9000198279828003998279828003198279828002998279ba80123304f30500043304f30500033304f30500023304f30500013304f375002060a260a200260a0002609e002609c002609a609a00260980026096002608405866ebc044040cdc48008029bad304630473047304730473047303f029533304001d13371202866e00cdc00030020090a99982000e099b89014006153330403371202800c266e24cdc0a400002666e0001004852819b890033370666e0801403c040cdc499b82004375a606e607801a66e08004dd6981c981e006a99981e80c899b803370002400201e202466e04030004dd69819181c80219b8100b001375a6050606e0046056002607800260680022c6056606604466ebc004c0e4c0e8c0e8c0e8c0e8c0e8c0e8c0e8c0e8c0e8c0c8070c0b0c0c4080c0acc0c0074c0d8c0dcc0dcc0dcc0dcc0dcc0dcc0dcc0bc064dd69813981700c1bad301e302d017375a60666068606860686068605802c66e0400c010cdc080380299b81003005533302a00710031533302a00610021301a00c533302900610041533302900510031301900c33301900a0070063330180090080073330170090050043330160080060053371e006911003371e008910100375c603a6040602860400146eb8c068c07cc04cc07c024dd7180d980f180b180f0041bae3018301d3015301d0073756603260380166eacc060c06c020c03c01052898100009bac301c00132337606ea0c06c004dd3980e0009baa001301d001301500116300c301400130103013003230173018301830180012375a6026602c6eacc04cc058004888c8c8c94ccc054cdc3a40040022900009bad301a301300230130013253330143370e90010008a60103d87a8000132323300100100222533301a00114c103d87a8000132323232533301b3371e014004266e9520003301f375000297ae0133006006003375a60380066eb8c068008c078008c070004dd5980c98090011809000991980080080211299980b8008a6103d87a800013232323253330183371e010004266e9520003301c374c00297ae0133006006003375660320066eb8c05c008c06c008c0640048c050c054c054c054c054c054c0540048c94ccc03ccdc3a40000022646464646464646464646464646464646464646464646464a666054605a004264646464649319198008008031129998180008a4c2646600600660680046eb8c0c8004c94ccc0accdc3a4000002264646464a666064606a004264649319299981899b87480000044c8c94ccc0d8c0e40084c9263253330343370e900000089919299981c981e00109924c60560022c607400260640042a66606866e1d20020011323232323232533303d3040002149858dd6981f000981f0011bad303c001303c002375a607400260640042c60640022c606e002605e0062a66606266e1d200200115333034302f00314985858c0bc008c09000c58c0cc004c0cc008c0c4004c0a402458c0a4020c94ccc0a8cdc3a4000002264646464a66606260680042930b1bad30320013032002375a606000260500182c6050016603801860360262c6eb0c0ac004c0ac008dd718148009814801181380098138011bad302500130250023023001302300230210013021002375a603e002603e0046eb4c074004c074008dd6980d800980d801180c800980c8011bae30170013017002375c602a002601a0042c601a002464a66601c66e1d200000113232323253330153018002149858dd7180b000980b0011bae3014001300c00216300c001232533300d3370e9000000899192999809180a8010a4c2c6eb8c04c004c02c00854ccc034cdc3a400400226464a666024602a0042930b1bae3013001300b00216300b00123010301130110012300f30103010301030103010301030103010001300130060042300d00116300130040022300b300c00114984d9588c014dd5000918019baa0015734aae7555cf2ab9f5740ae855d101",
    };
  },
  { _: { "title": "Data", "description": "Any Plutus data." } },
) as unknown as ILimitOrderBatchWitness;

export interface ILimitOrderLimitOrder {
  new (
    witness: {
      Inline: [
        { VerificationKeyCredential: [string] } | {
          ScriptCredential: [string];
        },
      ];
    } | {
      Pointer: {
        slotNumber: bigint;
        transactionIndex: bigint;
        certificateIndex: bigint;
      };
    },
  ): Validator;
  conf: {
    tag: string;
    beacon: string;
    input: { policy: string; name: string };
    tradableInput: bigint;
    costPerExStep: bigint;
    minMarginalOutput: bigint;
    output: { policy: string; name: string };
    basePrice: { num: bigint; denom: bigint };
    fee: bigint;
    redeemerAddress: {
      paymentCredential: { VerificationKeyCredential: [string] } | {
        ScriptCredential: [string];
      };
      stakeCredential: {
        Inline: [
          { VerificationKeyCredential: [string] } | {
            ScriptCredential: [string];
          },
        ];
      } | {
        Pointer: {
          slotNumber: bigint;
          transactionIndex: bigint;
          certificateIndex: bigint;
        };
      } | null;
    };
    cancellationPkh: string;
    permittedExecutors: Array<string>;
  };
  action: boolean;
}

export const LimitOrderLimitOrder = Object.assign(
  function (
    witness: {
      Inline: [
        { VerificationKeyCredential: [string] } | {
          ScriptCredential: [string];
        },
      ];
    } | {
      Pointer: {
        slotNumber: bigint;
        transactionIndex: bigint;
        certificateIndex: bigint;
      };
    },
  ) {
    return {
      type: "PlutusV2",
      script: applyParamsToScript(
        "5903e60100003232323232323232322222323253330093232533300b003132323300100100222533301100114a02646464a66602266ebc0380045288998028028011808801180a80118098009bab301030113011301130113011301130090011323232533300e3370e900118068008991919299980899b8748000c0400044c8c8c8c8c94ccc0594ccc05802c400852808008a503375e601860260046034603660366036603660366036603660366036602602266ebcc020c048c020c048008c020c048004c060dd6180c180c980c9808804980b80098078008b19191980080080111299980b0008a6103d87a80001323253330153375e6018602600400c266e952000330190024bd70099802002000980d001180c0009bac3007300e0063014001300c001163001300b0072301230130013322323300100100322533301200114a026464a66602266e3c008014528899802002000980b0011bae3014001375860206022602260226022602260226022602260120026eb8c040c044c044c044c044c044c044c044c044c044c044c02401cc004c0200108c03c004526136563370e900118049baa003323232533300a3370e90000008991919191919191919191919191919191919191919191919299981298140010991919191924c646600200200c44a6660560022930991980180198178011bae302d0013253330263370e9000000899191919299981698180010991924c64a66605866e1d20000011323253330313034002132498c94ccc0bccdc3a400000226464a666068606e0042649318150008b181a80098168010a99981799b87480080044c8c8c8c8c8c94ccc0e0c0ec00852616375a607200260720046eb4c0dc004c0dc008dd6981a80098168010b18168008b181900098150018a99981619b874800800454ccc0bcc0a800c5261616302a002302300316302e001302e002302c00130240091630240083253330253370e9000000899191919299981618178010a4c2c6eb4c0b4004c0b4008dd6981580098118060b1811805980d806180d0098b1bac30260013026002375c60480026048004604400260440046eb4c080004c080008c078004c078008c070004c070008dd6980d000980d0011bad30180013018002375a602c002602c004602800260280046eb8c048004c048008dd7180800098040030b1804002919299980519b87480000044c8c8c8c94ccc044c05000852616375c602400260240046eb8c040004c02000858c0200048c94ccc024cdc3a400000226464a66601c60220042930b1bae300f0013007002153330093370e900100089919299980718088010a4c2c6eb8c03c004c01c00858c01c0048c014dd5000918019baa0015734aae7555cf2ab9f5740ae855d11",
        [witness],
        {
          "dataType": "list",
          "items": [{
            "title": "Referenced",
            "description":
              "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
            "anyOf": [{
              "title": "Inline",
              "dataType": "constructor",
              "index": 0,
              "fields": [{
                "description":
                  "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                "anyOf": [{
                  "title": "VerificationKeyCredential",
                  "dataType": "constructor",
                  "index": 0,
                  "fields": [{ "dataType": "bytes" }],
                }, {
                  "title": "ScriptCredential",
                  "dataType": "constructor",
                  "index": 1,
                  "fields": [{ "dataType": "bytes" }],
                }],
              }],
            }, {
              "title": "Pointer",
              "dataType": "constructor",
              "index": 1,
              "fields": [{ "dataType": "integer", "title": "slotNumber" }, {
                "dataType": "integer",
                "title": "transactionIndex",
              }, { "dataType": "integer", "title": "certificateIndex" }],
            }],
          }],
        },
      ),
    };
  },
  {
    conf: {
      "title": "LimitOrderConfig",
      "anyOf": [{
        "title": "LimitOrderConfig",
        "dataType": "constructor",
        "index": 0,
        "fields": [
          { "dataType": "bytes", "title": "tag" },
          { "dataType": "bytes", "title": "beacon" },
          {
            "title": "input",
            "anyOf": [{
              "title": "Asset",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "bytes", "title": "policy" }, {
                "dataType": "bytes",
                "title": "name",
              }],
            }],
          },
          { "dataType": "integer", "title": "tradableInput" },
          { "dataType": "integer", "title": "costPerExStep" },
          { "dataType": "integer", "title": "minMarginalOutput" },
          {
            "title": "output",
            "anyOf": [{
              "title": "Asset",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "bytes", "title": "policy" }, {
                "dataType": "bytes",
                "title": "name",
              }],
            }],
          },
          {
            "title": "basePrice",
            "anyOf": [{
              "title": "Rational",
              "dataType": "constructor",
              "index": 0,
              "fields": [{ "dataType": "integer", "title": "num" }, {
                "dataType": "integer",
                "title": "denom",
              }],
            }],
          },
          { "dataType": "integer", "title": "fee" },
          {
            "title": "redeemerAddress",
            "description":
              "A Cardano `Address` typically holding one or two credential references.\n\n Note that legacy bootstrap addresses (a.k.a. 'Byron addresses') are\n completely excluded from Plutus contexts. Thus, from an on-chain\n perspective only exists addresses of type 00, 01, ..., 07 as detailed\n in [CIP-0019 :: Shelley Addresses](https://github.com/cardano-foundation/CIPs/tree/master/CIP-0019/#shelley-addresses).",
            "anyOf": [{
              "title": "Address",
              "dataType": "constructor",
              "index": 0,
              "fields": [{
                "title": "paymentCredential",
                "description":
                  "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                "anyOf": [{
                  "title": "VerificationKeyCredential",
                  "dataType": "constructor",
                  "index": 0,
                  "fields": [{ "dataType": "bytes" }],
                }, {
                  "title": "ScriptCredential",
                  "dataType": "constructor",
                  "index": 1,
                  "fields": [{ "dataType": "bytes" }],
                }],
              }, {
                "title": "stakeCredential",
                "anyOf": [{
                  "title": "Some",
                  "description": "An optional value.",
                  "dataType": "constructor",
                  "index": 0,
                  "fields": [{
                    "description":
                      "Represent a type of object that can be represented either inline (by hash)\n or via a reference (i.e. a pointer to an on-chain location).\n\n This is mainly use for capturing pointers to a stake credential\n registration certificate in the case of so-called pointer addresses.",
                    "anyOf": [{
                      "title": "Inline",
                      "dataType": "constructor",
                      "index": 0,
                      "fields": [{
                        "description":
                          "A general structure for representing an on-chain `Credential`.\n\n Credentials are always one of two kinds: a direct public/private key\n pair, or a script (native or Plutus).",
                        "anyOf": [{
                          "title": "VerificationKeyCredential",
                          "dataType": "constructor",
                          "index": 0,
                          "fields": [{ "dataType": "bytes" }],
                        }, {
                          "title": "ScriptCredential",
                          "dataType": "constructor",
                          "index": 1,
                          "fields": [{ "dataType": "bytes" }],
                        }],
                      }],
                    }, {
                      "title": "Pointer",
                      "dataType": "constructor",
                      "index": 1,
                      "fields": [
                        { "dataType": "integer", "title": "slotNumber" },
                        { "dataType": "integer", "title": "transactionIndex" },
                        { "dataType": "integer", "title": "certificateIndex" },
                      ],
                    }],
                  }],
                }, {
                  "title": "None",
                  "description": "Nothing.",
                  "dataType": "constructor",
                  "index": 1,
                  "fields": [],
                }],
              }],
            }],
          },
          { "dataType": "bytes", "title": "cancellationPkh" },
          {
            "dataType": "list",
            "items": { "dataType": "bytes" },
            "title": "permittedExecutors",
          },
        ],
      }],
    },
  },
  {
    action: {
      "title": "Bool",
      "anyOf": [{
        "title": "False",
        "dataType": "constructor",
        "index": 0,
        "fields": [],
      }, {
        "title": "True",
        "dataType": "constructor",
        "index": 1,
        "fields": [],
      }],
    },
  },
) as unknown as ILimitOrderLimitOrder;
