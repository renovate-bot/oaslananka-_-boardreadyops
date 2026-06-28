# Policy Engine

The policy engine adds a configurable release policy layer on top of the pipeline result. A policy is a set of blocking rules evaluated against the findings and the [readiness score](readiness-scoring.md); when enforced, a failing policy blocks the release.

## Configuration

Add a `policy` section to `boardreadyops.yml`. It is validated against the configuration schema.

```yaml
version: 1
vendor:
  profile: jlcpcb
policy:
  enforce: true # when true, a failing policy makes `boardreadyops policy` exit 1
  rules:
    - id: no-blocking-findings
      type: max-severity
      severity: high # fail if any finding is at or above this severity
    - id: minimum-readiness
      type: min-readiness-score
      score: 80
    - id: required-outputs
      type: require-required-outputs
    - id: ready-or-at-risk
      type: require-readiness-status
      status: [ready, at-risk]
    - id: finding-budget
      type: max-findings
      max: 25
    - id: no-eol
      type: forbid-rules
      rules: [bom.eol-component]
```

### Rule types

| Type | Fails when | Fields |
| --- | --- | --- |
| `max-severity` | any finding is at or above `severity` | `severity` |
| `max-findings` | the total finding count exceeds `max` | `max` |
| `min-readiness-score` | the readiness score is below `score` | `score` |
| `require-readiness-status` | the readiness status is not in `status` | `status` |
| `require-required-outputs` | any required vendor output is missing | — |
| `forbid-rules` | any listed rule id produced a finding | `rules` |
| `forbid-expired-waivers` | any [waiver](waivers.md) has expired | — |
| `forbid-stale-waivers` | any fingerprint-scoped waiver no longer matches a finding | — |

## Evaluating a policy

```bash
boardreadyops policy .            # evaluate; exit 1 if an enforced policy fails
boardreadyops policy . --simulate # evaluate and print the result without affecting the exit code
boardreadyops policy . --format json
```

Simulation mode is the recommended way to preview a policy change in CI before turning on enforcement: it prints the full per-rule explanation and always exits `0`.

The policy result is also attached to the run result, so it appears in the JSON report under `policy` and as a badge in the [HTML release dashboard](../reports/html.md) decision banner.
