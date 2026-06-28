import { describe, expect, it } from "vitest";

import { normalizeSizePolicy } from "../../../scripts/check-bundle-sizes.mjs";

describe("check-bundle-sizes", () => {
  it("normalizes legacy numeric budgets", () => {
    expect(normalizeSizePolicy(1234, "legacy")).toEqual({ budget: 1234, failAtRatio: 0.9 });
  });

  it("defaults missing failAtRatio for object policies", () => {
    expect(normalizeSizePolicy({ budget: 2048 }, "object")).toEqual({ budget: 2048, failAtRatio: 0.9 });
  });

  it("preserves explicit failure ratios", () => {
    expect(normalizeSizePolicy({ budget: 4096, failAtRatio: 0.75 }, "strict")).toEqual({
      budget: 4096,
      failAtRatio: 0.75,
    });
  });

  it("rejects policies without a positive numeric budget", () => {
    expect(() => normalizeSizePolicy({}, "bad policy")).toThrow("bad policy must define a positive numeric budget");
    expect(() => normalizeSizePolicy(0, "zero policy")).toThrow("zero policy must define a positive numeric budget");
  });
});
