---
id: manufacturing.fiducials
severity-default: medium
applies-to:
  - pcb
config-keys:
  - rules.manufacturing.fiducials.enabled
  - rules.manufacturing.fiducials.minimum
---

# manufacturing.fiducials

## What It Checks

Checks explicitly enabled assembly jobs for minimum fiducial footprint coverage.

## When It Fires

Fires when the parsed PCB has fewer fiducial references than the configured minimum.

## Configuration Example

```yaml
version: 1
rules:
  manufacturing.fiducials:
    enabled: true
    severity: medium
```

## JSON Finding Details Shape

```text
{ required, found }
```

## Report Context

Use this finding to decide whether the design package is ready for review, fabrication, or release. BoardReadyOps reports the condition and leaves design edits to the owning workflow.
