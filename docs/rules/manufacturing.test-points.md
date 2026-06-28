---
id: manufacturing.test-points
severity-default: low
applies-to:
  - pcb
config-keys:
  - rules.manufacturing.test-points.enabled
  - rules.manufacturing.test-points.minimum
---

# manufacturing.test-points

## What It Checks

Checks explicitly enabled assembly jobs for minimum test point footprint coverage.

## When It Fires

Fires when the parsed PCB has fewer test point references than the configured minimum.

## Configuration Example

```yaml
version: 1
rules:
  manufacturing.test-points:
    enabled: true
    severity: low
```

## JSON Finding Details Shape

```text
{ required, found }
```

## Report Context

Use this finding to decide whether the design package is ready for review, fabrication, or release. BoardReadyOps reports the condition and leaves design edits to the owning workflow.
