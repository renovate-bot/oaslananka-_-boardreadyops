# CI policy

BoardReadyOps uses risk-based CI so pull requests get the checks that match the files they changed without weakening the release gate.

The `ci` workflow always starts with `ci / risk-profile`. That job lists changed files and emits boolean outputs for downstream jobs. Required jobs are not disabled with workflow-level path filters because GitHub can leave required checks pending when an entire workflow is skipped by branch or path filtering.

## Required merge gate

The branch protection helper only requires the stable, high-signal checks that should exist on every pull request:

- `ci / risk-profile`
- `ci / lint`
- `ci / typecheck`
- `ci / test-unit`
- `ci / build`
- `ci / verify-dist`
- `ci / security`

Conditional jobs may be skipped when they are not relevant. GitHub treats skipped required jobs as acceptable branch-protection states, while workflow-level path skips can leave checks pending.

## Pull request routing

| Change type | CI behavior |
| --- | --- |
| Documentation only | Lint and docs build run; unit, coverage, mutation, package and security gates are skipped. |
| Runtime or CLI code | Lint, typecheck, unit tests, build, dist verification and security gates run. |
| KiCad parser/model or rule code | Coverage and mutation gates also run. |
| Dependency, workflow or path-sensitive changes | The full OS/Node unit matrix and cross-platform path checks run. |
| Action or bundled distribution changes | Action smoke and dist checks run. |
| Report/docs UI changes | Docs build and accessibility checks run. |

## Heavy checks

Full mutation testing is no longer the default for every pull request. It runs when parser, rule, or core mutation-sensitive code changes, on main pushes, and in the `mutation-nightly` workflow. This keeps feedback fast for low-risk pull requests while keeping a regular full mutation signal.

## Updating the policy

When adding a new source area, update `scripts/ci-risk-profile.mjs` and add a unit test in `tests/unit/scripts/ci-risk-profile.test.ts`. If the new area should block merges, also update `scripts/setup-branch-protection.sh`.
