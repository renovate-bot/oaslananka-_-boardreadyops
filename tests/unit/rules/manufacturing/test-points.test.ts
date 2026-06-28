import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { writeFixture } from "../helpers.js";

const config = "version: 1\nrules:\n  manufacturing.test-points:\n    enabled: true\n    minimum: 1\nfail-on: never\n";

describe("manufacturing.test-points", () => {
  it("flags a board with fewer test points than required", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": `(kicad_pcb
        (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1"))
      )`,
      "boardreadyops.yml": config,
    });

    const result = await runPipeline({ path: root, rules: ["manufacturing.test-points"], failOn: "never" });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe("manufacturing.test-points");
  });

  it("passes when test points meet the minimum", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": `(kicad_pcb
        (footprint "Lib:TestPoint" (layer "F.Cu") (at 1 1) (property "Reference" "TP1"))
      )`,
      "boardreadyops.yml": config,
    });

    expect((await runPipeline({ path: root, rules: ["manufacturing.test-points"], failOn: "never" })).findings).toEqual(
      [],
    );
  });

  it("is off unless explicitly enabled and when disabled", async () => {
    const pcb = '(kicad_pcb (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1")))';

    const noConfig = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": pcb,
      "boardreadyops.yml": "version: 1\nfail-on: never\n",
    });
    expect(
      (await runPipeline({ path: noConfig, rules: ["manufacturing.test-points"], failOn: "never" })).findings,
    ).toEqual([]);

    const disabled = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": pcb,
      "boardreadyops.yml": "version: 1\nrules:\n  manufacturing.test-points: false\nfail-on: never\n",
    });
    expect(
      (await runPipeline({ path: disabled, rules: ["manufacturing.test-points"], failOn: "never" })).findings,
    ).toEqual([]);
  });
});
