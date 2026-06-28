import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { writeFixture } from "../helpers.js";

const config = "version: 1\nrules:\n  design.unique-references:\n    enabled: true\nfail-on: never\n";

describe("design.unique-references", () => {
  it("flags duplicate reference designators", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": `(kicad_pcb
        (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1"))
        (footprint "Lib:R" (layer "F.Cu") (at 2 2) (property "Reference" "R1"))
        (footprint "Lib:C" (layer "F.Cu") (at 3 3) (property "Reference" "C1"))
      )`,
      "boardreadyops.yml": config,
    });

    const result = await runPipeline({ path: root, rules: ["design.unique-references"], failOn: "never" });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe("design.unique-references");
    expect(result.findings[0]?.message).toContain("R1");
  });

  it("passes when every reference is unique and is off by default", async () => {
    const files = {
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": `(kicad_pcb
        (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1"))
        (footprint "Lib:R" (layer "F.Cu") (at 2 2) (property "Reference" "R2"))
      )`,
    };
    const enabled = await writeFixture({ ...files, "boardreadyops.yml": config });
    expect(
      (await runPipeline({ path: enabled, rules: ["design.unique-references"], failOn: "never" })).findings,
    ).toEqual([]);

    const noConfig = await writeFixture({
      ...files,
      "board.kicad_pcb": `(kicad_pcb
        (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1"))
        (footprint "Lib:R" (layer "F.Cu") (at 2 2) (property "Reference" "R1"))
      )`,
      "boardreadyops.yml": "version: 1\nfail-on: never\n",
    });
    expect(
      (await runPipeline({ path: noConfig, rules: ["design.unique-references"], failOn: "never" })).findings,
    ).toEqual([]);
  });

  it("respects ignore-refs and a disabled config", async () => {
    const pcb = `(kicad_pcb
      (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1"))
      (footprint "Lib:R" (layer "F.Cu") (at 2 2) (property "Reference" "R1"))
    )`;

    const ignored = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": pcb,
      "boardreadyops.yml":
        'version: 1\nrules:\n  design.unique-references:\n    enabled: true\n    ignore-refs: ["R1"]\nfail-on: never\n',
    });
    expect(
      (await runPipeline({ path: ignored, rules: ["design.unique-references"], failOn: "never" })).findings,
    ).toEqual([]);

    const disabled = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": pcb,
      "boardreadyops.yml": "version: 1\nrules:\n  design.unique-references: false\nfail-on: never\n",
    });
    expect(
      (await runPipeline({ path: disabled, rules: ["design.unique-references"], failOn: "never" })).findings,
    ).toEqual([]);
  });
});
