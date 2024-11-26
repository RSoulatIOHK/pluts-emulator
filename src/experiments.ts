import { Emulator } from "./Emulator"
import { Credential, defaultProtocolParameters, Tx, IUTxO, UTxO, Value, IValueAdaEntry, Address, AddressStr } from "@harmoniclabs/cardano-ledger-ts"
import { defaultMainnetGenesisInfos, TxBuilder } from "@harmoniclabs/plu-ts-offchain"
import { getRandomValues } from "crypto"



console.log("Romain's experiments")

const utxosInit: IUTxO[] = createRandomInitialUtxos(2)

const emulator: Emulator = new Emulator(utxosInit, defaultMainnetGenesisInfos, defaultProtocolParameters);

// print the parameters
// console.log("Genesis Infos:")
// console.log(emulator.getGenesisInfos())
// console.log("-".repeat(20))
// console.log("Protocol Parameters:")
// console.log(emulator.getProtocolParameters())
// console.log("-".repeat(20))

// emulator.printUtxos(emulator.getUtxos())
// console.log("-".repeat(20))

const txBuilder = new TxBuilder (defaultProtocolParameters, defaultMainnetGenesisInfos)

// Get the first utxo
const utxo = emulator.getUtxos().values().next().value
if (utxo === undefined) {
    console.log("No utxo found")
    process.exit(1)
}
// emulator.printUtxo(utxo)
let tx = txBuilder.buildSync({
    inputs: [utxo],
    outputs: [],
    changeAddress: utxo.resolved.address,
});

// Sign the transaction

const submittedTx = emulator.submitTx(tx)

console.log(submittedTx)

emulator.printMempool()

emulator.awaitBlock(1)

console.log("This mempool should be emptied")
emulator.printMempool()
console.log("End of mempool to check")
emulator.printUtxos(emulator.getUtxos())

// Bunch of useful functions, should we have them in the Emulator class?
function createRandomInitialUtxos(numUtxos: number): IUTxO[] {
    const utxos: IUTxO[] = []
    for (let i = 0; i < numUtxos; i++) {
        // (typeof id === "string" && bytestring_1.ByteString.isValidHexValue(id) && (id.length === 64))
        const utxoHash = "a".repeat(63) + i.toString()
        // console.log(utxoHash)
        const address = generateRandomBech32Address() // Have a way to generate random Bech32 addresses
        const utxoInit: IUTxO = createInitialUTxO(100000000n, address, utxoHash);
        utxos.push(utxoInit)
    }
    return utxos
}

function createInitialUTxO(numAda: bigint, addressW: Address | AddressStr, id: string): IUTxO {
    const adaEntry: IValueAdaEntry = Value.lovelaceEntry(numAda)

    const utxoInit: IUTxO = new UTxO({
        utxoRef: { id: id, index: 0 },
        resolved: { address: addressW, value: new Value([adaEntry]), datum: undefined, refScript: undefined }
    })
    return utxoInit
}

 // Have a way to generate random Bech32 addresses
 function generateRandomBech32Address(): AddressStr {
    const hash28i = getRandomValues(new Uint8Array(28))
    const testnetAddr = new Address(
        "testnet",
        Credential.keyHash(hash28i)
    )
    return testnetAddr.toString()
}