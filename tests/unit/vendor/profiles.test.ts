import { describe, expect, it } from "vitest";
import { validateConfig } from "../../../src/core/config.js";
import { findVendorProfile, listVendorProfiles, resolveVendorProfile } from "../../../src/vendor/profiles.js";

describe("vendor profiles", () => {
  it("lists built-in manufacturer profiles", () => {
    expect(listVendorProfiles().map((profile) => profile.id)).toEqual([
      "jlcpcb",
      "pcbway",
      "oshpark",
      "aisler",
      "seeed-fusion",
      "eurocircuits",
    ]);
    expect(findVendorProfile("JLCPCB")?.id).toBe("jlcpcb");
  });

  it("resolves required evidence by service and user overrides", () => {
    expect(resolveVendorProfile({ profile: "oshpark" })?.requiredOutputs).toEqual(["drill", "gerber"]);
    expect(
      resolveVendorProfile({ profile: "jlcpcb", service: "assembly", required: ["step"] })?.requiredOutputs,
    ).toEqual(["bom", "position", "step"]);
  });

  it("separates recommended evidence and lets a user-required output override it", () => {
    expect(resolveVendorProfile({ profile: "jlcpcb" })?.recommendedOutputs).toEqual(["pdf", "step"]);
    expect(resolveVendorProfile({ profile: "aisler" })?.requiredOutputs).toEqual([
      "bom",
      "drill",
      "gerber",
      "position",
    ]);
    expect(findVendorProfile("seeed fusion")?.id).toBe("seeed-fusion");
    expect(findVendorProfile("eurocircuits")?.fabrication).toMatchObject({ maxLayers: 8, minDrillMm: 0.3 });
    expect(resolveVendorProfile({ profile: "oshpark" })?.recommendedOutputs).toEqual(["pdf"]);
    // step is recommended by default but becomes required when the user requires it
    const resolved = resolveVendorProfile({ profile: "jlcpcb", required: ["step"] });
    expect(resolved?.requiredOutputs).toContain("step");
    expect(resolved?.recommendedOutputs).not.toContain("step");
  });

  it("validates root and project-level vendor configuration", () => {
    expect(
      validateConfig({
        version: 1,
        vendor: { profile: "jlcpcb", service: "fabrication+assembly", required: ["step"] },
        projects: [{ path: "boards/main", vendor: { profile: "oshpark", board: { layers: [2, 4] } } }],
      }),
    ).toEqual([]);

    expect(validateConfig({ version: 1, vendor: { profile: "jlcpcb", service: "invalid" } }).join("\n")).toContain(
      "must be equal to one of the allowed values",
    );
  });
});
