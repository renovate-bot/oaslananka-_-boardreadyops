import { describe, expect, it } from "vitest";
import { validateConfig } from "../../../../src/core/config.js";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { writeFixture } from "../helpers.js";

const ruleId = "firmware.arduino-pin-contract";
const base = {
  "board.kicad_pro": "{}",
  "board.kicad_sch": "(kicad_sch)",
  "board.kicad_pcb": '(kicad_pcb (title_block (rev "v1.0")))',
};
const config =
  "version: 1\nprojects:\n  - path: .\n    pinmap: pins.yml\n    firmware:\n      arduino:\n        pinAssignments: pins.h\nrules:\n  firmware.arduino-pin-contract:\n    enabled: true\nfail-on: never\n";
const twoSignalPinmap =
  "version: 1\npins:\n  - designator: U1\n    pin: PA1\n    net: LED_STATUS\n    firmware: LED_STATUS\n  - designator: U1\n    pin: PA2\n    net: I2C_SDA\n    firmware: I2C_SDA\n";

describe("firmware.arduino-pin-contract", () => {
  it("accepts arduino firmware pin assignment configuration", () => {
    expect(
      validateConfig({
        version: 1,
        firmware: { arduino: { pinAssignments: "firmware/pins.h" } },
        projects: [{ path: ".", firmware: { arduino: { pinAssignments: "board-pins.h" } } }],
      }),
    ).toEqual([]);
  });

  it("passes when the Arduino header matches the pinmap", async () => {
    const root = await writeFixture({
      ...base,
      "pins.yml":
        "version: 1\npins:\n  - designator: U1\n    pin: PA1\n    net: LED_STATUS\n    firmware: LED_STATUS\n",
      "pins.h": "#define LED_STATUS U1.PA1 // net=LED_STATUS\n",
      "boardreadyops.yml": config,
    });

    expect((await runPipeline({ path: root, rules: [ruleId], failOn: "never" })).findings).toEqual([]);
  });

  it("reports mismatched, unknown, and missing firmware signals", async () => {
    const root = await writeFixture({
      ...base,
      "pins.yml": twoSignalPinmap,
      "pins.h": "#define LED_STATUS U1.PA9 // net=LED_STATUS\n#define EXTRA U1.PB1\n",
      "boardreadyops.yml": config,
    });

    const findings = (await runPipeline({ path: root, rules: [ruleId], failOn: "never" })).findings;
    expect(findings).toHaveLength(3);
    expect(findings.map((entry) => entry.message).join("\n")).toMatch(/LED_STATUS/);
    expect(findings.some((entry) => entry.message.includes("EXTRA"))).toBe(true);
    expect(findings.some((entry) => entry.message.includes("I2C_SDA"))).toBe(true);
    expect(findings.every((entry) => entry.ruleId === ruleId)).toBe(true);
  });

  it("reports a parse error for a header without pin defines", async () => {
    const root = await writeFixture({
      ...base,
      "pins.yml":
        "version: 1\npins:\n  - designator: U1\n    pin: PA1\n    net: LED_STATUS\n    firmware: LED_STATUS\n",
      "pins.h": "// no defines here\n",
      "boardreadyops.yml": config,
    });

    const findings = (await runPipeline({ path: root, rules: [ruleId], failOn: "never" })).findings;
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/could not be parsed/);
  });

  it("skips when the firmware contract is not configured", async () => {
    const root = await writeFixture({
      ...base,
      "pins.yml":
        "version: 1\npins:\n  - designator: U1\n    pin: PA1\n    net: LED_STATUS\n    firmware: LED_STATUS\n",
      "boardreadyops.yml": "version: 1\nprojects:\n  - path: .\n    pinmap: pins.yml\nfail-on: never\n",
    });

    expect((await runPipeline({ path: root, rules: [ruleId], failOn: "never" })).findings).toEqual([]);
  });
});
