import type { FabricationOutputDiff } from "../core/diff/fabrication.js";
import { type Locale, t } from "../i18n/t.js";

/**
 * Human-readable summary of a changed fabrication output's file deltas
 * (e.g. "2 changed, 1 added"). Returns an empty string for outputs that
 * were not modified in place. Shared by the Markdown and HTML reports.
 */
export function outputChangeSummary(output: FabricationOutputDiff, locale: Locale): string {
  if (output.status !== "changed") {
    return "";
  }
  return [
    output.changed > 0 ? t("report.output.changed", { count: output.changed }, locale) : "",
    output.added > 0 ? t("report.output.added", { count: output.added }, locale) : "",
    output.removed > 0 ? t("report.output.removed", { count: output.removed }, locale) : "",
  ]
    .filter(Boolean)
    .join(", ");
}
