import { defaultProtocolParameters, Tx, IUTxO, UTxO, Value, IValueAdaEntry, Address, AddressStr } from "@harmoniclabs/plu-ts"
import { defaultMainnetGenesisInfos, TxBuilder } from "@harmoniclabs/buildooor"
import { getRandomValues } from "crypto"
import { generateRandomBech32Address } from "./utils/helper"
import { Emulator } from "./Emulator"

// Wrap the main logic in an async function
async function main() {
    const utxosInit: IUTxO[] = createRandomInitialUtxos(2)

    const emulator: Emulator = new Emulator(utxosInit, defaultMainnetGenesisInfos, defaultProtocolParameters);

    emulator.setDebugLevel(1);

    const txBuilder = new TxBuilder(defaultProtocolParameters, defaultMainnetGenesisInfos)

    // Get the first utxo
    const utxo = emulator.getUtxos().values().next().value
    if (utxo === undefined) {
        console.log("No utxo found")
        process.exit(1)
    }

    let tx = txBuilder.buildSync({
        inputs: [utxo],
        outputs: [],
        changeAddress: utxo.resolved.address,
    });

    // Submit transaction and wait for it to be added to mempool
    const submittedTx = await emulator.submitTx(tx)
    
    // Print mempool after transaction submission
    console.log(emulator.prettyPrintMempool());

    emulator.awaitBlock(1)

    // Print mempool after block creation
    console.log(emulator.prettyPrintMempool());
    // Print the ledger
    console.log(emulator.prettyPrintLedgerState());
}

// Call the main function and handle any potential errors
main().catch(error => {
    console.error("An error occurred:", error);
    process.exit(1);
});

/**
 * Create a list of random UTxOs with dynamically calculated ADA values based on transaction size
 * @param numUtxos number of random utxos to create
 * @param targetAmount lovelaces which has to be populated in the address
 * @param debugLevel to further check if the tx is a valid tx falling within the limits
 * @returns utxos list
 */
function createRandomInitialUtxos(
    numUtxos: number, 
    targetAmount: bigint = 150000000n,
    debugLevel: number = 1
): IUTxO[] {

    const utxos: IUTxO[] = [];

    for (let i = 0; i < numUtxos; i++) {
        const utxoHash = generateRandomTxHash(i); // Unique hash per UTxO
        const address = generateRandomBech32Address();

        const utxoInit: IUTxO = createInitialUTxO(targetAmount, address, utxoHash);

        utxos.push(utxoInit);
    }

    return utxos;
}

function createInitialUTxO(numAda: bigint, address: Address | AddressStr, id: string): IUTxO {
    const adaEntry: IValueAdaEntry = Value.lovelaceEntry(numAda);
    return new UTxO({
        utxoRef: { id: id, index: 0 },
        resolved: {
            address: address,
            value: new Value([adaEntry]),
            datum: undefined,
            refScript: undefined,
        },
    });
}

/**
 * Generate a unique random transaction hash.
 * 
 * @param index Index to ensure uniqueness.
 * @returns A random Tx hash.
 */
function generateRandomTxHash(index: number): string {
    const randomHash = getRandomValues(new Uint8Array(32));
    randomHash[0] = index; // Ensure uniqueness by incorporating the index
    return Buffer.from(randomHash).toString("hex");
}

export const experimentFunctions = {
    createRandomInitialUtxos,
    createInitialUTxO,
    generateRandomTxHash
};