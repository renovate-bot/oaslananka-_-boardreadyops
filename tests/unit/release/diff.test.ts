import { describe, expect, it } from "vitest";
import { createFinding, type Finding } from "../../../src/core/findings.js";
import type { ReadinessScore } from "../../../src/core/readiness.js";
import { diffReleases, formatReleaseDiffText, type ReleaseSnapshot } from "../../../src/release/diff.js";

function finding(ruleId: string, severity: Finding["severity"]): Finding {
  return createFinding({
    ruleId,
    severity,
    message: `${ruleId} finding`,
    resource: { path: "board.kicad_pcb", kind: "pcb" },
  });
}

function readiness(score: number, status: ReadinessScore["status"], missingRequired: string[]): ReadinessScore {
  return {
    profile: { id: "jlcpcb", name: "JLCPCB", service: "fabrication+assembly" },
    score,
    status,
    blocking: 0,
    nonBlocking: 0,
    evidence: [],
    missingRequired,
    missingRecommended: [],
    warnings: [],
  };
}

const previous: ReleaseSnapshot = {
  fabrication: {
    bom: [
      { reference: "R1", value: "10k", mpn: "OLD-1" },
      { reference: "R2", value: "1k", mpn: "KEEP-2" },
    ],
    outputs: [{ kind: "gerber", files: [{ path: "fab/board.gtl", digest: "a".repeat(64) }] }],
  },
  findings: [finding("bom.missing-mpn", "high"), finding("design.clearance", "medium")],
  readiness: readiness(60, "blocked", ["drill", "gerber"]),
};

const current: ReleaseSnapshot = {
  fabrication: {
    bom: [
      { reference: "R1", value: "10k", mpn: "NEW-1" },
      { reference: "R2", value: "1k", mpn: "KEEP-2" },
      { reference: "R3", value: "100", mpn: "ADDED-3" },
    ],
    outputs: [{ kind: "gerber", files: [{ path: "fab/board.gtl", digest: "b".repeat(64) }] }],
  },
  findings: [finding("design.clearance", "medium"), finding("manufacturing.outputs-present", "critical")],
  readiness: readiness(80, "at-risk", ["gerber"]),
};

describe("release diff engine", () => {
  it("produces a stable diff snapshot for a sample release pair", () => {
    const diff = diffReleases(previous, current, {
      generatedAt: "2026-06-22T00:00:00.000Z",
      toolVersion: "0.0.0-test",
    });
    expect(diff).toMatchSnapshot();
  });

  it("summarizes BOM, output, finding, and readiness changes", () => {
    const diff = diffReleases(previous, current, { generatedAt: "2026-06-22T00:00:00.000Z" });

    expect(diff.summary.bomChanged).toBe(2); // R1 changed, R3 added
    expect(diff.summary.outputsChanged).toBe(1); // gerber digest changed
    expect(diff.summary.findingsAdded).toBe(1); // manufacturing.outputs-present
    expect(diff.summary.findingsRemoved).toBe(1); // bom.missing-mpn
    expect(diff.summary.scoreDelta).toBe(20);
    expect(diff.readiness.statusChanged).toBe(true);
    expect(diff.readiness.resolvedRequired).toEqual(["drill"]);
    expect(diff.readiness.newlyMissingRequired).toEqual([]);
  });

  it("handles a missing previous readiness score", () => {
    const diff = diffReleases({ ...previous, readiness: undefined as unknown as ReadinessScore }, current, {
      generatedAt: "2026-06-22T00:00:00.000Z",
    });
    expect(diff.readiness.previousScore).toBeUndefined();
    expect(diff.readiness.scoreDelta).toBe(80);
  });

  it("renders a readable text summary", () => {
    const diff = diffReleases(previous, current, { generatedAt: "2026-06-22T00:00:00.000Z" });
    const text = formatReleaseDiffText(diff);

    expect(text).toContain("readiness: 60 -> 80 (+20)");
    expect(text).toContain("status: blocked -> at-risk");
    expect(text).toContain("resolved required: drill");
    expect(text).toContain("findings: +1 / -1");
  });
});
