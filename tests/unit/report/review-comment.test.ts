import { describe, expect, it } from "vitest";
import { createFinding, type Finding, type FindingSummary } from "../../../src/core/findings.js";
import type { RunResult } from "../../../src/core/result.js";
import { formatReviewComment } from "../../../src/report/review-comment.js";

function summary(findings: Finding[]): FindingSummary {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  return {
    total: findings.length,
    ...counts,
    maxSeverity: findings.length > 0 ? "high" : "none",
    failed: findings.some((finding) => finding.severity === "high" || finding.severity === "critical"),
  };
}

function finding(ruleId: string, severity: Finding["severity"], message: string, path: string, line?: number): Finding {
  return createFinding({
    ruleId,
    severity,
    message,
    resource: { path, kind: "pcb" },
    confidence: "high",
    ...(line ? { location: { line } } : {}),
  });
}

function result(findings: Finding[]): RunResult {
  return {
    schemaVersion: 1,
    tool: { name: "boardreadyops", version: "1.0.0" },
    summary: summary(findings),
    projects: [],
    findings,
    fabrication: { bom: [], outputs: [] },
    generatedAt: "2026-06-22T00:00:00.000Z",
  };
}

describe("formatReviewComment", () => {
  it("renders a FAIL decision, severity table, and findings grouped by severity", () => {
    const findings = [
      finding("design.board-outline", "high", "PCB outline is open.", "demo.kicad_pcb"),
      finding("bom.missing-mpn", "high", "R1 is missing an MPN.", "bom.csv", 2),
      finding("design.copper-balance", "low", "Low copper coverage.", "demo.kicad_pcb"),
    ];
    const body = formatReviewComment(result(findings), [{ label: "JSON report", url: "https://example/run" }]);

    expect(body).toContain("<!-- boardreadyops:sticky:v1 -->");
    expect(body).toContain("Decision: ❌ FAIL");
    expect(body).toContain("| Severity | Count |");
    expect(body).toContain("### Top findings");
    expect(body).toMatch(/\*\*High\*\* \(2\)/);
    expect(body).toContain("`design.board-outline`");
    expect(body).toContain("`bom.csv:2`");
    expect(body).toContain("[JSON report](https://example/run)");
  });

  it("renders a PASS decision with no findings", () => {
    const body = formatReviewComment(result([]));
    expect(body).toContain("Decision: ✅ PASS");
    expect(body).toContain("No blocking findings");
    expect(body).not.toContain("### Reports");
  });

  it("caps each severity group and notes the remainder", () => {
    const findings = Array.from({ length: 5 }, (_, index) =>
      finding(`rule.${index}`, "high", `finding ${index}`, "board.kicad_pcb"),
    );
    const body = formatReviewComment(result(findings));
    expect(body).toContain("…and 2 more.");
  });
});
