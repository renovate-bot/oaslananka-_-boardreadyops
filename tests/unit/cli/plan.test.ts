import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import agentPlanSchema from "../../../schemas/agent-plan.schema.json" with { type: "json" };
import { runCli } from "../../../src/cli/index.js";

const fixtureRoot = path.resolve("tests/fixtures/projects/bom-missing-mpn");
const releaseReadyFixture = path.resolve("tests/fixtures/projects/release-ready");
const missingOutputsFixture = path.resolve("tests/fixtures/projects/missing-gerber");
const malformedConfigFixture = path.resolve("tests/fixtures/projects/malformed-config");

describe("agent plan command", () => {
  it("emits a stable JSON contract", async () => {
    const { exitCode, plan } = await runPlan(["plan", fixtureRoot, "--rule", "bom.mpn-present", "--fail-on", "never"]);

    expect(exitCode).toBe(0);
    expectValidAgentPlan(plan);
    expect(plan.schemaVersion).toBe(1);
    expect(plan.tool.name).toBe("boardreadyops");
    expect(Array.isArray(plan.nextActions)).toBe(true);
    expect(plan.nextActions).toHaveLength(0);
    expect(plan.releaseActions[0]).toMatchObject({
      ruleId: "release.prepare-evidence",
      safeAutoFixPossible: false,
    });
  });

  it("describes a passing project without next actions", async () => {
    const { exitCode, plan } = await runPlan(["plan", releaseReadyFixture, "--fail-on", "never"]);

    expect(exitCode).toBe(0);
    expectValidAgentPlan(plan);
    expect(plan.summary.total).toBe(0);
    expect(plan.nextActions).toHaveLength(0);
    expect(
      plan.releaseActions[0].commandsToVerify.some((command: string) =>
        command.includes("boardreadyops release prepare"),
      ),
    ).toBe(true);
  });

  it("turns findings into actionable agent next actions", async () => {
    const { exitCode, plan } = await runPlan(["plan", missingOutputsFixture, "--fail-on", "never"]);

    expect(exitCode).toBe(0);
    expectValidAgentPlan(plan);
    expect(plan.summary.total).toBeGreaterThan(0);
    expect(plan.nextActions[0]).toMatchObject({
      ruleId: "manufacturing.outputs-present",
      safeAutoFixPossible: false,
    });
    expect(plan.nextActions[0].fixStrategy.steps.length).toBeGreaterThan(0);
    expect(plan.nextActions[0].commandsToVerify[0]).toContain("boardreadyops check");
  });

  it("fails safely and points agents at invalid configuration fixes", async () => {
    const { exitCode, plan } = await runPlan(["plan", malformedConfigFixture]);

    expect(exitCode).toBe(1);
    expectValidAgentPlan(plan);
    expect(plan.status).toBe("failed");
    expect(plan.nextActions[0]).toMatchObject({
      ruleId: "config.invalid",
      safeAutoFixPossible: false,
    });
    expect(plan.nextActions[0].fixStrategy.description).toContain("configuration");
  });
});

async function runPlan(args: string[]) {
  const streams = captureStreams();
  const exitCode = await runCli(args, streams);
  return { exitCode, plan: JSON.parse(streams.stdoutText()) };
}

function expectValidAgentPlan(plan: unknown) {
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(agentPlanSchema);
  expect(validate(plan), JSON.stringify(validate.errors)).toBe(true);
}

function captureStreams() {
  let stdout = "";
  return {
    stdout: {
      write(value: string) {
        stdout += value;
        return true;
      },
    },
    stderr: {
      write() {
        return true;
      },
    },
    stdoutText() {
      return stdout;
    },
  } as unknown as {
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;
    stdoutText(): string;
  };
}
