"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emulator = void 0;
var cardano_ledger_ts_1 = require("@harmoniclabs/cardano-ledger-ts");
var plu_ts_offchain_1 = require("@harmoniclabs/plu-ts-offchain");
var Emulator = /** @class */ (function () {
    function Emulator(initialUtxoSet, genesisInfos, protocolParameters) {
        if (initialUtxoSet === void 0) { initialUtxoSet = []; }
        if (genesisInfos === void 0) { genesisInfos = plu_ts_offchain_1.defaultMainnetGenesisInfos; }
        if (protocolParameters === void 0) { protocolParameters = cardano_ledger_ts_1.defaultProtocolParameters; }
        if (!(0, plu_ts_offchain_1.isGenesisInfos)(genesisInfos))
            genesisInfos = plu_ts_offchain_1.defaultMainnetGenesisInfos;
        this.genesisInfos = (0, plu_ts_offchain_1.normalizedGenesisInfos)(genesisInfos);
        if (!(0, cardano_ledger_ts_1.isProtocolParameters)(protocolParameters))
            protocolParameters = cardano_ledger_ts_1.defaultProtocolParameters;
        this.protocolParameters = protocolParameters;
        this.txBuilder = new plu_ts_offchain_1.TxBuilder(this.protocolParameters, this.genesisInfos);
        this.time = this.genesisInfos.systemStartPosixMs;
        this.slot = this.genesisInfos.startSlotNo;
        this.utxos = new Map();
        this.stakeAddresses = new Map();
        this.addresses = new Map();
        for (var _i = 0, initialUtxoSet_1 = initialUtxoSet; _i < initialUtxoSet_1.length; _i++) {
            var iutxo = initialUtxoSet_1[_i];
            this.pushUtxo(new cardano_ledger_ts_1.UTxO(iutxo));
        }
    }
    Emulator.prototype.getUtxos = function () {
        return new Map(this.utxos);
    };
    Emulator.prototype.pushUtxo = function (utxo) {
        var ref = utxo.utxoRef.toString();
        if (!this.utxos.has(ref)) {
            this.utxos.set(ref, utxo);
            var addr = utxo.resolved.address.toString();
            if (!this.addresses.has(addr))
                this.addresses.set(addr, new Set());
            this.addresses.get(addr).add(ref);
        }
    };
    // private awaitBlock (blockNum : number) : void {
    //     if (blockNum >= 0){
    //         // For all transactions in mempool
    //         // The inputs are removed from the UTXO set
    //         // The outputs are added to the UTXO set
    //         // Code:
    //         for (let i = 0; i < this.mempool.length; i++){
    //             let tx = this.mempool[i];
    //             for (let j = 0; j < tx.body.inputs.length; j++){
    //                 let ref: CanBeTxOutRef = tx.body.inputs[j];
    //                 this.removeUtxo(ref);
    //             }
    //             for (let j = 0; j < tx.body.outputs.length; j++){
    //                 this.pushUtxo(new UTxO(tx.body.outputs[j]));
    //             }
    //         }
    //     }
    // }
    Emulator.prototype.removeUtxo = function (utxoRef) {
        var _a;
        var ref = (0, cardano_ledger_ts_1.forceTxOutRefStr)(utxoRef);
        var addr = (_a = this.utxos.get(ref)) === null || _a === void 0 ? void 0 : _a.resolved.address.toString();
        if (typeof addr !== "string")
            return;
        this.utxos.delete(ref);
        var addrRefs = this.addresses.get(addr);
        addrRefs.delete(ref);
        if (addrRefs.size <= 0)
            this.addresses.delete(addr);
    };
    Emulator.prototype.getGenesisInfos = function () {
        return Promise.resolve(__assign({}, this.genesisInfos));
    };
    Emulator.prototype.getProtocolParameters = function () {
        return Promise.resolve(this.protocolParameters);
    };
    /**
     * resolves the utxos that are present on the current ledger state
     *
     * if some of the specified utxos are not present (have been spent already)
     * they will be filtered out
    */
    Emulator.prototype.resolveUtxos = function (utxos) {
        var _this = this;
        return Promise.resolve(__spreadArray([], new Set(utxos.map(cardano_ledger_ts_1.forceTxOutRefStr)), true).map(function (ref) { var _a; return (_a = _this.utxos.get(ref)) === null || _a === void 0 ? void 0 : _a.clone(); })
            .filter(function (u) { return u instanceof cardano_ledger_ts_1.UTxO; }));
    };
    /**
     * validates and submits a transaction to the emulated blockchain
    */
    Emulator.prototype.submitTx = function (txCBOR) {
        // TODO add some tx validation
        var tx = txCBOR instanceof cardano_ledger_ts_1.Tx ? txCBOR : cardano_ledger_ts_1.Tx.fromCbor(txCBOR);
        this.mempool.push(tx);
        return Promise.resolve(tx.hash.toString());
    };
    return Emulator;
}());
exports.Emulator = Emulator;
