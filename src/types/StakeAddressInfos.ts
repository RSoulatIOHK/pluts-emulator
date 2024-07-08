import { PoolKeyHash } from "@harmoniclabs/cardano-ledger-ts";

export interface StakeAddressInfos {
    registered: boolean;
    poolId?: PoolKeyHash;
    rewards: bigint;
}