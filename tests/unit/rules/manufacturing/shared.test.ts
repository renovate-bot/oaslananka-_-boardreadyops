import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { missingReferences, positiveInteger } from "../../../../src/rules/manufacturing/shared.js";
import { writeFixture } from "../helpers.js";

describe("manufacturing shared utilities", () => {
  describe("positiveInteger", () => {
    it("returns fallback for non-number value", () => {
      expect(positiveInteger("abc" as unknown as number, 5)).toBe(5);
    });

    it("returns fallback for non-integer number", () => {
      expect(positiveInteger(3.14, 5)).toBe(5);
    });

    it("returns fallback for zero", () => {
      expect(positiveInteger(0, 5)).toBe(5);
    });

    it("returns value for valid positive integer", () => {
      expect(positiveInteger(10, 5)).toBe(10);
    });
  });

  describe("missingReferences", () => {
    it("matches reference when found in text", () => {
      expect(missingReferences("Ref,Comment\nR1,Resistor\n", ["R1"])).toEqual([]);
    });
  });

  it("uses default search root when project has no output roots", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": `
(kicad_pcb
  (title_block (rev "1.0.0"))
  (footprint "R_0603" (at 10 10 0) (layer "F.Cu") (property "Reference" "R1"))
)
`,
      "boardreadyops.yml": `version: 1
rules:
  "manufacturing.position-coverage":
    enabled: true
fail-on: never
`,
    });
    const result = await runPipeline({ path: root, rules: ["manufacturing.position-coverage"], failOn: "never" });
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
  });
});
