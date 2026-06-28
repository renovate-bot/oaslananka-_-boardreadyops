import { describe, expect, it } from "vitest";
import { policyCommand } from "../../../src/cli/commands/policy.js";
import { writeFixture } from "../rules/helpers.js";

function collectStreams() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    streams: {
      stdout: { write: (text: string) => out.push(text) } as unknown as NodeJS.WritableStream,
      stderr: { write: (text: string) => err.push(text) } as unknown as NodeJS.WritableStream,
    },
  };
}

describe("policy command", () => {
  it("reports when no policy is configured", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": "(kicad_pcb)",
      "boardreadyops.yml": "version: 1\nfail-on: never\n",
    });
    const { out, streams } = collectStreams();
    const code = await policyCommand(root, {} as never, streams);
    expect(code).toBe(0);
    expect(out.join("")).toContain("No policy configured");
  });

  it("blocks with exit code 1 when an enforced policy fails", async () => {
    // No schematic -> a high-severity project-discovery finding -> max-severity:high fails.
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_pcb": "(kicad_pcb)",
      "boardreadyops.yml":
        "version: 1\nfail-on: never\npolicy:\n  enforce: true\n  rules:\n    - id: no-high\n      type: max-severity\n      severity: high\n",
    });
    const { out, streams } = collectStreams();
    const code = await policyCommand(root, {} as never, streams);
    expect(code).toBe(1);
    expect(out.join("")).toContain("Policy: FAIL (enforced)");
  });

  it("never changes the exit code in simulate mode", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_pcb": "(kicad_pcb)",
      "boardreadyops.yml":
        "version: 1\nfail-on: never\npolicy:\n  enforce: true\n  rules:\n    - id: no-high\n      type: max-severity\n      severity: high\n",
    });
    const { streams } = collectStreams();
    const code = await policyCommand(root, { simulate: true } as never, streams);
    expect(code).toBe(0);
  });

  it("does not block when the policy is advisory only", async () => {
    const root = await writeFixture({
      "board.kicad_pro": "{}",
      "board.kicad_sch": "(kicad_sch)",
      "board.kicad_pcb": "(kicad_pcb)",
      "boardreadyops.yml":
        "version: 1\nfail-on: never\npolicy:\n  rules:\n    - id: no-high\n      type: max-severity\n      severity: high\n",
    });
    const { streams } = collectStreams();
    const code = await policyCommand(root, {} as never, streams);
    expect(code).toBe(0);
  });
});
