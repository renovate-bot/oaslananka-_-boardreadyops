import { describe, expect, it } from "vitest";
import {
  compareFirmwareContract,
  type FirmwarePinAssignment,
  type HardwareSignal,
  normalizeHardwareKey,
} from "../../../src/firmware/contract.js";

function hardwareMap(...signals: HardwareSignal[]): Map<string, HardwareSignal> {
  return new Map(signals.map((signal) => [signal.signal, signal]));
}

describe("normalizeHardwareKey", () => {
  it("trims whitespace and upper-cases", () => {
    expect(normalizeHardwareKey(" u1 . pa1 ")).toBe("U1.PA1");
  });
});

describe("compareFirmwareContract", () => {
  const hardware = hardwareMap(
    { signal: "LED", hardware: "U1.PA1", net: "LED_NET" },
    { signal: "SDA", hardware: "U1.PA2", net: "I2C_SDA" },
  );

  it("returns no differences when firmware matches hardware", () => {
    const pins: FirmwarePinAssignment[] = [
      { signal: "LED", hardware: "U1.PA1", net: "LED_NET" },
      { signal: "SDA", hardware: "u1.pa2", net: "I2C_SDA" },
    ];
    expect(compareFirmwareContract(pins, hardware)).toEqual({
      unknownFirmwareSignals: [],
      mismatches: [],
      missingHardwareSignals: [],
    });
  });

  it("classifies unknown, mismatched, and missing signals", () => {
    const pins: FirmwarePinAssignment[] = [
      { signal: "LED", hardware: "U1.PA9", net: "LED_NET" },
      { signal: "EXTRA", hardware: "U1.PB1" },
    ];
    const result = compareFirmwareContract(pins, hardware);
    expect(result.unknownFirmwareSignals.map((entry) => entry.signal)).toEqual(["EXTRA"]);
    expect(result.mismatches.map((entry) => entry.assignment.signal)).toEqual(["LED"]);
    expect(result.missingHardwareSignals.map((entry) => entry.signal)).toEqual(["SDA"]);
  });

  it("flags a net mismatch even when the hardware pin matches", () => {
    const pins: FirmwarePinAssignment[] = [{ signal: "LED", hardware: "U1.PA1", net: "WRONG_NET" }];
    const result = compareFirmwareContract(pins, hardware);
    expect(result.mismatches.map((entry) => entry.assignment.signal)).toEqual(["LED"]);
  });
});
