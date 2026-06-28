import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { expectRule, writeFixture } from "../helpers.js";

const baseBoard = `
(kicad_pcb
  (title_block (rev "1.0.0"))
  (footprint "Resistor_SMD:R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
)
`;

const boardWithFiducials = `
(kicad_pcb
  (title_block (rev "1.0.0"))
  (footprint "Resistor_SMD:R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
  (footprint "Fiducial:Fiducial_1mm" (at 0 0 0) (layer "F.Cu") (property "Reference" "FID1"))
  (footprint "Fiducial:Fiducial_1mm" (at 30 30 0) (layer "F.Cu") (property "Reference" "FID2"))
)
`;

const requiredConfig = `version: 1
rules:
  "manufacturing.fiducials":
    enabled: true
    minimum: 2
fail-on: never
`;

describe("manufacturing.fiducials", () => {
  it("is opt-in and does not fire without required=true", async () => {
    const root = await fixture(baseBoard, "version: 1\nfail-on: never\n");
    const result = await runPipeline({ path: root, rules: ["manufacturing.fiducials"], failOn: "never" });
    expectRule(result, "manufacturing.fiducials", 0);
  });

  it("flags missing required assembly fiducials", async () => {
    const root = await fixture(baseBoard, requiredConfig);
    const findings = expectRule(
      await runPipeline({ path: root, rules: ["manufacturing.fiducials"], failOn: "never" }),
      "manufacturing.fiducials",
      1,
    );
    expect(findings[0]?.details).toMatchObject({ required: 2, found: 0 });
  });

  it("passes when enough fiducials are present", async () => {
    const root = await fixture(boardWithFiducials, requiredConfig);
    const result = await runPipeline({ path: root, rules: ["manufacturing.fiducials"], failOn: "never" });
    expectRule(result, "manufacturing.fiducials", 0);
  });
});

async function fixture(board: string, config: string): Promise<string> {
  return writeFixture({
    "board.kicad_pro": "{}",
    "board.kicad_sch": "(kicad_sch)",
    "board.kicad_pcb": board,
    "boardreadyops.yml": config,
  });
}
