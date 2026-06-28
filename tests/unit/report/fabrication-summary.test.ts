import { describe, expect, it } from "vitest";
import { outputChangeSummary } from "../../../src/report/fabrication-summary.js";

describe("outputChangeSummary", () => {
  it("returns empty string when output status is not 'changed'", () => {
    const added = outputChangeSummary({ kind: "gerber", status: "added", changed: 0, added: 5, removed: 0 }, "en");
    expect(added).toBe("");

    const removed = outputChangeSummary({ kind: "drill", status: "removed", changed: 0, added: 0, removed: 3 }, "en");
    expect(removed).toBe("");

    const unchanged = outputChangeSummary({ kind: "bom", status: "unchanged", changed: 0, added: 0, removed: 0 }, "en");
    expect(unchanged).toBe("");
  });

  it("renders only changed count", () => {
    const result = outputChangeSummary({ kind: "drill", status: "changed", changed: 3, added: 0, removed: 0 }, "en");
    expect(result).toBe("3 changed");
  });

  it("renders changed and added", () => {
    const result = outputChangeSummary({ kind: "bom", status: "changed", changed: 1, added: 2, removed: 0 }, "en");
    expect(result).toBe("1 changed, 2 added");
  });

  it("renders added and removed without changed", () => {
    const result = outputChangeSummary({ kind: "gerber", status: "changed", changed: 0, added: 2, removed: 1 }, "en");
    expect(result).toBe("2 added, 1 removed");
  });
});
