import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runPipeline } from "../../../src/core/pipeline.js";

const demoRoot = path.resolve("examples/golden-demo");

async function readExpected(): Promise<{ broken: string[]; fixed: string[] }> {
  const raw = await fs.readFile(path.join(demoRoot, "expected-findings.json"), "utf8");
  return JSON.parse(raw) as { broken: string[]; fixed: string[] };
}

function ruleIds(findings: ReadonlyArray<{ ruleId: string }>): string[] {
  return [...new Set(findings.map((finding) => finding.ruleId))].sort();
}

describe("golden demo corpus", () => {
  it("the broken board reports exactly the documented findings and fails", async () => {
    const expected = await readExpected();
    const result = await runPipeline({ path: path.join(demoRoot, "broken"), failOn: "high" });

    expect(ruleIds(result.findings)).toEqual([...expected.broken].sort());
    expect(result.summary.failed).toBe(true);
  });

  it("the fixed board clears every documented finding and passes", async () => {
    const expected = await readExpected();
    const result = await runPipeline({ path: path.join(demoRoot, "fixed"), failOn: "high" });

    expect(ruleIds(result.findings)).toEqual([...expected.fixed].sort());
    expect(result.summary.failed).toBe(false);
  });
});
