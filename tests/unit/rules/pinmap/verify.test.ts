import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { expectRule, runFixture, writeFixture } from "../helpers.js";

const SLOW_FIXTURE_TIMEOUT_MS = 15_000;

describe("pinmap.verify", () => {
  it(
    "flags pinmap nets missing from schematic labels",
    async () => {
      const result = await runFixture("pinmap-mismatch");
      const findings = expectRule(result, "pinmap.verify", 1);
      expect(findings[0]?.resource.kind).toBe("pinmap");
    },
    SLOW_FIXTURE_TIMEOUT_MS,
  );
  it("flags missing hierarchical child schematic sheets", async () => {
    const root = await writeFixture({
      "pin.kicad_pro": "{}",
      "pin.kicad_pcb": '(kicad_pcb (title_block (rev "v1.0")))',
      "pin.kicad_sch": `(kicad_sch
        (global_label "ROOT_OK")
        (sheet
          (property "Sheet name" "missing")
          (property "Sheet file" "missing.kicad_sch")
          (pin "IFACE" input)
        )
      )`,
      "pins.yml": "version: 1\npins:\n  - designator: U1\n    pin: '1'\n    net: ROOT_OK\n",
      "boardreadyops.yml": "version: 1\nprojects:\n  - path: .\n    pinmap: pins.yml\nfail-on: never\n",
    });

    const result = await runPipeline({ path: root, rules: ["pinmap.verify"], failOn: "never" });

    const findings = expectRule(result, "pinmap.verify", 1);
    expect(findings[0]?.message).toContain("missing.kicad_sch");
    expect(findings[0]?.message).toContain("was not found");
  });

  it("flags sheet pins without matching child hierarchical labels", async () => {
    const root = await writeFixture({
      "pin.kicad_pro": "{}",
      "pin.kicad_pcb": '(kicad_pcb (title_block (rev "v1.0")))',
      "pin.kicad_sch": `(kicad_sch
        (global_label "ROOT_OK")
        (sheet
          (property "Sheet name" "child")
          (property "Sheet file" "child.kicad_sch")
          (pin "IFACE" input)
        )
      )`,
      "child.kicad_sch": '(kicad_sch (hierarchical_label "OTHER"))',
      "pins.yml": "version: 1\npins:\n  - designator: U1\n    pin: '1'\n    net: ROOT_OK\n",
      "boardreadyops.yml": "version: 1\nprojects:\n  - path: .\n    pinmap: pins.yml\nfail-on: never\n",
    });

    const result = await runPipeline({ path: root, rules: ["pinmap.verify"], failOn: "never" });

    const findings = expectRule(result, "pinmap.verify", 1);
    expect(findings[0]?.message).toContain("Sheet pin IFACE");
    expect(findings[0]?.message).toContain("has no matching hierarchical label");
  });
});
