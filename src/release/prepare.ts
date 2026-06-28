import type { FindingSummary } from "../core/findings.js";
import { boardReadyVersion } from "../generated/version.js";

export interface PrepareGenerationStage {
  status: "generated" | "skipped" | "failed";
  reason?: string | undefined;
  artifacts?: number | undefined;
  failures?: number | undefined;
  outputDir?: string | undefined;
}

export interface PrepareValidationStage {
  status: "passed" | "failed";
  summary: FindingSummary;
}

export interface PrepareDecision {
  status: "pass" | "fail";
  reasons: string[];
}

export interface ReleasePrepareSummary {
  schemaVersion: 1;
  tool: { name: "boardreadyops"; version: string };
  generatedAt: string;
  stages: { generate: PrepareGenerationStage; validate: PrepareValidationStage };
  decision: PrepareDecision;
}

export function decideRelease(generate: PrepareGenerationStage, validate: PrepareValidationStage): PrepareDecision {
  const reasons: string[] = [];
  if (validate.status === "failed") {
    reasons.push(
      `validation reported ${validate.summary.total} finding(s) (max severity ${validate.summary.maxSeverity})`,
    );
  }
  if (generate.status === "failed") {
    reasons.push(`generation failed for ${generate.failures ?? 0} output step(s)`);
  }
  return { status: reasons.length === 0 ? "pass" : "fail", reasons };
}

export function buildReleasePrepareSummary(
  stages: { generate: PrepareGenerationStage; validate: PrepareValidationStage },
  generatedAt?: string,
): ReleasePrepareSummary {
  return {
    schemaVersion: 1,
    tool: { name: "boardreadyops", version: boardReadyVersion },
    generatedAt: generatedAt ?? new Date().toISOString(),
    stages,
    decision: decideRelease(stages.generate, stages.validate),
  };
}

export function releasePrepareExitCode(summary: ReleasePrepareSummary): number {
  return summary.decision.status === "pass" ? 0 : 1;
}
