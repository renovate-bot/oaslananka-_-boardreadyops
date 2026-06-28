# Security Policy

## Reporting a Vulnerability

Report vulnerabilities via **GitHub Security Advisories** (preferred, P1):

<https://github.com/oaslananka/boardreadyops/security/advisories/new>

For **low-severity** issues (informational findings, code hygiene, documentation),
open a public issue with the `security` label.

Encrypted disclosure is not required; if you prefer end-to-end encryption, file
a private advisory and request a GPG key in the body. A maintainer will respond
within 72 hours with a public key for encrypted follow-up.

### Response SLA

| Severity | Initial response | Remediation target |
| -------- | ---------------- | ------------------ |
| Critical | 24 hours         | 7 days             |
| High     | 48 hours         | 14 days            |
| Medium   | 72 hours         | 30 days            |
| Low      | 7 days           | Next release       |

If a fix cannot be delivered within the target window, a timeline update and
mitigation guidance will be posted on the advisory.

## Scope

BoardReadyOps is read-only against KiCad design files. It does not require
vendor credentials and does not call external supplier APIs in v1.

Never commit credentials, private keys, cookies, or token-bearing environment
files. The CI configuration includes secret scanning (`gitleaks`), dependency
audit gates (`pnpm audit`, `pip-audit`), CodeQL, and supply-chain verification
(SBOM, SLSA provenance, `dependency-review-action`).

## Threat Model

See [docs/security/threat-model.md](docs/security/threat-model.md) for the
detailed threat model covering KiCad CLI injection, plugin supply-chain risk,
notifier webhook CSRF, temp directory race conditions, and data exfiltration
through report output paths.

## Plugin Trust Model

BoardReadyOps supports a plugin mechanism via the Plugin SDK
(`packages/plugin-sdk`). Plugins execute in-process with access to the full
project schema and pipeline context. Treat plugins as equivalent to production
code: audit all third-party plugins before loading them, and pin plugin
versions in `boardreadyops.yml`.

## KiCad CLI Execution

BoardReadyOps invokes `kicad-cli` without a shell, bounds stdout and stderr
collection, redacts control characters from subprocess output, and removes
temporary report directories after DRC/ERC execution.

KiCad 10 variant names are passed as arguments, not interpolated into shell
commands. Jobset support reads `.kicad_jobs` files and reports missing outputs;
it does not modify KiCad project files.

## Release Provenance and Signing

`boardreadyops release pack` produces a structured evidence bundle whose
`manifest.json` records the SHA-256 digest and size of every report, artifact,
and generated output. `boardreadyops release sign --key <ed25519-private-key>`
signs that manifest and writes a `manifest.sig` sidecar; `boardreadyops release
verify --public-key <ed25519-public-key>` re-checks every digest and verifies
the manifest signature against the pinned public key.

Trust is chained: a verified manifest signature transitively attests every file
the manifest lists, because each artifact is bound to the manifest by its
digest. Signing keys are Ed25519, handled only through `node:crypto` with no
third-party dependency. The private key is never read from or written into the
bundle — store it as a CI secret or in a key-management service and distribute
only the public key and `manifest.sig`. See
[docs/release/evidence-bundles.md](docs/release/evidence-bundles.md#signing-and-provenance)
for the full trust model and a CI signing workflow.
