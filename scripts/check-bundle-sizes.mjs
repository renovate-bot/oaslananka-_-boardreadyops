import { execSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const DEFAULT_FAIL_AT_RATIO = 0.9;
const w = (msg) => process.stdout.write(`${msg}\n`);

const BUDGETS = {
  "dist/action/index.cjs": { budget: 16_000_000, failAtRatio: DEFAULT_FAIL_AT_RATIO },
  "dist/cli/index.cjs": { budget: 12_500_000, failAtRatio: DEFAULT_FAIL_AT_RATIO },
};

export function normalizeSizePolicy(policy, label = "size budget") {
  const candidate = typeof policy === "number" ? { budget: policy } : (policy ?? {});
  const budget = candidate.budget;
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error(`${label} must define a positive numeric budget`);
  }
  const failAtRatio =
    Number.isFinite(candidate.failAtRatio) && candidate.failAtRatio > 0 ? candidate.failAtRatio : DEFAULT_FAIL_AT_RATIO;
  return { budget, failAtRatio };
}

function main() {
  let exitCode = 0;

  w("Bundle size budget check");
  w("========================");

  for (const [relativePath, rawPolicy] of Object.entries(BUDGETS)) {
    const policy = normalizeSizePolicy(rawPolicy, relativePath);
    const absolutePath = resolve(ROOT, relativePath);
    try {
      const { size } = statSync(absolutePath);
      const ratio = size / policy.budget;
      const pct = (ratio * 100).toFixed(1);
      const status = ratio <= policy.failAtRatio ? "PASS" : "FAIL";
      if (status === "FAIL") exitCode = 1;
      w(
        `  ${status}  ${relativePath}: ${(size / 1_000_000).toFixed(2)} MB / ${(policy.budget / 1_000_000).toFixed(2)} MB (${pct}%, fail-at ${(policy.failAtRatio * 100).toFixed(0)}%)`,
      );
    } catch {
      w(`  FAIL  ${relativePath}: not found`);
      exitCode = 1;
    }
  }

  let packResult;
  try {
    const raw = execSync("pnpm npm pack --dry-run --json", { cwd: ROOT, encoding: "utf-8" });
    const jsonStart = raw.indexOf("[");
    const jsonStr = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
    const parsed = JSON.parse(jsonStr);
    packResult = Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {
    w("  FAIL  npm pack --dry-run failed");
    process.exit(1);
  }

  const PACK_BUDGET = { budget: 6_000_000, failAtRatio: DEFAULT_FAIL_AT_RATIO };
  const UNPACK_BUDGET = { budget: 32_000_000, failAtRatio: DEFAULT_FAIL_AT_RATIO };

  const packSize = packResult.size;
  const unpackedSize = packResult.unpackedSize;

  w("");
  w("npm pack size budget check");
  w("==========================");

  for (const [label, actual, rawPolicy] of [
    ["packed size", packSize, PACK_BUDGET],
    ["unpacked size", unpackedSize, UNPACK_BUDGET],
  ]) {
    const policy = normalizeSizePolicy(rawPolicy, label);
    const ratio = actual / policy.budget;
    const pct = (ratio * 100).toFixed(1);
    const status = ratio <= policy.failAtRatio ? "PASS" : "FAIL";
    if (status === "FAIL") exitCode = 1;
    w(
      `  ${status}  ${label}: ${(actual / 1_000_000).toFixed(2)} MB / ${(policy.budget / 1_000_000).toFixed(2)} MB (${pct}%, fail-at ${(policy.failAtRatio * 100).toFixed(0)}%)`,
    );
  }

  w(`\nExit code: ${exitCode}`);
  process.exit(exitCode);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
