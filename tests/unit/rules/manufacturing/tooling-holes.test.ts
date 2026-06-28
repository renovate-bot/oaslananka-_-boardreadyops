import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { expectRule, writeFixture } from "../helpers.js";

const boardWithoutTooling = `
(kicad_pcb
  (title_block (rev "1.0.0"))
  (footprint "Resistor_SMD:R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
)
`;

const boardWithTooling = `
(kicad_pcb
  (title_block (rev "1.0.0"))
  (footprint "Resistor_SMD:R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
  (footprint "MountingHole:MountingHole_2.2mm_M2" (at 0 0 0) (layer "F.Cu") (property "Reference" "MH1"))
  (footprint "MountingHole:MountingHole_2.2mm_M2" (at 30 30 0) (layer "F.Cu") (property "Reference" "MH2"))
)
`;

const requiredConfig = `version: 1
rules:
  "manufacturing.tooling-holes":
    enabled: true
    minimum: 2
fail-on: never
`;

describe("manufacturing.tooling-holes", () => {
  it("flags missing configured tooling holes", async () => {
    const root = await fixture(boardWithoutTooling, requiredConfig);
    const findings = expectRule(
      await runPipeline({ path: root, rules: ["manufacturing.tooling-holes"], failOn: "never" }),
      "manufacturing.tooling-holes",
      1,
    );
    expect(findings[0]?.details).toMatchObject({ required: 2, found: 0 });
  });

  it("passes when enough tooling holes are present", async () => {
    const root = await fixture(boardWithTooling, requiredConfig);
    const result = await runPipeline({ path: root, rules: ["manufacturing.tooling-holes"], failOn: "never" });
    expectRule(result, "manufacturing.tooling-holes", 0);
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
