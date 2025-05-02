export interface EmulatorBlockInfos {
    time: number;
    hight: number; // This is an hommage to @harmoniclabs/blockfrost-pluts
    // hash: string;
    slot: number;
    // epoch: number;
    // epoch_slot: number;
    slot_leader : "emulator";
    size : number;
    tx_count : number;
    // output : bigint | null | undefined;
    fees : bigint;
    // block_vrf : string;
    // op_cert: string | null | undefined,
    // op_cert_counter: `${bigint}` | null | undefined,
    // previous_block: string | null | undefined,
    // next_block: string | null | undefined,
    // confirmations: number
  }