import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { writeFixture } from "../helpers.js";

const base = {
  "board.kicad_pro": "{}",
  "board.kicad_sch": "(kicad_sch)",
  "board.kicad_pcb": '(kicad_pcb (title_block (rev "v1.0")))',
};
const enabled =
  "version: 1\nprojects:\n  - path: .\n    bom: bom.csv\nrules:\n  bom.compliance:\n    enabled: true\nfail-on: never\n";
const enabledRequire =
  "version: 1\nprojects:\n  - path: .\n    bom: bom.csv\nrules:\n  bom.compliance:\n    enabled: true\n    require: true\nfail-on: never\n";

function complianceFindings(result: Awaited<ReturnType<typeof runPipeline>>) {
  return result.findings.filter((finding) => finding.ruleId === "bom.compliance");
}

describe("bom.compliance", () => {
  it("flags a populated component marked non-compliant", async () => {
    const root = await writeFixture({
      ...base,
      "bom.csv": "Reference,MPN,RoHS,DNP\nR1,ABC,Non-Compliant,false\nR2,DEF,RoHS Compliant,false\n",
      "boardreadyops.yml": enabled,
    });

    const findings = complianceFindings(await runPipeline({ path: root, rules: ["bom.compliance"], failOn: "never" }));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.details).toMatchObject({ reference: "R1", compliance: "Non-Compliant" });
  });

  it("flags missing compliance data only when require is set", async () => {
    const files = { ...base, "bom.csv": "Reference,MPN,DNP\nR1,ABC,false\n" };

    const lenient = await writeFixture({ ...files, "boardreadyops.yml": enabled });
    expect(
      complianceFindings(await runPipeline({ path: lenient, rules: ["bom.compliance"], failOn: "never" })),
    ).toEqual([]);

    const strict = await writeFixture({ ...files, "boardreadyops.yml": enabledRequire });
    const findings = complianceFindings(
      await runPipeline({ path: strict, rules: ["bom.compliance"], failOn: "never" }),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/no RoHS\/REACH compliance/);
  });

  it("passes for compliant parts, skips DNP, and stays off unless enabled", async () => {
    const compliant = await writeFixture({
      ...base,
      "bom.csv": "Reference,MPN,RoHS,DNP\nR1,ABC,Yes,false\nR2,DEF,Non-Compliant,true\n",
      "boardreadyops.yml": enabledRequire,
    });
    expect(
      complianceFindings(await runPipeline({ path: compliant, rules: ["bom.compliance"], failOn: "never" })),
    ).toEqual([]);

    const offByDefault = await writeFixture({
      ...base,
      "bom.csv": "Reference,MPN,RoHS,DNP\nR1,ABC,Non-Compliant,false\n",
      "boardreadyops.yml": "version: 1\nprojects:\n  - path: .\n    bom: bom.csv\nfail-on: never\n",
    });
    expect(
      complianceFindings(await runPipeline({ path: offByDefault, rules: ["bom.compliance"], failOn: "never" })),
    ).toEqual([]);

    const disabled = await writeFixture({
      ...base,
      "bom.csv": "Reference,MPN,RoHS,DNP\nR1,ABC,Non-Compliant,false\n",
      "boardreadyops.yml":
        "version: 1\nprojects:\n  - path: .\n    bom: bom.csv\nrules:\n  bom.compliance: false\nfail-on: never\n",
    });
    expect(
      complianceFindings(await runPipeline({ path: disabled, rules: ["bom.compliance"], failOn: "never" })),
    ).toEqual([]);
  });
});
