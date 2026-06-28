# Agent Planning Output

`boardreadyops plan [path]` emits a machine-readable remediation plan for coding agents,
EDA agents, review bots, and release automation. It runs the same validation pipeline as
`check`, but reshapes findings into deterministic actions with evidence, fix strategy,
verification commands, and release follow-up steps.

Use this command when another tool needs to decide what to change next without scraping
human-oriented Markdown, HTML, or terminal output.

```bash
boardreadyops plan .
boardreadyops plan . --config boardreadyops.yml
boardreadyops plan . --fail-on medium > build/agent-plan.json
```

The command currently supports JSON output only. Human logs are written to stderr, so stdout
stays parseable even when the command exits nonzero.

## Exit codes

`plan` mirrors the release gate decision:

| Exit code | Meaning |
| --- | --- |
| `0` | No findings at or above the selected failure threshold. |
| `1` | The plan contains blocking findings or an invalid configuration diagnostic. |
| `2` | Command-line usage failed before a plan could be produced. |

A configuration error is represented as a `config.invalid` action so agents can repair the
configuration before attempting board or BOM edits.

## JSON contract

The top-level object is intentionally small and stable. Consumers can retrieve the schema with `boardreadyops schema agent-plan`; the bundled schema lives at `schemas/agent-plan.schema.json`.

```json
{
  "schemaVersion": 1,
  "tool": { "name": "boardreadyops", "version": "1.5.2" },
  "generatedAt": "2026-06-24T00:00:00.000Z",
  "status": "failed",
  "exitCode": 1,
  "summary": { "total": 1, "failed": true },
  "projectRoot": "/workspace/hardware",
  "nextActions": [],
  "releaseActions": []
}
```

`nextActions` contains one action for each finding. `releaseActions` contains the next
release-evidence step only when no blocking findings remain.

## Action fields

Each action includes the minimum information an agent needs to make a safe change:

| Field | Purpose |
| --- | --- |
| `id` | Stable finding fingerprint used for deduplication and review comments. |
| `ruleId` | BoardReadyOps rule that produced the action. |
| `severity` | Finding severity. |
| `title` | Human-readable finding title. |
| `resource` | File or manifest path and resource kind. |
| `location` | Optional line/column range when a parser can locate the issue. |
| `evidence` | Finding message, details, references, and confidence. |
| `whyItMatters` | Release-risk explanation for prioritization. |
| `fixStrategy` | Reviewable fix description and ordered steps. |
| `safeAutoFixPossible` | `true` only when the rule marks the fix as safe to automate. |
| `commandsToVerify` | Commands an agent should run after changing files. |

Agents should treat `safeAutoFixPossible: false` as a requirement for conservative,
reviewable edits. It does not mean the issue is unfixable; it means the change can affect
manufacturing intent and should be reviewed.

## Recommended agent loop

1. Run `boardreadyops plan . --format json`.
2. Sort `nextActions` by severity and release risk.
3. For each action, inspect only the referenced resource and supporting evidence.
4. Apply the smallest fix that satisfies the rule without weakening gates or waivers.
5. Run every command in `commandsToVerify` for the changed action.
6. Re-run `boardreadyops plan . --format json` until `nextActions` is empty.
7. Execute `releaseActions` to create and verify the evidence bundle.

## Guardrails

Agents should not automatically relax `fail-on`, disable rules, add suppressions, or create
waivers unless the user explicitly requested that governance change. Waivers are release-risk
records, not generic fixes. Prefer fixing KiCad, BOM, pinmap, manufacturing-output, or release
metadata evidence first.

When an action references generated output, regenerate the output from KiCad or the existing
artifact pipeline instead of editing generated Gerber, drill, PDF, or CPL files by hand.

## MCP server design contract

A future BoardReadyOps MCP server should expose the same plan contract without granting
write access by default. The server design is intentionally conservative:

- **Read-only by default:** tools may discover projects, run checks, return plans, and
  explain findings without modifying source files.
- **Path allowlist:** every tool call must resolve requested paths under configured project
  roots; symlinks and `..` traversal must be rejected before running KiCad or Node commands.
- **Explicit write capability:** auto-fix or evidence generation tools must require an
  explicit `allowWrites` capability and should return a dry-run diff by default.
- **Command allowlist:** only BoardReadyOps and KiCad commands needed for validation may run;
  arbitrary shell execution is out of scope.
- **Stable tools:** the initial tool set should be `discover_projects`, `run_check`,
  `create_plan`, `explain_finding`, `validate_bom`, and `generate_release_evidence`.
- **Schema-first responses:** every tool response should include a schema version and should
  reuse `schemas/agent-plan.schema.json` for remediation plans.
- **Auditability:** every mutating operation must include the rule ID, evidence hash,
  changed files, and the verification commands that were run after the change.
