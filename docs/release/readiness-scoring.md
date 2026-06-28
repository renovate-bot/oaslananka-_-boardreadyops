# Vendor Readiness Scoring

Every BoardReadyOps run computes an explainable **release readiness score** from the configured vendor profile and the findings produced by the pipeline. The score is attached to the run result, so it appears in both the JSON report and the HTML report without any extra command.

## What the score measures

The readiness model combines two signals:

1. **Evidence coverage** — which manufacturing outputs the vendor profile expects. Outputs are classified as **required** (must be present to fabricate or assemble) or **recommended** (improves reviewability, e.g. a fabrication drawing PDF or a STEP model). See [vendor profiles](../vendor-profiles.md) for the built-in profiles.
2. **Findings** — separated into **blocking** and **non-blocking**. A finding is blocking when it meets the active `fail-on` threshold and is not suppressed; informational findings never block.

The result is a `score` from 0–100 and a `status`:

- `ready` — all required outputs present, no blocking findings, nothing recommended missing
- `at-risk` — required outputs present and nothing blocking, but recommended outputs are missing or non-blocking findings exist
- `blocked` — a required output is missing or a blocking finding is present

## JSON report

The score is part of the run result under `readiness`:

```json
{
  "readiness": {
    "profile": { "id": "jlcpcb", "name": "JLCPCB", "service": "fabrication+assembly" },
    "score": 72,
    "status": "at-risk",
    "blocking": 0,
    "nonBlocking": 2,
    "evidence": [
      { "output": "bom", "importance": "required", "present": true },
      { "output": "gerber", "importance": "required", "present": true },
      { "output": "pdf", "importance": "recommended", "present": false }
    ],
    "missingRequired": [],
    "missingRecommended": ["pdf"],
    "warnings": ["Recommended output pdf is missing."]
  }
}
```

When no vendor profile is configured, `profile` is omitted and the score reflects findings only.

## HTML report

The HTML report shows a **Release Readiness** section at the top of the page so reviewers see the decision first: the score, a status badge, the vendor profile, the blocking/non-blocking finding counts, an evidence checklist, and any warnings.

## Configuring the profile

Set the vendor profile in `boardreadyops.yml`:

```yaml
version: 1
vendor:
  profile: jlcpcb
  service: fabrication+assembly
  required: [step] # promote a recommended output to required
```

Required and recommended outputs are derived from the profile and the selected service; any output listed under `vendor.required` is always treated as required.
