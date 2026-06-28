# Branch Protection

Rulesets are stored as code in `.github/rulesets/main.json`.

Apply:

```bash
gh api -X POST /repos/oaslananka/boardreadyops/rulesets --input .github/rulesets/main.json
```

Update existing:

```bash
gh api /repos/oaslananka/boardreadyops/rulesets
gh api -X PUT /repos/oaslananka/boardreadyops/rulesets/<id> --input .github/rulesets/main.json
```

Required status checks:

- `ci / risk-profile`
- `ci / lint`
- `ci / typecheck`
- `ci / test-unit`
- `ci / build`
- `ci / verify-dist`
- `ci / security`

Heavy checks such as OS/Node matrix tests, KiCad integration, coverage, mutation, accessibility, and action smoke are routed by the `ci / risk-profile` job. They run when the changed files make them relevant, on main pushes, or in dedicated scheduled workflows.
