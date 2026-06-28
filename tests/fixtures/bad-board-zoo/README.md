# Bad-Board Zoo

A labeled corpus of intentionally broken KiCad hardware release fixtures. Each entry demonstrates a specific class of manufacturing, assembly, BOM, or release defect that BoardReadyOps detects.

The corpus is used for regression testing, demos, and documentation. Every fixture has an `expected-findings.json` that is snapshot-tested in CI.

---

## Corpus

| Fixture | Defect Class | Triggered Rules | Severity |
|---|---|---|---|
| [dfm-no-fiducials](../projects/dfm-no-fiducials/) | No fiducial marks for assembly alignment | `manufacturing.fiducials` | medium |
| [dfm-cpl-mismatch](../projects/dfm-cpl-mismatch/) | CPL/position file missing populated components | `manufacturing.position-coverage` | medium |
| [manufacturing-drill-missing](../projects/manufacturing-drill-missing/) | Drill file present but does not cover all drill sizes | `manufacturing.drill-coverage` | medium |
| [manufacturing-stale-outputs](../projects/manufacturing-stale-outputs/) | Manufacturing outputs are older than the PCB file | `manufacturing.outputs-present` | high |
| [manufacturing-missing-outputs](../projects/manufacturing-missing-outputs/) | Required manufacturing files are absent | `manufacturing.outputs-present` | high |
| [missing-drill](../projects/missing-drill/) | Drill output file is missing entirely | `manufacturing.outputs-present` | high |
| [missing-gerber](../projects/missing-gerber/) | Gerber output files are missing | `manufacturing.outputs-present` | high |
| [missing-position](../projects/missing-position/) | CPL/position output is missing | `manufacturing.outputs-present` | high |
| [bom-missing-mpn](../projects/bom-missing-mpn/) | Populated BOM row has no manufacturer part number | `bom.missing-mpn` | high |
| [bom-variant-inconsistency](../projects/bom-variant-inconsistency/) | BOM references are inconsistent across variants | `bom.variant-consistency` | medium |
| [bom-footprint-mismatch](../projects/bom-footprint-mismatch/) | BOM footprint does not match PCB footprint | `bom.footprint-mismatch` | medium |
| [firmware-contract-platformio](../projects/firmware-contract-platformio/) | Firmware PlatformIO pin assignment does not match hardware pinmap | `firmware.platformio-pin-contract` | high |
| [pinmap-mismatch](../projects/pinmap-mismatch/) | Pinmap signal names do not match schematic nets | `pinmap.verify` | high |
| [release-bad-version-format](../projects/release-bad-version-format/) | Version string does not match semantic versioning | `release.version-format` | medium |
| [release-tag-mismatch](../projects/release-tag-mismatch/) | Git tag does not match PCB revision | `release.tag-matches-revision` | high |
| [open-edge-cuts](../projects/open-edge-cuts/) | Board outline (Edge.Cuts) is not closed | `design.board-outline` | high |

---

## How Fixtures Are Tested

Each fixture is run by the golden-matrix integration test in `tests/integration/`. The test:

1. Loads `expected-findings.json` from the fixture directory
2. Runs the BoardReadyOps pipeline against the fixture with the listed `runRules`
3. Asserts that the triggered rule IDs and severities match `expectedRules` and `expectedSeverities`
4. Asserts that `expectPass` matches the overall pipeline result

This ensures that defects remain detectable across releases.

---

## Adding a New Zoo Entry

1. Create a directory under `tests/fixtures/projects/<defect-name>/`
2. Add minimal KiCad files (PCB, schematic, project) that demonstrate the defect
3. Add a `boardreadyops.yml` that enables the relevant rule(s)
4. Add an `expected-findings.json` with `defect`, `expectedRules`, `expectedSeverities`, and `expectPass`
5. Add the entry to the corpus table above
6. Run `pnpm test` to confirm the fixture is picked up and passing

Keep fixtures minimal: the smallest project that reliably demonstrates the defect.
