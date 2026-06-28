import { describe, expect, it } from "vitest";
import { vendorExplainCommand, vendorListCommand } from "../../../src/cli/commands/vendor.js";

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

describe("vendor CLI commands", () => {
  it("lists and explains built-in profiles", () => {
    const list = streams();
    expect(vendorListCommand({}, list.streams)).toBe(0);
    expect(list.output().stdout).toContain("jlcpcb");
    expect(list.output().stdout).toContain("oshpark");
    expect(list.output().stdout).toContain("seeed-fusion");

    const explain = streams();
    expect(vendorExplainCommand("pcbway", {}, explain.streams)).toBe(0);
    expect(explain.output().stdout).toContain("Required outputs:");
    expect(explain.output().stdout).toContain("gerber");
    expect(explain.output().stdout).toContain("Fabrication limits:");
    expect(explain.output().stdout).toContain("minTrackMm");
  });

  it("returns code 2 for unknown profiles", () => {
    const result = streams();
    expect(vendorExplainCommand("missing", {}, result.streams)).toBe(2);
    expect(result.output().stderr).toContain("Unknown vendor profile");
  });
});
