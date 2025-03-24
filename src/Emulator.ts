import { Address, AddressStr, CanBeTxOutRef, TxOutRef, defaultProtocolParameters, forceTxOutRefStr, isProtocolParameters, IUTxO, ProtocolParameters, StakeAddressBech32, Tx, TxOutRefStr, UTxO, Value } from "@harmoniclabs/plu-ts"
import { StakeAddressInfos } from "./types/StakeAddressInfos";
import { CanResolveToUTxO, defaultMainnetGenesisInfos, GenesisInfos, IGetGenesisInfos, IGetProtocolParameters, IResolveUTxOs, isGenesisInfos, ISubmitTx, normalizedGenesisInfos, NormalizedGenesisInfos, TxBuilder } from "@harmoniclabs/buildooor"
import { Queue } from "./queue";

export class Emulator
implements IGetGenesisInfos, IGetProtocolParameters, IResolveUTxOs, ISubmitTx
{
    private readonly utxos: Map<TxOutRefStr,UTxO>;
    private readonly txUtxos: Map<TxOutRefStr,UTxO>;
    private readonly stakeAddresses: Map<StakeAddressBech32, StakeAddressInfos>;
    private readonly addresses: Map<AddressStr, Set<TxOutRefStr>>;

    private debugLevel: number;
    private readonly mempool: Queue<Tx>;

    private time: number;
    private slot: number;
    private blockHeight: number;

    private readonly genesisInfos: NormalizedGenesisInfos;
    private readonly protocolParameters: ProtocolParameters;

    readonly txBuilder: TxBuilder;

    constructor(
        initialUtxoSet: Iterable<IUTxO> = [],
        genesisInfos: GenesisInfos = defaultMainnetGenesisInfos,
        protocolParameters: ProtocolParameters = defaultProtocolParameters,
        debugLevel: number = 1,
    )
    {
        if( !isGenesisInfos( genesisInfos ) ) genesisInfos = defaultMainnetGenesisInfos;
        this.genesisInfos = normalizedGenesisInfos( genesisInfos );

        if( !isProtocolParameters( protocolParameters ) ) protocolParameters = defaultProtocolParameters;
        this.protocolParameters = protocolParameters;

        this.txBuilder = new TxBuilder( this.protocolParameters, this.genesisInfos );
        this.mempool = new Queue<Tx>();
        this.debugLevel = debugLevel;

        this.time = this.genesisInfos.systemStartPosixMs;
        this.slot = this.genesisInfos.startSlotNo;
        this.blockHeight = 0;
        
        this.utxos = new Map();
        this.txUtxos = new Map();
        this.stakeAddresses = new Map();
        this.addresses = new Map();

        for( const iutxo of initialUtxoSet )
        {
            this.pushUtxo( new UTxO( iutxo ) );
        }
    }

    get thisMempool() {
        return this.mempool;
    }

    get maxBlockBodySize() {
        return this.protocolParameters.maxBlockBodySize;
    }

    getUtxos(): Map<TxOutRefStr, UTxO>
    {
        return new Map( this.utxos );
    }
    
    getAddressUtxos( address: Address | AddressStr ): UTxO[] | undefined
    { 
        const utxos = Array.from(this.getUtxos().values()).filter( utxo => utxo.resolved.address.toString() === address.toString());
        
        console.log('All UTXOs :')
        Array.from(this.getUtxos().values()).forEach(utxo => console.log(utxo.resolved.value.lovelaces, utxo.resolved.address.toString()))
        
        return utxos.length ? utxos : undefined;
    }

    getCurrentSlot(): number {
        return this.slot;
    }

    getCurrentTime() {
        return this.time;
    }

    printAllUTXOs() {
        this.printUtxos(this.utxos, this.debugLevel);
    }
    
    private pushUtxo( utxo: UTxO ): void
    {
        const ref = utxo.utxoRef.toString();

        if( !this.utxos.has( ref ) )
        {
            this.utxos.set( ref, utxo );

            const addr = utxo.resolved.address.toString();
            if( !this.addresses.has( addr ) ) this.addresses.set( addr, new Set() );

            this.addresses.get( addr )!.add( ref );
        }
    }


    // tbd - awaitSlot


    // awaitBlock:
    // go through the mempool
    //    - For each transaction:
    //       - If yes:
    //          - consume the UTxOs in input (remove from utxo)
    //          - add the UTxOs in output (add to utxo)
    //       - If no:
    //          - remove the transaction from the mempool
    // Moves time forward to the next blockNumber block

    awaitBlock (height : number = 1) : void {
        if (height <= 0) {
            console.warn("Invalid call to awaitBlock. Argument height must be greater than zero.");
        }
        
        while (height > 0) {

            this.blockHeight += 1;
            console.log(`Block ${this.blockHeight}`);
            const isMempoolEmpty = this.mempool.isEmpty();

            if (isMempoolEmpty) {
                // Advance by the remaining height in one step
                this.slot += height * (this.genesisInfos.slotLengthMs / 1000);
                this.time += height * this.genesisInfos.slotLengthMs;
    
                console.log(`Mempool is empty. Advanced by ${height} blocks.`);
                height = 0; // Exit the loop
            } else {
                // Advance by 1 block
                this.slot += (this.genesisInfos.slotLengthMs / 1000);
                this.time += this.genesisInfos.slotLengthMs;

                let currentBlockUsed = 0

                while (!this.mempool.isEmpty()) {
                    let txSize = this.getTxSize(this.mempool.peek())
                    // check if tx size can fit in the block
                    if (txSize && ((currentBlockUsed + txSize) <= this.maxBlockBodySize)) { //200 
                        const tx = this.mempool.dequeue()!;
                        const txHash = tx.hash.toString();

                        for (let i = 0; i < tx.body.inputs.length; i++){
                            this.removeUtxo(tx.body.inputs[i])
                        }
                        for (let i = 0; i < tx.body.outputs.length; i++){
                            this.pushUtxo(new UTxO({
                                resolved: tx.body.outputs[i],
                                utxoRef: new TxOutRef({
                                    id: txHash,
                                    index: i
                                })
                            }))
                        }
                        console.log('Dequeued from mempool: ', txHash)
                        currentBlockUsed += txSize;

                        txSize = this.getTxSize(this.mempool.peek())

                    } else {
                        console.warn("Transaction too large to fit in block. Skipping transaction.");
                        break;
                    }
                }

                console.log(`Advanced to block number ${this.blockHeight} (slot ${this.slot}). Time: ${new Date(this.time).toISOString()}`);
                
                height -= 1;
            }
        }
    }
   
    private removeUtxo( utxoRef: CanBeTxOutRef ): void
    {
        const ref = forceTxOutRefStr( utxoRef );
        const addr = this.utxos.get( ref )?.resolved.address.toString();

        if( typeof addr !== "string" ) return;

        this.utxos.delete( ref );

        const addrRefs = this.addresses.get( addr )!;
        addrRefs.delete( ref );

        if( addrRefs.size <= 0 ) this.addresses.delete( addr );
    }

    getGenesisInfos(): Promise<GenesisInfos>
    {
        return Promise.resolve({ ...this.genesisInfos });
    }

    getProtocolParameters(): Promise<ProtocolParameters>
    {
        return Promise.resolve( this.protocolParameters );
    }

    /**
     * resolves the utxos that are present on the current ledger state
     * 
     * if some of the specified utxos are not present (have been spent already)
     * they will be filtered out
    */
    resolveUtxos( utxos: CanResolveToUTxO[] ): Promise<UTxO[]>
    {
        return Promise.resolve(
            [ ...new Set<TxOutRefStr>( utxos.map( forceTxOutRefStr ) ) ]
            .map( ref => this.utxos.get( ref )?.clone() )
            .filter( u => u instanceof UTxO ) as UTxO[]
        );
    }

    /**
     * Print the mempool
     */
    printMempool(): void {
        console.log("Mempool:", this.mempool.size());
        for (let i = 0; i < this.mempool.size(); i++){
            console.log("Transaction ID:", this.mempool.asArray()[i].hash.toString());
            // console.log("Transaction Inputs:");
            // for (let j = 0; j < this.mempool.asArray()[i].body.inputs.length; j++){
            //     console.log("  Input ID:", this.mempool.asArray()[i].body.inputs[j].toString());
            // }
            // console.log("Transaction Outputs:");
            // for (let j = 0; j < this.mempool.asArray()[i].body.outputs.length; j++){
            //     console.log("  Output ID:", this.mempool.asArray()[i].body.outputs[j].toString());
            // }
        }
    }
    /**
     * Print one UTXO
     */
    printUtxo(utxo: UTxO, debugLevel: number = 1): void {
        console.log("UTxO Ref ID:", utxo.utxoRef.id.toString());
        console.log("UTxO Ref Index:", utxo.utxoRef.index);
        console.log("Address:", utxo.resolved.address.toString());
        if (debugLevel > 2) {
            console.log("Address Type:", utxo.resolved.address.type);
        }
        if (debugLevel > 1) {
            console.log("Network:", utxo.resolved.address.network);
        }
        if (debugLevel > 1) {
            console.log("Payment Credentials:", utxo.resolved.address.paymentCreds);
        } else {
            console.log("Payment Credentials (hex):", utxo.resolved.address.paymentCreds.hash.toString());
        }
        if (utxo.resolved.address.stakeCreds) {
            console.log("Stake Credentials:", utxo.resolved.address.stakeCreds);
        }
        console.log("Value: {");
        console.log("  Assets:");
        utxo.resolved.value.map.forEach(asset => {
            console.log("    Policy:", asset.policy);
            asset.assets.forEach(a => {
                if (a.name.toString() == "") {
                    console.log("      Asset: lovelaces");
                }
                else {
                    console.log("      Asset:", a.name);
                }
                console.log("      Quantity:", a.quantity);
            });
        });
        if (utxo.resolved.datum) {
            console.log("  Datum:", utxo.resolved.datum);
        }
        if (utxo.resolved.refScript) {
            console.log("  Reference Script:", utxo.resolved.refScript);
        }
        console.log("}");
    }

    /**
     * Print all the UTXOs
     */
    printUtxos(utxos: Map<TxOutRefStr, UTxO>, debugLevel: number = 1): void {
        for (let utxo of utxos.values()){
            this.printUtxo(utxo, debugLevel);
        }
    }

    /**
     * fetch the UTxO associated with each tx input
     */
    private async resolveUtxo(input: CanBeTxOutRef): Promise<UTxO> {
        const ref = forceTxOutRefStr(input);
        const utxo = this.utxos.get(ref);
        if (!utxo) {
            throw new Error(`UTxO not found for input: ${ref}`);
        }
        return utxo;
    }

    /**
     * validates and submits a transaction to the emulated blockchain
    */
    async submitTx( txCBOR: string | Tx ): Promise<string>
    {   
        this.txUtxos.clear();
        const tx = txCBOR instanceof Tx ? txCBOR : Tx.fromCbor( txCBOR );
        
        if (!this.isTxValid(tx)) {
            // Add a debug level and some more useful information
            console.log("Transaction is invalid")
        }

        this.mempool.enqueue( tx );

        return Promise.resolve( tx.hash.toString() );
    }

    private async isTxValid(tx: Tx): Promise<boolean> {
        
        // Resolve the source addresses from the inputs
        const allTxUtxos = await Promise.all(
            tx.body.inputs.map(async input => {
                const utxo = await this.resolveUtxo(input);
                this.txUtxos.set(utxo.utxoRef.toString(), utxo);
                return utxo;
            })
        );

        // Check if the transaction has at least one input and one output
        if (tx.body.inputs.length === 0) {
            console.log("Invalid transaction: no inputs.");
            return false;
        }
        if (tx.body.outputs.length === 0) {
            console.log("Invalid transaction: no outputs.");
            return false;
        }

        // Check if all inputs are unspent
        for (const input of tx.body.inputs) {
            if (!this.txUtxos.has(forceTxOutRefStr(input))) {
                console.log(`Invalid transaction: input ${input.toString()} is already spent.`);
                return false;
            }
        }

        // Check if the transaction size is within the maximum allowed size
        const txSize = this.getTxSize(tx);
        if (txSize > this.getTxMaxSize()) {
            console.log(`Invalid transaction: size ${txSize} exceeds maximum allowed size ${this.getTxMaxSize()}.`);
            return false;
        }

        
        // Check if the transaction fee is sufficient
        const fee = tx.body.fee;
        // calMinFee guesses that we have atleast one signer for the tx
        // calLinearFee calculates with the signer; so here we should be using this
        if (fee < this.txBuilder.calcLinearFee(tx)) {
            console.log("Invalid transaction: insufficient fee.");
            return false;
        }

        //  TBD validity ranges

        return true;
    }

    getTxSize(tx: Tx | undefined) {
        return tx ? ((tx instanceof Tx ? tx.toCbor() : tx).toBuffer().length) : 0;
    }

    getTxMaxSize() {
        return Number(this.protocolParameters.maxTxSize);
    }
}