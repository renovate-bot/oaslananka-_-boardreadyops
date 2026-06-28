# Waivers and Approvals

Waivers formalize accepted release findings: each waiver records who approved it, why, and (optionally) when it expires. Unlike ad-hoc [suppressions](../configuration.md), a waiver always carries an owner and a reason, and an expired waiver is surfaced rather than silently honored.

## Configuration

Add a `waivers` list to `boardreadyops.yml`. `rule`, `owner`, and `reason` are required and validated by the configuration schema. Add `approvedBy` and `evidence` when the waiver represents a release risk decision rather than a short-lived local exception.

```yaml
version: 1
waivers:
  - rule: bom.missing-mpn
    owner: alice@example.com
    reason: Sole-source part approved by procurement for this build.
    expires: 2026-12-31 # optional YYYY-MM-DD
  - rule: design.clearance
    project: boards/main
    fingerprint: 0f1e2d... # optional, scope to one finding
    owner: bob@example.com
    reason: Documented exception, waiting on layout revision.
```

A waiver matches a finding by `rule`, optionally narrowed by `fingerprint` and `project`.

## Active and expired waivers

- **Active** waivers (no expiry, or an expiry on/after the run date) mark their matching findings as suppressed, so they do not block the release or lower the readiness score.
- **Expired** waivers (expiry before the run date) do **not** suppress anything — the finding resurfaces — and the waiver is reported as expired so it can be renewed or removed.
- **Stale** waivers are active, fingerprint-scoped waivers that no longer match any finding. They stay visible in reports so teams can remove obsolete risk acceptances after the board or rule changed.

Both lists, with each waiver's owner, reason, expiry, and matched-finding count, are attached to the run result under `waivers` and shown in the [HTML release dashboard](../reports/html.md).

## Policy integration

Use waiver policy rules to block releases when governance evidence is no longer valid:

```yaml
policy:
  enforce: true
  rules:
    - id: no-expired-waivers
      type: forbid-expired-waivers
    - id: no-stale-waivers
      type: forbid-stale-waivers
```
