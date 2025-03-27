import { describe, expect, it } from '@jest/globals';
import { AddressStr } from "@harmoniclabs/plu-ts";

import { experimentFunctions } from "../src/experiments";

const numAda = 100000000n; // 1 ADA in Lovelac
const address =
  "addr_test1vq3hsxlnpd4m604ckm9vauj3zk07jypw7s8st3ekmmkknys48e0n0" as AddressStr;
const id = "006e25b100d638a218d39b18fecc3bddcb02ab26f4a7ffb3f3c69b497ed12967";

describe("Experiment test suite", () => {
  describe("generateRandomTxHash", () => {
    it("should generate a unique hash for different indices", () => {
      const hash1 = experimentFunctions.generateRandomTxHash(1);
      const hash2 = experimentFunctions.generateRandomTxHash(2);

      expect(hash1).not.toBe(hash2);
    });

    it("should generate a hash of length 64 (32 bytes in hex)", () => {
      const hash = experimentFunctions.generateRandomTxHash(0);

      expect(hash).toHaveLength(64);
    });

    it("should incorporate the index in the hash", () => {
      const index = 5;
      const hash = experimentFunctions.generateRandomTxHash(index);
      const hashBuffer = Buffer.from(hash, "hex");

      expect(hashBuffer[0]).toBe(index);
    });
  });

  describe("CreateInitialUTxO", () => {
    it("should create a UTxO with the correct ADA value", () => {
      const utxo = experimentFunctions.createInitialUTxO(numAda, address, id);

      // Assert
      expect(utxo.utxoRef.id.toString()).toBe(id);
      expect(utxo.utxoRef.index).toBe(0);
      expect(utxo.resolved.address.toString()).toBe(address);
      expect(BigInt(utxo.resolved.value.toString())).toBe(numAda); // Check ADA value
      expect(utxo.resolved.datum).toBeUndefined(); // Ensure no datum is set
      expect(utxo.resolved.refScript).toBeUndefined(); // Ensure no refScript is set
    });
  });

  describe("CreateRandomInitialUtxos", () => {
    const address =
      "addr_test1vq3hsxlnpd4m604ckm9vauj3zk07jypw7s8st3ekmmkknys48e0n0" as AddressStr;
    jest.mock("../src/utils/helper", () => ({
      generateRandomBech32Address: jest.fn().mockReturnValue(address),
    }));

    it("should return an empty array when numUtxos is 0", () => {
      const utxos = experimentFunctions.createRandomInitialUtxos(0);

      // Assert
      expect(utxos).toHaveLength(0);
    });

    it("should create the correct number of UTxOs", () => {
      const numUtxos = 5;
      const targetAmount = 100000000n;

      const utxos = experimentFunctions.createRandomInitialUtxos(
        numUtxos,
        targetAmount
      );

      expect(utxos).toHaveLength(numUtxos);

      utxos.forEach((utxo, index) => {
        expect(utxo.utxoRef.id).toBeDefined();
        expect(BigInt(utxo.resolved.value.toString())).toBe(targetAmount);
      });
    });
  });
});