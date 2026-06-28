# Golden demo

A tiny, self-contained corpus that shows BoardReadyOps catching realistic release problems and then confirming they are resolved. It is part of the [BoardReadyOps v2 roadmap](https://github.com/oaslananka/boardreadyops/issues/192).

Two copies of the same small board live here:

- [`broken/`](broken) — a board with four release blockers.
- [`fixed/`](fixed) — the same board with every blocker resolved.

## Run it

```bash
boardreadyops run examples/golden-demo/broken   # exits 1: four blocking findings
boardreadyops run examples/golden-demo/fixed    # exits 0: clean
```

Both projects keep DRC/ERC disabled so the demo runs without `kicad-cli`.

## Expected findings

The `broken/` board reports exactly these findings (see [`expected-findings.json`](expected-findings.json), which the test suite asserts against):

| Rule | Severity | What is wrong in `broken/` | How `fixed/` resolves it |
| --- | --- | --- | --- |
| `design.board-outline` | high | The `Edge.Cuts` outline is two open segments. | A closed `gr_rect` board outline. |
| `design.unique-references` | high | `R1` is placed twice on the PCB. | The second part is re-annotated to `R2`. |
| `bom.missing-mpn` | high | `R1` has no manufacturer part number in `demo-bom.csv`. | `R1` gets a real MPN. |
| `bom.compliance` | high | `R2` is marked `Non-Compliant` in the RoHS column. | `R2` uses a RoHS-compliant part. |

The `fixed/` board reports no findings.

## For contributors

- Keep the two boards identical except for the issue being demonstrated, so each finding maps to one clear cause and one clear fix.
- When you add a showcased rule, enable it in both `boardreadyops.yml` files and update [`expected-findings.json`](expected-findings.json) — `tests/unit/examples/golden-demo.test.ts` runs the pipeline against both boards and fails if reality drifts from the documented expectations.
- Prefer parse-based rules (no `kicad-cli`) so the demo stays runnable in CI and on contributor machines.
