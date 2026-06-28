import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli/index.js";

const fixtureRoot = path.resolve("tests/fixtures/projects");

describe("E2E pipeline flow", () => {
  it("executes full init -> run -> release cycle", async () => {
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), "boardreadyops-e2e-"));
    await fs.cp(path.join(fixtureRoot, "safe-basic"), temp, { recursive: true });

    // 1. init basic configuration
    const initStreams = mockStreams();
    const initCode = await runCli(["init", "--profile", "basic", "--output", temp], initStreams);
    expect(initCode).toBe(0);
    expect(await fs.stat(path.join(temp, "boardreadyops.yml"))).toBeTruthy();

    // 2. run preflight check
    const runStreams = mockStreams();
    const runCode = await runCli(["run", temp, "--json", "build/out.json"], runStreams);
    expect(runCode).toBe(0);

    const runReport = JSON.parse(await fs.readFile(path.join(temp, "build/out.json"), "utf8"));
    expect(runReport.summary.total).toBe(0);
    expect(runReport.readiness.status).toBe("ready");

    // 3. release prepare
    const releaseStreams = mockStreams();
    const releaseCode = await runCli(["release", "prepare", temp, "--skip-generate"], releaseStreams);
    expect(releaseCode).toBe(0);
  });
});

function mockStreams() {
  let stdout = "";
  let stderr = "";
  return {
    stdout: {
      write(value: string) {
        stdout += value;
        return true;
      },
    },
    stderr: {
      write(value: string) {
        stderr += value;
        return true;
      },
    },
    stdoutText() {
      return stdout;
    },
    stderrText() {
      return stderr;
    },
  } as unknown as {
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;
    stdoutText(): string;
    stderrText(): string;
  };
}
