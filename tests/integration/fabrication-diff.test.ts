import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { releaseDiffCommand } from "../../src/cli/commands/release.js";
import { diffFabrication } from "../../src/core/diff/fabrication.js";
import { runPipeline } from "../../src/core/pipeline.js";

const fixtureRoot = path.resolve("tests/fixtures/projects");

describe("fabrication diff integration", () => {
  it("compares base and head BOM artifacts from pipeline snapshots", async () => {
    const base = await workspaceFromFixture("bom-single-source");
    const head = await workspaceFromFixture("bom-single-source");
    await fs.appendFile(
      path.join(head, "bom.csv"),
      "\nC45,100nF,Capacitor_SMD:C_0402,Generic,C0402-100N,LCSC,Active,false\n",
      "utf8",
    );

    const previous = await runPipeline({ path: base, failOn: "never" });
    const current = await runPipeline({ path: head, failOn: "never" });
    const diff = diffFabrication(previous.fabrication, current.fabrication, previous.findings, current.findings);

    expect(diff.bom.rows).toContainEqual({
      reference: "C45",
      previous: "",
      current: "C0402-100N Capacitor_SMD:C_0402",
      status: "added",
    });
  });

  it("writes an HTML release diff dashboard via the release diff CLI", async () => {
    const base = await workspaceFromFixture("bom-single-source");
    const head = await workspaceFromFixture("bom-single-source");
    await fs.appendFile(
      path.join(head, "bom.csv"),
      "\nC45,100nF,Capacitor_SMD:C_0402,Generic,C0402-100N,LCSC,Active,false\n",
      "utf8",
    );

    const previousResult = await runPipeline({ path: base, failOn: "never" });
    const previousReport = path.join(base, "previous.json");
    await fs.writeFile(
      previousReport,
      JSON.stringify({ fabrication: previousResult.fabrication, findings: previousResult.findings }),
      "utf8",
    );

    const htmlPath = path.join(head, "diff.html");
    let stderr = "";
    const sink = {
      stdout: { write: () => true } as unknown as NodeJS.WritableStream,
      stderr: {
        write(chunk: string): boolean {
          stderr += chunk;
          return true;
        },
      } as unknown as NodeJS.WritableStream,
    };

    const exit = await releaseDiffCommand(previousReport, head, { html: htmlPath, failOn: "never" }, sink);

    expect(exit, stderr).toBe(0);
    const html = await fs.readFile(htmlPath, "utf8");
    expect(html).toContain('id="fabrication-diff-heading"');
    expect(html).toContain("Fabrication Changes");
    expect(html).toContain("<code>C45</code>");
    expect(html).toContain('<span class="badge diff-added">Added</span>');
  });
});

async function workspaceFromFixture(fixture: string): Promise<string> {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "boardreadyops-diff-"));
  await fs.rm(workspace, { recursive: true, force: true });
  await fs.cp(path.join(fixtureRoot, fixture), workspace, { recursive: true });
  return workspace;
}
