import { describe, expect, it } from "vitest";
import { createFinding, type Finding } from "../../../src/core/findings.js";
import { computeReadiness } from "../../../src/core/readiness.js";

function finding(severity: Finding["severity"], suppressed = false): Finding {
  return createFinding({
    ruleId: `rule.${severity}`,
    severity,
    message: `${severity} finding`,
    resource: { path: "board.kicad_pcb", kind: "pcb" },
    ...(suppressed ? { suppressed: true } : {}),
  });
}

describe("readiness scoring", () => {
  it("is ready with full evidence and no findings", () => {
    const result = computeReadiness({
      profile: { id: "jlcpcb", name: "JLCPCB", service: "fabrication+assembly" },
      requiredOutputs: ["bom", "gerber"],
      recommendedOutputs: ["pdf"],
      presentOutputs: new Set(["bom", "gerber", "pdf"]),
      findings: [],
      failOn: "high",
    });
    expect(result.status).toBe("ready");
    expect(result.score).toBe(100);
    expect(result.missingRequired).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("is blocked when a required output is missing", () => {
    const result = computeReadiness({
      requiredOutputs: ["bom", "gerber"],
      recommendedOutputs: [],
      presentOutputs: new Set(["bom"]),
      findings: [],
      failOn: "high",
    });
    expect(result.status).toBe("blocked");
    expect(result.missingRequired).toEqual(["gerber"]);
    expect(result.score).toBeLessThan(100);
    expect(result.warnings).toContain("Required output gerber is missing.");
  });

  it("separates blocking and non-blocking findings by the fail-on threshold", () => {
    const result = computeReadiness({
      requiredOutputs: [],
      recommendedOutputs: [],
      presentOutputs: new Set(),
      findings: [finding("critical"), finding("low"), finding("high", true), finding("info")],
      failOn: "high",
    });
    // critical >= high -> blocking; low -> non-blocking; suppressed high -> ignored; info -> ignored
    expect(result.blocking).toBe(1);
    expect(result.nonBlocking).toBe(1);
    expect(result.status).toBe("blocked");
  });

  it("treats every finding as non-blocking when fail-on is never", () => {
    const result = computeReadiness({
      requiredOutputs: [],
      recommendedOutputs: [],
      presentOutputs: new Set(),
      findings: [finding("critical")],
      failOn: "never",
    });
    expect(result.blocking).toBe(0);
    expect(result.nonBlocking).toBe(1);
    expect(result.status).toBe("at-risk");
  });

  it("is at-risk when only recommended evidence is missing", () => {
    const result = computeReadiness({
      requiredOutputs: ["gerber"],
      recommendedOutputs: ["pdf"],
      presentOutputs: new Set(["gerber"]),
      findings: [],
      failOn: "high",
    });
    expect(result.status).toBe("at-risk");
    expect(result.missingRecommended).toEqual(["pdf"]);
  });
});
