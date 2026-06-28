import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { releasePrepareCommand } from "../../../src/cli/commands/release.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/projects/generate-basic",
);

const missingKicadCli = path.join(os.tmpdir(), "boardreadyops-no-such-kicad-cli");

const tempDirs: string[] = [];

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

async function copyFixtureProject(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "brops-prepare-"));
  tempDirs.push(dir);
  await fs.cp(fixtureRoot, dir, { recursive: true });
  return dir;
}

function streams() {
  let stdout = "";
  let stderr = "";
  return {
    streams: {
      stdout: {
        write(chunk: string): boolean {
          stdout += chunk;
          return true;
        },
      } as unknown as NodeJS.WritableStream,
      stderr: {
        write(chunk: string): boolean {
          stderr += chunk;
          return true;
        },
      } as unknown as NodeJS.WritableStream,
    },
    output: () => ({ stdout, stderr }),
  };
}

async function writeFakeKicadCli(root: string): Promise<string> {
  const cli = path.join(root, "fake-kicad-cli.mjs");
  const nodeScript = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
if (args[0] === "version") {
  process.stdout.write("10.0.3\\n");
} else {
  const outputIndex = args.indexOf("--output");
  const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : undefined;
  if (args[0] === "jobset" && outputPath) {
    fs.mkdirSync(outputPath, { recursive: true });
    fs.writeFileSync(path.join(outputPath, "jobset-output.txt"), "ok");
    fs.writeFileSync(path.join(path.dirname(outputPath), "jobset-args.json"), JSON.stringify(args));
  } else if (outputPath) {
    const directoryOutput = args.includes("gerbers") || args.includes("drill");
    if (directoryOutput) {
      fs.mkdirSync(outputPath, { recursive: true });
      fs.writeFileSync(path.join(outputPath, "output.txt"), "ok");
    } else {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, "ok");
    }
  }
}
`;
  await fs.writeFile(cli, nodeScript, "utf8");

  if (process.platform === "win32") {
    const wrapper = path.join(root, "fake-kicad-cli.cmd");
    await fs.writeFile(wrapper, '@echo off\r\nnode "%~dp0fake-kicad-cli.mjs" %*\r\n', "utf8");
    return wrapper;
  }

  await fs.chmod(cli, 0o755);
  return cli;
}

describe("release prepare command", () => {
  it("runs validation, writes a decision summary, and skips generation on request", async () => {
    const project = await copyFixtureProject();
    const io = streams();
    const code = await releasePrepareCommand(project, { skipGenerate: true, quiet: true }, io.streams);

    const summaryPath = path.join(project, "build", "boardreadyops-release", "release-prepare.json");
    const summary = JSON.parse(await fs.readFile(summaryPath, "utf8")) as {
      stages: { generate: { status: string; reason?: string }; validate: { status: string } };
      decision: { status: "pass" | "fail" };
    };

    expect(summary.stages.generate.status).toBe("skipped");
    expect(summary.stages.generate.reason).toMatch(/skip-generate/);
    expect(["pass", "fail"]).toContain(summary.decision.status);
    expect(code).toBe(summary.decision.status === "pass" ? 0 : 1);
  });

  it("runs KiCad jobsets into the release output directory before validation", async () => {
    const project = await copyFixtureProject();
    await fs.writeFile(
      path.join(project, "generate-basic.kicad_jobset"),
      JSON.stringify({ jobs: [{ type: "gerbers", outputPath: "gerbers", enabled: true }] }),
      "utf8",
    );
    await fs.writeFile(
      path.join(project, "generate-basic.kicad_pro"),
      JSON.stringify({ jobsets: ["generate-basic.kicad_jobset"] }),
      "utf8",
    );
    const cli = await writeFakeKicadCli(project);
    const io = streams();

    const code = await releasePrepareCommand(
      project,
      { kicadCli: cli, quiet: true, project: "generate-basic.kicad_pro" },
      io.streams,
    );
    const summaryPath = path.join(project, "build", "boardreadyops-release", "release-prepare.json");
    const summary = JSON.parse(await fs.readFile(summaryPath, "utf8")) as {
      stages: { generate: { status: string; artifacts?: number; outputDir?: string } };
    };
    const jobsetManifest = path.join(
      project,
      "build",
      "boardreadyops-release",
      "outputs",
      "jobsets",
      "boardreadyops-jobset-run.json",
    );
    const jobsetRun = JSON.parse(await fs.readFile(jobsetManifest, "utf8")) as { status: string; jobsets: string[] };

    expect([0, 1]).toContain(code);
    expect(summary.stages.generate.status).toBe("generated");
    expect(summary.stages.generate.outputDir?.replaceAll("\\", "/")).toBe("build/boardreadyops-release/outputs");
    expect(summary.stages.generate.artifacts).toBeGreaterThan(1);
    expect(jobsetRun).toMatchObject({ status: "generated" });
    expect(jobsetRun.jobsets).toContain("generate-basic.kicad_jobset");
    expect(
      await fs.readFile(path.join(project, "build", "boardreadyops-release", "outputs", "jobset-args.json"), "utf8"),
    ).toContain("jobset");
  });

  it("returns 3 when kicad-cli is required but unavailable", async () => {
    const project = await copyFixtureProject();
    const io = streams();
    const code = await releasePrepareCommand(
      project,
      { kicadCli: missingKicadCli, requireKicad: true, quiet: true },
      io.streams,
    );
    expect(code).toBe(3);
    expect(io.output().stderr).toContain("kicad-cli");
  });
});
