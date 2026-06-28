import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../../src/core/pipeline.js";
import { copyFixture, emptyFailingKicadCli, expectRule, fakeKicadCli, rulelessKicadCli } from "../helpers.js";

describe("drc.kicad", () => {
  it("normalizes KiCad DRC diagnostics into stable findings", async () => {
    const fixture = await copyFixture("safe-basic", true);
    const cli = await fakeKicadCli(fixture);
    const result = await runPipeline({ path: fixture, kicadCli: cli, rules: ["drc.kicad"], failOn: "never" });
    const findings = expectRule(result, "drc.track_too_close", 1);
    expect(findings[0]?.resource.kind).toBe("pcb");
    expect(findings[0]?.severity).toBe("high");
  });

  it("applies KiCad DRC severity overrides and reports command failures without diagnostics", async () => {
    const fixture = await copyFixture("safe-basic", true);
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(
        `${fixture}/boardreadyops.yml`,
        "version: 1\nrules:\n  drc:\n    severity-overrides:\n      track_too_close: critical\n",
        "utf8",
      ),
    );
    const cli = await fakeKicadCli(fixture);
    const overridden = await runPipeline({ path: fixture, kicadCli: cli, rules: ["drc.kicad"], failOn: "never" });
    expectRule(overridden, "drc.track_too_close", 1);
    expect(overridden.findings.find((finding) => finding.ruleId === "drc.track_too_close")?.severity).toBe("critical");

    const emptyCli = await emptyFailingKicadCli(fixture);
    const failed = await runPipeline({ path: fixture, kicadCli: emptyCli, rules: ["drc.kicad"], failOn: "never" });
    expectRule(failed, "drc.kicad", 1);
  });

  it("reports DRC unavailable as high severity when requireKicad is true", async () => {
    const fixture = await copyFixture("safe-basic", true);
    const result = await runPipeline({
      path: fixture,
      rules: ["drc.kicad"],
      kicadCli: "nonexistent-cli",
      requireKicad: true,
      failOn: "never",
    });
    const findings = expectRule(result, "drc.kicad-cli-unavailable", 1);
    expect(findings[0]?.severity).toBe("high");
  });

  it("uses variant option when running DRC", async () => {
    const fixture = await copyFixture("safe-basic", true);
    const cli = await fakeKicadCli(fixture);
    const result = await runPipeline({
      path: fixture,
      kicadCli: cli,
      rules: ["drc.kicad"],
      variant: "revB",
      failOn: "never",
    });
    const findings = expectRule(result, "drc.track_too_close", 1);
    expect(findings[0]?.resource.kind).toBe("pcb");
  });

  it("handles DRC diagnostics without a ruleId", async () => {
    const fixture = await copyFixture("safe-basic", true);
    const cli = await rulelessKicadCli(fixture);
    const result = await runPipeline({ path: fixture, kicadCli: cli, rules: ["drc.kicad"], failOn: "never" });
    const findings = expectRule(result, "drc.drc", 1);
    expect(findings[0]?.severity).toBe("high");
  });

  it("applies invalid DRC severity overrides as the configured default", async () => {
    const fixture = await copyFixture("safe-basic", true);
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(
        `${fixture}/boardreadyops.yml`,
        "version: 1\nrules:\n  drc:\n    severity-overrides:\n      track_too_close: not-a-severity\n",
        "utf8",
      ),
    );
    const cli = await fakeKicadCli(fixture);
    const result = await runPipeline({ path: fixture, kicadCli: cli, rules: ["drc.kicad"], failOn: "never" });
    const findings = expectRule(result, "drc.track_too_close", 1);
    expect(findings[0]?.severity).toBe("high");
  });
});
