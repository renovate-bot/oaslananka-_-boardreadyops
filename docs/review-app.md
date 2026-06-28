# Review app (prototype)

The review app is an app-style pull request review experience for release checks. Instead of the full Markdown report, BoardReadyOps posts a compact, sticky review comment: a single release decision, a severity breakdown, the top findings grouped by severity, and links to the full reports. It is part of the [BoardReadyOps v2 roadmap](https://github.com/oaslananka/boardreadyops/issues/192).

## Comment format

The review comment is designed to be scannable in a code review:

- **Decision line** — `✅ PASS` or `❌ FAIL` with the finding count, max severity, and (when available) the readiness score and policy result.
- **Severity table** — counts for critical / high / medium / low.
- **Top findings** — grouped by severity (highest first), each with the rule id, message, and source location. Each group is capped and notes how many more it omits.
- **Reports** — a link to the workflow run where the JSON/SARIF/Markdown/HBOM reports are uploaded as an artifact.

```markdown
## BoardReadyOps release review

**Decision: ❌ FAIL** — 4 finding(s), max severity high

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 4 |
| Medium | 0 |
| Low | 0 |

### Top findings

**High** (4)
- `design.board-outline` — PCB Edge.Cuts outline is open or missing. (`demo.kicad_pcb`)
- `bom.missing-mpn` — R1 is missing an MPN. (`demo-bom.csv:2`)
- …and 2 more.

### Reports
- [Reports (artifact: boardreadyops)](https://github.com/owner/repo/actions/runs/123)
```

The comment shares the sticky marker with the full report, so a repository posts exactly one BoardReadyOps comment per pull request.

## Installation

Add the BoardReadyOps Action to a pull request workflow and set `comment-format: review`:

```yaml
# .github/workflows/boardreadyops.yml
on:
  pull_request:
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
      - uses: oaslananka/boardreadyops@4efcd6d73e2e0de15a39c745b1a67e6c7a4f9ce0 # current action contract
        with:
          comment-format: review
```

The job needs `pull-requests: write` so the Action can post and update the review comment. Leave `comment-format` unset (or `report`) to keep the full Markdown report comment.

## See also

- [GitHub Action inputs](action.md) for the complete input reference.
- [Golden demo](golden-demo.md) for a board that produces the sample findings above.
- [Roadmap #192](https://github.com/oaslananka/boardreadyops/issues/192) for where the review app fits in the v2 plan.
