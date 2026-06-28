# ADR-0004 — KiCad 10 Variant Support

**Status:** Accepted
**Date:** 2026-05-18

## Context

KiCad 10 adds native design variants that can change DNP state and manufacturing BOM contents.

## Decision

BoardReadyOps parses variants from `.kicad_pro`, accepts variant-specific BOM configuration, applies the selected variant to variant-aware BoardReadyOps rules, and reports BOM inconsistencies with `bom.variant-consistency`. KiCad 10 DRC and ERC are not invoked with `--variant` because those report commands do not expose that option. BoardReadyOps passes the selected variant as `--define-var BOARDREADYOPS_VARIANT=<name>` for projects that use KiCad text variables, while variant-aware BoardReadyOps rules continue to use parsed `.kicad_pro` variant data.

## Consequences

- Variant checks stay local and read-only.
- KiCad 9 projects are outside the primary compatibility target.
- Variant-specific BOM paths are configured per project.

## Alternatives Considered

- Ignore variants until a later release; rejected because variant BOM review is part of KiCad 10 release preflight.
- Delegate variant resolution to vendor tools; rejected because v1 remains local-first.
