# HTML Reports

The HTML report is a standalone release review page for sharing BoardReadyOps results outside CI log views. It has no external assets or network dependencies: CSS and filtering JavaScript are embedded in the generated file.

Enable it from `boardreadyops.yml`:

```yaml
version: 1
report:
  html: build/boardreadyops.report.html
```

When the HTML report is written by the CLI, its headings, controls, table captions, and empty-state labels honor `BOARDREADY_LOCALE` or `LANG`. Use `BOARDREADY_LOCALE=__PSEUDO__` for pseudo-locale smoke testing:

Linux and macOS:

```sh
BOARDREADY_LOCALE=__PSEUDO__ boardreadyops run .
```

Windows 11 PowerShell:

```powershell
$env:BOARDREADY_LOCALE = "__PSEUDO__"
boardreadyops run .
Remove-Item Env:\BOARDREADY_LOCALE
```

Finding messages, rule IDs, and resource paths remain English and stable for cross-tool references.

The report is laid out as a release review page, with the decision first:

- A **release decision** banner at the top showing the pass/fail gate result, the [readiness status](../release/readiness-scoring.md), and the finding summary, so reviewers see the outcome before scrolling.
- A **release readiness** section with the score, vendor profile, blocking/non-blocking finding counts, an evidence checklist, and warnings.
- An **artifacts** section linking the sibling reports written in the same run (JSON, SARIF, Markdown, JUnit) with paths relative to the HTML file.
- Summary counts by severity.
- Per-project finding totals.
- Per-rule finding totals.
- A filterable findings table with severity, rule, and project filters.
- Expandable finding details with message, resource, location, fix steps, context, and references.

The artifacts section appears only when the run writes other report files alongside the HTML report, for example:

```yaml
version: 1
report:
  html: build/boardreadyops.report.html
  json: build/boardreadyops.report.json
  sarif: build/boardreadyops.sarif
```

The generated markup is intended to be readable in browsers, valid under `html-validate:recommended`, usable with assistive technology, and printable with a simplified stylesheet.
