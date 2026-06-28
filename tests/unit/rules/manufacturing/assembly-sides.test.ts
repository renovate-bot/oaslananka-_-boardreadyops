import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { writeFixture } from "../helpers.js";

const enabled = "version: 1\nrules:\n  manufacturing.assembly-sides:\n    enabled: true\nfail-on: never\n";
const bottomBoard = `(kicad_pcb
  (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1"))
  (footprint "Lib:U" (layer "B.Cu") (at 2 2) (property "Reference" "U1"))
)`;

describe("manufacturing.assembly-sides", () => {
  it("flags assembly components on the bottom side", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": bottomBoard,
      "boardreadyops.yml": enabled,
    });

    const result = await runPipeline({ path: root, rules: ["manufacturing.assembly-sides"], failOn: "never" });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe("manufacturing.assembly-sides");
    expect(result.findings[0]?.message).toContain("U1");
  });

  it("passes when single-sided or bottom-side placement is allowed", async () => {
    const topOnly = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": '(kicad_pcb (footprint "Lib:R" (layer "F.Cu") (at 1 1) (property "Reference" "R1")))',
      "boardreadyops.yml": enabled,
    });
    expect(
      (await runPipeline({ path: topOnly, rules: ["manufacturing.assembly-sides"], failOn: "never" })).findings,
    ).toEqual([]);

    const allowed = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": bottomBoard,
      "boardreadyops.yml":
        "version: 1\nrules:\n  manufacturing.assembly-sides:\n    enabled: true\n    allow-bottom-side: true\nfail-on: never\n",
    });
    expect(
      (await runPipeline({ path: allowed, rules: ["manufacturing.assembly-sides"], failOn: "never" })).findings,
    ).toEqual([]);
  });

  it("does not run when disabled and lists multiple bottom-side parts in order", async () => {
    const disabled = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": bottomBoard,
      "boardreadyops.yml": "version: 1\nrules:\n  manufacturing.assembly-sides: false\nfail-on: never\n",
    });
    expect(
      (await runPipeline({ path: disabled, rules: ["manufacturing.assembly-sides"], failOn: "never" })).findings,
    ).toEqual([]);

    const multi = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": `(kicad_pcb
        (footprint "Lib:U" (layer "B.Cu") (at 1 1) (property "Reference" "U2"))
        (footprint "Lib:U" (layer "B.Cu") (at 2 2) (property "Reference" "U1"))
        (footprint "Lib:X" (layer "Edge.Cuts") (at 3 3) (property "Reference" "X1"))
      )`,
      "boardreadyops.yml": enabled,
    });
    const findings = (await runPipeline({ path: multi, rules: ["manufacturing.assembly-sides"], failOn: "never" }))
      .findings;
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("U1, U2");
  });
});
