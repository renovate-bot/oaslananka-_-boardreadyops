# Governance

This page summarizes the repository governance policy for contributors and
agents. The root
[GOVERNANCE.md](https://github.com/oaslananka/boardreadyops/blob/main/GOVERNANCE.md)
is the maintainer-facing policy file.

## Source Of Truth

- Linear team `BOARD` owns roadmap priority and task state.
- GitHub owns branches, pull requests, code review metadata, and CI evidence.
- ADRs under `docs/architecture/adr/` own architectural decisions.
- Release-please owns release pull request generation; code agents must not merge
  release-please pull requests unless the maintainer explicitly changes scope.

## Pull Request Requirements

Every pull request must:

- Address exactly one Linear issue.
- Use a branch named `codex/BOARD-<id>-<short-slug>` for Codex agent work.
- Fill in `.github/pull_request_template.md`.
- Link the Linear issue.
- List validation commands and results.
- Keep generated docs, bundles, notices, and schemas in sync with source changes.
- Pass required CI before merge.

## Review And Ownership

`CODEOWNERS` assigns the repository to `@oaslananka`. GitHub requests code owner
review only when repository settings require it, but CODEOWNERS still documents
ownership and helps GitHub identify responsible maintainers.

The project currently uses a solo-maintainer policy:

- CI is mandatory for every pull request.
- Human review is best-effort.
- Public contract changes need explicit validation in the PR body.
- Security, release, and supply-chain changes should receive maintainer review
  before merge even when automation is green.

## Branch Protection Baseline

`main` is protected through the committed ruleset at
`.github/rulesets/main.json`. The ruleset is the source of truth; it is deployed
by the maintainer through the GitHub settings UI or API and must be kept in sync
with the committed file.

The expected baseline covers:

- Require pull requests before merge.
- Require status checks before merge.
- Require branches to be up to date before merge (`strict_required_status_checks_policy: true`).
- Require review thread resolution (`required_review_thread_resolution: true`).
- Require linear history.
- Disallow force pushes.
- Disallow branch deletion.
- Use squash merge as the normal merge path.
- Delete topic branches after merge.

The committed ruleset requires these status checks:

| Context | Purpose |
| --- | --- |
| `ci / lint` | Code style and formatting |
| `ci / typecheck` | TypeScript type safety |
| `ci / build` | Bundle and artifact compilation |
| `ci / verify-dist` | Committed bundle integrity |
| `ci / security` | Dependency and supply-chain audit |
| `ci / test-action` | GitHub Action input/output contract |
| `ci / coverage-gate` | Coverage threshold enforcement |
| `lint-fast / lint-fast` | Fast lint pass on focused changes |
| `self-smoke / self-smoke` | Self-test against repository fixtures |

The following CI checks are executed on every push and pull request but are not
required status checks in the ruleset (they run on the `ci` workflow as matrix
jobs or on separate workflow triggers):

- `ci / test-unit (ubuntu-latest, Node 22)`
- `ci / test-unit (ubuntu-latest, Node 24)`
- `ci / test-unit (windows-2025-vs2026, Node 22)`
- `ci / test-unit (windows-2025-vs2026, Node 24)`
- `ci / test-unit (macos-latest, Node 22)`
- `ci / test-unit (macos-latest, Node 24)`
- `ci / test-int (KiCad 10.0, Node 24)`
- `ci / cross-platform-paths (ubuntu-latest)`
- `ci / cross-platform-paths (macos-latest)`
- `ci / cross-platform-paths (windows-2025-vs2026)`
- `ci / accessibility`
- `ci / mutation`

Security-only workflows that are monitored on `main` but excluded from PR
required checks:

- `CodeQL`
- `gitleaks`
- `zizmor`
- `security / dependency-review`
- `security / codeql`
- `security / osv`
- `security / gitleaks`
- `security / sbom`

`security / scorecard advisory` is intentionally advisory because it may be
skipped on pull requests. The push-only `docs`, `benchmark`, `OpenSSF Scorecard`,
and `release-please` workflows are monitored on `main` after merge, but they are
not pull request required checks.

### Bypass Actors

The ruleset allows one bypass actor:

| Actor | Type | Mode | Justification |
| --- | --- | --- | --- |
| `RepositoryRole` (actor_id 5 – Admin) | `RepositoryRole` | `always` | Repository administrators may bypass rules for emergency fixes, release operations, and dependency automation that require direct push to `main`. This is consistent with a single-maintainer governance model where the maintainer is the only admin. |

The bypass actor file reference lives in `.github/rulesets/main.json` under
`bypass_actors`. No other actors or teams have bypass privileges.

## Applying And Verifying Protection

The repository uses **repository rulesets** (not classic branch protection). The
committed ruleset at `.github/rulesets/main.json` is the intended configuration.
The legacy `scripts/setup-branch-protection.sh` script is preserved for reference
but applies classic branch protection, which is superseded by the ruleset.

Verify the live ruleset with:

```bash
gh api repos/oaslananka/boardreadyops/rulesets --jq '.[] | select(.name == "main")'
```

If the ruleset is not applied or differs from the committed file, apply it
through the GitHub settings UI or:

```bash
gh api --method POST repos/oaslananka/boardreadyops/rulesets --input .github/rulesets/main.json
```

## External Settings

The repository code cannot fully represent these GitHub settings:

- Branch protection and rulesets.
- Required status-check selection.
- Repository merge method toggles.
- GitHub Pages deployment settings.
- Package and release permissions.

Changes to those settings should be recorded in Linear and, when relevant,
mirrored in docs or scripts so contributors can verify expected behavior.
