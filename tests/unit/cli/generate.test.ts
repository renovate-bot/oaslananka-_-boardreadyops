import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { generateCommand } from "../../../src/cli/commands/generate.js";

const fixtureRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/projects/generate-basic",
);

// A path with a separator that does not exist forces detectKicadCli to report "not found".
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

describe("generate CLI command", () => {
  it("returns 2 when no KiCad project is found", async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), "brops-empty-"));
    tempDirs.push(empty);
    const io = streams();
    expect(await generateCommand(empty, {}, io.streams)).toBe(2);
    expect(io.output().stderr).toContain("No KiCad project found");
  });

  it("returns 2 when the recipe file is missing", async () => {
    const io = streams();
    expect(await generateCommand(fixtureRoot, { recipe: "does-not-exist.json" }, io.streams)).toBe(2);
    expect(io.output().stderr).toContain("Generation recipe not found");
  });

  it("returns 2 when the recipe fails schema validation", async () => {
    const io = streams();
    expect(await generateCommand(fixtureRoot, { recipe: "recipe-invalid.json" }, io.streams)).toBe(2);
    expect(io.output().stderr).toContain("Invalid generation recipe");
  });

  it("returns 3 when kicad-cli is unavailable", async () => {
    const io = streams();
    expect(await generateCommand(fixtureRoot, { kicadCli: missingKicadCli }, io.streams)).toBe(3);
    expect(io.output().stderr).toContain("kicad-cli");
  });
});
