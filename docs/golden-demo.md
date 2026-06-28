# Golden demo

The golden demo is a tiny, self-contained corpus that shows BoardReadyOps catching realistic release problems on a broken board and then confirming a fixed board is clean. It ships in the repository under [`examples/golden-demo`](https://github.com/oaslananka/boardreadyops/tree/main/examples/golden-demo) and is part of the [BoardReadyOps v2 roadmap](https://github.com/oaslananka/boardreadyops/issues/192).

## Run it in two commands

```bash
boardreadyops run examples/golden-demo/broken
boardreadyops run examples/golden-demo/fixed
```

The `broken` board exits `1` with four blocking findings; the `fixed` board exits `0`. Both projects keep DRC and ERC disabled, so the demo runs without `kicad-cli`.

## What the broken board reports

| Rule | Severity | Problem |
| --- | --- | --- |
| `design.board-outline` | high | The `Edge.Cuts` outline is open. |
| `design.unique-references` | high | A reference designator (`R1`) is used twice. |
| `bom.missing-mpn` | high | A populated BOM row has no manufacturer part number. |
| `bom.compliance` | high | A populated part is marked `Non-Compliant`. |

The `fixed` board resolves all four and reports nothing. Each problem maps to one clear cause and one clear fix, documented in the [demo README](https://github.com/oaslananka/boardreadyops/tree/main/examples/golden-demo#expected-findings).

## How it stays correct

`tests/unit/examples/golden-demo.test.ts` runs the pipeline against both boards and asserts the findings exactly match `examples/golden-demo/expected-findings.json`. The expected-findings file is the single source of truth shared by the documentation and the test, so the demo cannot silently drift from what the docs promise.

## See also

- [Quickstart](quickstart.md) for running BoardReadyOps on your own project.
- [Rules](rules/index.md) for the full rule catalog behind the demo findings.
- [Roadmap #192](https://github.com/oaslananka/boardreadyops/issues/192) for where the demo fits in the v2 plan.
