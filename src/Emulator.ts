import { Address, AddressStr, CanBeTxOutRef, defaultProtocolParameters, forceTxOutRefStr, Hash32, isProtocolParameters, IUTxO, ProtocolParameters, StakeAddressBech32, Tx, TxOutRefStr, UTxO } from "@harmoniclabs/cardano-ledger-ts"
import { StakeAddressInfos } from "./types/StakeAddressInfos";
import { CanBeData, CanResolveToUTxO, defaultMainnetGenesisInfos, GenesisInfos, IGetGenesisInfos, IGetProtocolParameters, IProvider, IResolveDatumHashes, IResolveUTxOs, isGenesisInfos, ISubmitTx, normalizedGenesisInfos, NormalizedGenesisInfos, TxBuilder, TxBuilderRunner } from "@harmoniclabs/plu-ts-offchain"

export class Emulator
implements IGetGenesisInfos, IGetProtocolParameters, IResolveUTxOs, ISubmitTx
{
    private readonly utxos: Map<TxOutRefStr,UTxO>;
    private readonly stakeAddresses: Map<StakeAddressBech32, StakeAddressInfos>;
    private readonly addresses: Map<AddressStr, Set<TxOutRefStr>>;

    /** to be validated on block creation; the user might want to test utxo contention scenarios */
    private readonly mempool: Tx[];

    private time: number;
    private slot: number;

    private readonly genesisInfos: NormalizedGenesisInfos;
    private readonly protocolParameters: ProtocolParameters;

    readonly txBuilder: TxBuilder;

    constructor(
        initialUtxoSet: Iterable<IUTxO> = [],
        genesisInfos: GenesisInfos = defaultMainnetGenesisInfos,
        protocolParameters: ProtocolParameters = defaultProtocolParameters
    )
    {
        if( !isGenesisInfos( genesisInfos ) ) genesisInfos = defaultMainnetGenesisInfos;
        this.genesisInfos = normalizedGenesisInfos( genesisInfos );

        if( !isProtocolParameters( protocolParameters ) ) protocolParameters = defaultProtocolParameters;
        this.protocolParameters = protocolParameters;

        this.txBuilder = new TxBuilder( this.protocolParameters, this.genesisInfos );

        this.time = this.genesisInfos.systemStartPosixMs;
        this.slot = this.genesisInfos.startSlotNo;
        
        this.utxos = new Map();
        this.stakeAddresses = new Map();
        this.addresses = new Map();

        for( const iutxo of initialUtxoSet )
        {
            this.pushUtxo( new UTxO( iutxo ) );
        }
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
            .filter( u => u instanceof UTxO )
        );
    }

    /**
     * validates and submits a transaction to the emulated blockchain
    */
    submitTx( txCBOR: string | Tx ): Promise<string>
    {
        // TODO add some tx validation
        const tx = txCBOR instanceof Tx ? txCBOR : Tx.fromCbor( txCBOR );

        this.mempool.push( tx );

        return Promise.resolve( tx.hash.toString() );
    }
}