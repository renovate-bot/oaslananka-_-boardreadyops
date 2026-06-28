# BoardReadyOps

BoardReadyOps is a release-readiness gate for KiCad hardware repositories. It answers one practical question before a tag, pull request, or manufacturing handoff: **is this board ready to fabricate, and what evidence supports that decision?**

It runs design checks, BOM risk checks, pinmap validation, manufacturing preflight, vendor-profile checks, release evidence validation, and CI gates. It is intentionally not a general-purpose KiCad artifact generator. Pair it with KiBot, `kicad-cli`, or an existing fabrication pipeline to produce Gerbers, drill files, BOMs, CPL/position files, drawings, and PDFs; then let BoardReadyOps validate the release evidence, vendor expectations, suppressions, and gate outcome.

## Start here

- New to the project? Follow the [Quickstart](quickstart.md) and [Installation](install.md) guides.
- Adding BoardReadyOps to CI? Use the [GitHub Action](action.md) or the [CLI](cli.md).
- Deciding what should block a release? Review [Configuration](configuration.md), [Rules](rules/index.md), [Reports](reports/json.md), and [Agent Planning Output](agent-planning.md).
- Preparing a manufacturer handoff? Read [Vendor Profiles](vendor-profiles.md), [Release Evidence](release/evidence-bundles.md), and [Hardware SBOM](sbom.md).

## Core workflows

### 1. Validate a board before release

Run BoardReadyOps against a KiCad workspace to collect findings across schematic, PCB, BOM, pinmap, manufacturing outputs, and release metadata. The result is a normalized pass/fail decision with actionable findings.

### 2. Verify manufacturing evidence

Use generated Gerbers, drill files, BOMs, CPL/position files, reports, and manifests as release evidence. BoardReadyOps checks whether expected outputs exist, are fresh, and satisfy configured vendor requirements.

### 3. Gate pull requests and tags

The GitHub Action can annotate pull requests, upload SARIF, publish reports, and enforce severity thresholds. Teams can tune what fails a build while keeping suppressions and waivers auditable.

### 4. Keep hardware and firmware aligned

Pinmap and firmware-facing checks help catch board/software mismatches before a release. This is especially useful when schematic net names, BOM variants, and firmware constants change independently.

## Where to go next

| Goal | Page |
| --- | --- |
| Install and run locally | [Installation](install.md) |
| Add CI enforcement | [GitHub Action](action.md) |
| Give agents deterministic remediation steps | [Agent Planning Output](agent-planning.md) |
| Understand rule coverage | [Rules](rules/index.md) |
| Configure vendor expectations | [Vendor Profiles](vendor-profiles.md) |
| Generate auditable release packages | [Release Evidence](release/evidence-bundles.md) |
| Compare with KiBot | [KiBot Integration](integrations/kibot.md) |
| Extend with custom rules | [Plugin SDK](plugin-sdk.md) |

## Release-readiness, not just checks

A good hardware release is not only a clean DRC/ERC run. It also needs complete fabrication outputs, BOM evidence, variant consistency, documented suppressions, repeatable CI, and a clear decision record. BoardReadyOps treats those items as evidence for a manufacturing decision instead of loose files in a build directory.
