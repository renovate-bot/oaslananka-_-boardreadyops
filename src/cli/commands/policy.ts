import path from "node:path";
import { canonicalRoot, runPipeline } from "../../core/pipeline.js";
import { formatPolicyText } from "../../core/policy.js";
import { normalizePathInput } from "../../util/path.js";
import { type CommonCliOptions, pipelineInputFromCli } from "./run.js";

export interface PolicyCommandOptions extends CommonCliOptions {
  simulate?: boolean;
}

export async function policyCommand(
  pathInput: string | undefined,
  options: PolicyCommandOptions,
  streams: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream },
): Promise<number> {
  const root = await canonicalRoot(path.resolve(normalizePathInput(pathInput ?? ".")));
  const result = await runPipeline(pipelineInputFromCli(root, options, false));
  const policy = result.policy;

  if (!policy) {
    if (options.format === "json") {
      streams.stdout.write(`${JSON.stringify({ status: "skipped", reason: "no policy configured" }, null, 2)}\n`);
    } else {
      streams.stdout.write("No policy configured; nothing to evaluate.\n");
    }
    return 0;
  }

  if (options.format === "json") {
    streams.stdout.write(`${JSON.stringify(policy, null, 2)}\n`);
  } else {
    streams.stdout.write(formatPolicyText(policy));
  }

  if (options.simulate) {
    return 0;
  }
  return policy.enforced && policy.status === "fail" ? 1 : 0;
}
