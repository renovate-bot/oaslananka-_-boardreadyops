# RFC: BoardReadyOps GitHub App Architecture

**Status:** Proposed
**Issue:** [#303](https://github.com/oaslananka/boardreadyops/issues/303)
**Related:** [ADR-0008 — Vercel control plane](adr/0008-vercel-control-plane.md)

---

## Summary

This RFC describes the architecture for a native BoardReadyOps GitHub App that runs release checks on every pull request without requiring users to add a GitHub Actions workflow. The App handles the full lifecycle: webhook → check run → analysis → PR comment → evidence link.

---

## GitHub App vs. GitHub Action

| Concern | GitHub Action (existing) | GitHub App (new) |
|---|---|---|
| Installation | User adds `.github/workflows/boardreadyops.yml` | User installs App from GitHub Marketplace |
| KiCad runner | User provides runner (or uses container action) | App triggers a workflow dispatch on the user's repo or uses a managed runner |
| Result display | Workflow annotations + PR comment | Native GitHub Check Run UI + PR comment |
| Evidence link | Workflow artifact URL | Hosted dashboard link |
| Auth | `GITHUB_TOKEN` from the workflow | GitHub App installation token |

The App complements the Action; it does not replace it. Teams that want full control keep using the Action. Teams that want zero-config use the App.

---

## Required GitHub Permissions

The GitHub App requests these permissions:

| Permission | Level | Reason |
|---|---|---|
| `checks` | Write | Create and update check runs |
| `contents` | Read | Clone the repository to run checks |
| `pull_requests` | Write | Post PR review comments with finding summaries |
| `actions` | Write (optional) | Trigger workflow dispatch for KiCad generation jobs |
| `statuses` | Write | Update commit statuses (fallback if checks API unavailable) |
| `metadata` | Read | Required by GitHub for all Apps |

No user data beyond repository contents is read.

---

## Webhook Events

The App subscribes to:

| Event | Action(s) | Handler |
|---|---|---|
| `check_suite` | `requested`, `rerequested` | Create a check run and enqueue a job |
| `check_run` | `rerequested` | Re-run the specific check |
| `pull_request` | `opened`, `synchronize`, `reopened` | Trigger a new check suite |
| `installation` | `created`, `deleted` | Create or delete installation record |
| `installation_repositories` | `added`, `removed` | Update repo subscription list |

---

## Check Run Lifecycle

```
PR opened / commit pushed
        │
        ▼
  check_suite.requested webhook
        │
        ▼
  Handler creates check run (status: queued)
        │
        ▼
  Job dispatched to execution plane
  (GitHub Actions workflow_dispatch or managed runner)
        │
        ▼
  Runner clones repo, runs boardreadyops
        │
        ▼
  Runner POSTs result to API: /api/v1/runs/{id}/result
        │
        ▼
  API updates check run (status: completed)
  outcome: success / failure / neutral
        │
        ▼
  API posts PR review comment with finding summary
  and link to hosted dashboard
```

---

## PR Comment Strategy

A single top-level PR comment is created (or updated) per check cycle. The comment includes:

1. **Decision badge** — ALLOWED / BLOCKED (with color-coded icon)
2. **Finding summary** — counts per severity, top 5 blocking findings inline
3. **Evidence link** — link to the hosted dashboard for this run
4. **Handoff status** — whether a handoff package was created

The comment is updated (not duplicated) on subsequent pushes to the same PR. A comment is not posted for passing runs with no findings (configurable).

---

## Webhook Verification and Security

- All incoming webhook payloads are verified with `HMAC-SHA256` using the App webhook secret before any processing begins.
- The webhook handler returns `200 OK` immediately and processes the job asynchronously to avoid GitHub's 10-second timeout.
- Installation-scoped access tokens (not user OAuth) are used. Tokens expire in 1 hour and are not stored.
- Private repository contents are never stored beyond the run duration. Only structured metadata (findings, decision, manifest summary) is persisted in the database.
- Artifact binary content is stored only when the user explicitly enables evidence bundle storage; it is scoped to the installation and protected by signed URLs.

---

## MVP Flow (Step by Step)

1. User installs BoardReadyOps App on their GitHub organization.
2. User opens a PR on a repository with a KiCad project.
3. GitHub sends `pull_request.opened` → App receives webhook → verifies HMAC → creates check run (`queued`).
4. App sends `workflow_dispatch` to a pre-configured BoardReadyOps runner workflow, passing the commit SHA and run ID.
5. Runner workflow: checks out the repo, runs `boardreadyops check .`, POSTs JSON result to `POST /api/v1/runs/{id}/result` with an installation token.
6. API updates check run to `completed` with `success` or `failure` outcome and a summary of blocking findings.
7. API posts PR review comment with decision badge and top findings.
8. Check run links to the dashboard page for this run.

---

## Failure and Retry Behavior

- GitHub retries failed webhook deliveries with exponential back-off for 72 hours.
- The webhook handler is idempotent: re-processing the same `check_suite.requested` event creates a new run if no run exists for that SHA, otherwise it is a no-op.
- If the execution plane fails (runner timeout, KiCad crash), the handler updates the check run to `failure` with an actionable error message after a configurable timeout (default: 10 minutes).
- Manual re-run via the GitHub UI triggers `check_run.rerequested` which starts a fresh run.

---

## Dashboard and Evidence Links

Each check run links to:

- `https://boardreadyops.dev/r/{owner}/{repo}/{run-id}` — run dashboard page
- `https://boardreadyops.dev/r/{owner}/{repo}/{run-id}/evidence` — evidence bundle download (signed URL, short TTL)

These URLs are embedded in the check run `details_url` and in the PR comment.
