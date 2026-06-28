import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateConfig } from "../../../../src/core/config.js";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { loadPlatformioPinContract } from "../../../../src/firmware/platformio.js";

const fixture = path.resolve("tests/fixtures/projects/firmware-contract-platformio");

describe("firmware.platformio-pin-contract", () => {
  it("accepts firmware PlatformIO pin assignment configuration", () => {
    expect(
      validateConfig({
        version: 1,
        firmware: { platformio: { pinAssignments: "firmware/platformio-pins.yml" } },
        projects: [{ path: ".", firmware: { platformio: { pinAssignments: "board-pins.yml" } } }],
      }),
    ).toEqual([]);
  });

  it("loads object-form PlatformIO pin contracts deterministically", async () => {
    await expect(loadPlatformioPinContract(path.join(fixture, "platformio-pins-good.yml"))).resolves.toMatchObject({
      errors: [],
      document: {
        pins: [
          { signal: "LED_STATUS", hardware: "U1.PA1", net: "LED_STATUS", pin: "GPIO2" },
          { signal: "I2C_SDA", hardware: "U1.PA2", net: "I2C_SDA", pin: "GPIO21" },
          { signal: "UART_TX", hardware: "U1.PA3", net: "UART_TX", pin: "GPIO17" },
        ],
      },
    });
  });

  it("skips when the firmware contract is not configured", async () => {
    const result = await runPipeline({
      path: fixture,
      failOn: "never",
      rules: ["firmware.platformio-pin-contract"],
      config: "missing-contract.yml",
    });

    expect(result.findings).toEqual([]);
  });

  it("reports mismatched, extra, and missing firmware assignments with both sources", async () => {
    const result = await runPipeline({
      path: fixture,
      failOn: "never",
      rules: ["firmware.platformio-pin-contract"],
    });

    expect(result.findings).toHaveLength(4);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "firmware.platformio-pin-contract",
          resource: { path: "platformio-pins-mismatch.yml", kind: "firmware" },
          message: expect.stringContaining("LED_STATUS"),
          details: expect.objectContaining({
            sources: { firmware: "platformio-pins-mismatch.yml", pinmap: "pins.yml" },
          }),
        }),
        expect.objectContaining({
          ruleId: "firmware.platformio-pin-contract",
          resource: { path: "platformio-pins-mismatch.yml", kind: "firmware" },
          message: expect.stringContaining("EXTRA_SIGNAL"),
        }),
        expect.objectContaining({
          ruleId: "firmware.platformio-pin-contract",
          resource: { path: "pins.yml", kind: "pinmap" },
          message: expect.stringContaining("I2C_SDA"),
        }),
        expect.objectContaining({
          ruleId: "firmware.platformio-pin-contract",
          resource: { path: "pins.yml", kind: "pinmap" },
          message: expect.stringContaining("UART_TX"),
        }),
      ]),
    );
  });

  it("skips when the rule is disabled or no pinmap is configured", async () => {
    await expect(
      runPipeline({
        path: fixture,
        failOn: "never",
        rules: ["firmware.platformio-pin-contract"],
        config: "disabled-contract.yml",
      }),
    ).resolves.toMatchObject({ findings: [] });

    await expect(
      runPipeline({
        path: fixture,
        failOn: "never",
        rules: ["firmware.platformio-pin-contract"],
        config: "no-pinmap.yml",
      }),
    ).resolves.toMatchObject({ findings: [] });
  });

  it("supports rule-level contract files and reports contract parse errors", async () => {
    await expect(
      runPipeline({
        path: fixture,
        failOn: "never",
        rules: ["firmware.platformio-pin-contract"],
        config: "rule-file-contract.yml",
      }),
    ).resolves.toMatchObject({ findings: [] });

    const invalid = await runPipeline({
      path: fixture,
      failOn: "never",
      rules: ["firmware.platformio-pin-contract"],
      config: "invalid-rule-file.yml",
    });

    expect(invalid.findings).toEqual([
      expect.objectContaining({
        ruleId: "firmware.platformio-pin-contract",
        resource: { path: "invalid-contract.yml", kind: "firmware" },
        message: expect.stringContaining("could not be parsed"),
      }),
    ]);
  });

  it("reports pinmap parse errors before comparing contracts", async () => {
    const result = await runPipeline({
      path: fixture,
      failOn: "never",
      rules: ["firmware.platformio-pin-contract"],
      config: "invalid-pinmap-contract.yml",
    });

    expect(result.findings).toEqual([
      expect.objectContaining({
        ruleId: "firmware.platformio-pin-contract",
        resource: { path: "invalid-pins.yml", kind: "pinmap" },
        message: expect.stringContaining("Pinmap could not be parsed"),
      }),
    ]);
  });

  it("passes when the PlatformIO contract matches the pinmap", async () => {
    const result = await runPipeline({
      path: fixture,
      failOn: "never",
      rules: ["firmware.platformio-pin-contract"],
      config: "good-contract.yml",
    });

    expect(result.findings).toEqual([]);
  });
});
