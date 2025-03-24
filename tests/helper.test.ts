// Import required modules
import { Address } from "@harmoniclabs/plu-ts";
import { generateRandomBech32Address } from "../src/utils/helper"; // Adjust the path as needed

describe("GenerateRandomBech32Address - E2E Test", () => {
  it("should generate a valid Bech32 address", () => {
    // Call the function to generate a random Bech32 address
    const randomAddress = generateRandomBech32Address();

    // Validate the address is a valid testnet address using the library
    const address = Address.fromString(randomAddress);

    // Assertions
    expect(address).toBeInstanceOf(Address); // Ensure it's a valid Address object
    expect(address.network).toBe("testnet"); // Ensure it's a testnet address
    expect(randomAddress).toMatch(/^addr_test[0-9a-zA-Z]+$/); // Testnet Bech32 prefix
  });

  it("should generate unique addresses", () => {
    const address1 = generateRandomBech32Address();
    const address2 = generateRandomBech32Address();

    // Assertions
    expect(address1).not.toBe(address2); // Ensure the addresses are unique
  });
});