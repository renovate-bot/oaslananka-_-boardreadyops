import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { missingReferences } from "../../../../src/rules/manufacturing/shared.js";
import { expectRule, writeFixture } from "../helpers.js";

const board = `
(kicad_pcb
  (title_block (rev "1.0.0"))
  (footprint "Resistor_SMD:R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
  (footprint "Capacitor_SMD:C_0603" (at 20 10 0) (layer "F.Cu") (property "Reference" "C1"))
  (footprint "Fiducial:Fiducial_1mm" (at 0 0 0) (layer "F.Cu") (property "Reference" "FID1"))
  (footprint "MountingHole:MountingHole_2.2mm_M2" (at 30 30 0) (layer "F.Cu") (property "Reference" "MH1"))
)
`;

const requiredConfig = `version: 1
rules:
  "manufacturing.position-coverage":
    enabled: true
fail-on: never
`;

describe("manufacturing.position-coverage", () => {
  it("flags missing required position output", async () => {
    const root = await fixture({ "board.kicad_pcb": board });
    const findings = expectRule(
      await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" }),
      "manufacturing.position-coverage",
      1,
    );
    expect(findings[0]?.details?.totalMissingRefs).toBe(2);
  });

  it("flags populated references missing from position outputs", async () => {
    const root = await fixture({ "board.kicad_pcb": board, "fab/positions.csv": "Ref,X,Y,Rot\nR1,10,10,0\n" });
    const findings = expectRule(
      await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" }),
      "manufacturing.position-coverage",
      1,
    );
    expect(findings[0]?.details?.missingRefs).toEqual(["C1"]);
  });

  it("ignores position outputs outside discovered KiCad project directories", async () => {
    const root = await writeFixture({
      "hardware/board.kicad_pro": "{}",
      "hardware/board.kicad_sch": "(kicad_sch)",
      "hardware/board.kicad_pcb": board,
      "outside/positions.csv": "Ref,X,Y,Rot\nR1,10,10,0\nC1,20,10,0\n",
      "boardreadyops.yml": requiredConfig,
    });
    const findings = expectRule(
      await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" }),
      "manufacturing.position-coverage",
      1,
    );
    expect(findings[0]?.message).toContain("no position output was found");
    expect(findings[0]?.details?.totalMissingRefs).toBe(2);
  });

  it("matches exact reference tokens without treating R10 as R1", async () => {
    const root = await fixture({
      "board.kicad_pcb": `
(kicad_pcb
  (footprint "Resistor_SMD:R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
  (footprint "Resistor_SMD:R_0603" (at 20 10 0) (layer "F.Cu") (property "Reference" "R10"))
)
`,
      "positions.csv": "Ref,X,Y,Rot\nR10,20,10,0\n",
    });
    const findings = expectRule(
      await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" }),
      "manufacturing.position-coverage",
      1,
    );
    expect(findings[0]?.details?.missingRefs).toEqual(["R1"]);
  });

  it("skips boards with no populated assembly footprints", async () => {
    const root = await fixture({
      "board.kicad_pcb": `
(kicad_pcb
  (footprint "Fiducial:Fiducial_1mm" (at 0 0 0) (layer "F.Cu") (property "Reference" "FID1"))
  (footprint "MountingHole:MountingHole_2.2mm_M2" (at 30 30 0) (layer "F.Cu") (property "Reference" "MH1"))
)
`,
    });
    const result = await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" });
    expectRule(result, "manufacturing.position-coverage", 0);
  });

  it("honors custom position output patterns", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": board,
      "assembly/custom.pickplace": "Ref,X,Y,Rot\nR1,10,10,0\nC1,20,10,0\n",
      "boardreadyops.yml": `version: 1
rules:
  "manufacturing.position-coverage":
    enabled: true
    patterns:
      - "assembly/*.pickplace"
fail-on: never
`,
    });
    const result = await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" });
    expectRule(result, "manufacturing.position-coverage", 0);
  });

  it("returns no missing references for an empty reference list", () => {
    expect(missingReferences("Ref\nR1\n", [])).toEqual([]);
  });

  it("passes when position outputs cover populated references", async () => {
    const root = await fixture({
      "board.kicad_pcb": board,
      "fab/positions.csv": "Ref,X,Y,Rot\nR1,10,10,0\nC1,20,10,0\n",
    });
    const result = await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" });
    expectRule(result, "manufacturing.position-coverage", 0);
  });
});

async function fixture(files: Record<string, string>): Promise<string> {
  return writeFixture({
    "board.kicad_pro": "{}",
    "board.kicad_sch": "(kicad_sch)",
    "boardreadyops.yml": requiredConfig,
    ...files,
  });
}
