import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadArduinoPinContract } from "../../../src/firmware/arduino.js";

const tempDirs: string[] = [];

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

async function writeHeader(content: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "brops-arduino-"));
  tempDirs.push(dir);
  const file = path.join(dir, "pins.h");
  await fs.writeFile(file, content);
  return file;
}

describe("loadArduinoPinContract", () => {
  it("parses #define pin macros with optional net/pin/env metadata", async () => {
    const file = await writeHeader(
      [
        "// board pins",
        "#define LED_STATUS U1.PA1   // net=LED_STATUS pin=GPIO2 env=esp32",
        "#define I2C_SDA    U1.PA2",
        "const int x = 1; // not a define",
        "#define   UART_TX  U1.PA3 // net=UART_TX",
      ].join("\n"),
    );

    const loaded = await loadArduinoPinContract(file);

    expect(loaded.errors).toEqual([]);
    expect(loaded.document?.pins).toEqual([
      { signal: "LED_STATUS", hardware: "U1.PA1", net: "LED_STATUS", pin: "GPIO2", environment: "esp32" },
      { signal: "I2C_SDA", hardware: "U1.PA2" },
      { signal: "UART_TX", hardware: "U1.PA3", net: "UART_TX" },
    ]);
  });

  it("reports an error for a header without pin defines", async () => {
    const file = await writeHeader("// nothing here\n#include <stdint.h>\n");
    const loaded = await loadArduinoPinContract(file);
    expect(loaded.document).toBeUndefined();
    expect(loaded.errors[0]).toMatch(/no #define pin assignments/);
  });

  it("reports an error when the header cannot be read", async () => {
    const loaded = await loadArduinoPinContract(path.join(os.tmpdir(), "brops-missing-header-xyz.h"));
    expect(loaded.document).toBeUndefined();
    expect(loaded.errors).toHaveLength(1);
  });
});
