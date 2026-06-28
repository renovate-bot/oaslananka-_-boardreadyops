---
id: manufacturing.position-coverage
severity-default: medium
applies-to:
  - pcb
  - manifest
config-keys:
  - rules.manufacturing.position-coverage.enabled
  - rules.manufacturing.position-coverage.patterns
---

# manufacturing.position-coverage

## What It Checks

Checks explicitly enabled assembly jobs for populated reference coverage in position/CPL outputs.

## When It Fires

Fires when no position output exists or populated references are missing from position/CPL output text.

## Configuration Example

```yaml
version: 1
rules:
  manufacturing.position-coverage:
    enabled: true
    severity: medium
```

## JSON Finding Details Shape

```text
{ missingRefs, totalMissingRefs, positionFiles? }
```

## Report Context

Use this finding to decide whether the design package is ready for review, fabrication, or release. BoardReadyOps reports the condition and leaves design edits to the owning workflow.
