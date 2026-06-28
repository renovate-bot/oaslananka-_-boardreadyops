import { describe, expect, it } from "vitest";
import type { FindingSummary } from "../../../src/core/findings.js";
import {
  buildReleasePrepareSummary,
  decideRelease,
  type PrepareGenerationStage,
  releasePrepareExitCode,
} from "../../../src/release/prepare.js";

function summary(
  failed: boolean,
  total = failed ? 2 : 0,
  maxSeverity: FindingSummary["maxSeverity"] = failed ? "high" : "none",
): FindingSummary {
  return { total, critical: 0, high: failed ? total : 0, medium: 0, low: 0, info: 0, maxSeverity, failed };
}

const generated: PrepareGenerationStage = { status: "generated", artifacts: 5, failures: 0 };
const skipped: PrepareGenerationStage = { status: "skipped", reason: "kicad-cli not available" };
const failedGenerate: PrepareGenerationStage = { status: "failed", failures: 2, artifacts: 1 };

describe("decideRelease", () => {
  it("passes when validation passes and generation did not fail", () => {
    expect(decideRelease(generated, { status: "passed", summary: summary(false) })).toEqual({
      status: "pass",
      reasons: [],
    });
    expect(decideRelease(skipped, { status: "passed", summary: summary(false) }).status).toBe("pass");
  });

  it("fails when validation reports blocking findings", () => {
    const decision = decideRelease(generated, { status: "failed", summary: summary(true) });
    expect(decision.status).toBe("fail");
    expect(decision.reasons[0]).toMatch(/validation reported/);
  });

  it("fails when generation fails even if validation passes", () => {
    const decision = decideRelease(failedGenerate, { status: "passed", summary: summary(false) });
    expect(decision.status).toBe("fail");
    expect(decision.reasons.some((reason) => reason.includes("generation failed"))).toBe(true);
  });
});

describe("buildReleasePrepareSummary", () => {
  it("assembles stages, a stamped time, and a derived decision", () => {
    const built = buildReleasePrepareSummary(
      { generate: generated, validate: { status: "passed", summary: summary(false) } },
      "2026-06-21T00:00:00.000Z",
    );
    expect(built.schemaVersion).toBe(1);
    expect(built.tool.name).toBe("boardreadyops");
    expect(built.generatedAt).toBe("2026-06-21T00:00:00.000Z");
    expect(built.stages.generate).toBe(generated);
    expect(built.decision.status).toBe("pass");
  });
});

describe("releasePrepareExitCode", () => {
  it("maps a pass to 0 and a fail to 1", () => {
    const pass = buildReleasePrepareSummary({
      generate: generated,
      validate: { status: "passed", summary: summary(false) },
    });
    const fail = buildReleasePrepareSummary({
      generate: generated,
      validate: { status: "failed", summary: summary(true) },
    });
    expect(releasePrepareExitCode(pass)).toBe(0);
    expect(releasePrepareExitCode(fail)).toBe(1);
  });
});
