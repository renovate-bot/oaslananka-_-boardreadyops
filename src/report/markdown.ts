import Mustache from "mustache";
import type { FabricationDiff } from "../core/diff/fabrication.js";
import type { Finding } from "../core/findings.js";
import type { RunResult } from "../core/result.js";
import { type Locale, t } from "../i18n/t.js";
import { outputChangeSummary } from "./fabrication-summary.js";
import { reportFindingContext } from "./finding-context.js";
import prCommentTemplate from "./templates/pr-comment.mustache";
import summaryTemplate from "./templates/summary.mustache";

const stickyMarker = "<!-- boardreadyops:sticky:v1 -->";

export interface MarkdownArtifact {
  label: string;
  url: string;
}

export function formatMarkdown(
  result: RunResult,
  artifacts: MarkdownArtifact[] = [],
  fabrication?: FabricationDiff,
  locale: Locale = "en",
): string {
  const fabricationView = fabrication ? formatFabricationDiff(fabrication, locale) : undefined;
  const topFindings = result.findings.slice(0, 10).map(markdownFinding);
  const fixFindings = result.findings
    .filter((finding) => finding.fix)
    .slice(0, 10)
    .map(markdownFinding);
  const plugins = (result.plugins ?? []).map((plugin) => ({
    ...plugin,
    permissionsSummary: plugin.permissions.requested.length > 0 ? plugin.permissions.requested.join(", ") : "none",
  }));
  return Mustache.render(
    prCommentTemplate,
    {
      ...result,
      hasFindings: result.findings.length > 0,
      topFindings,
      hasFixes: fixFindings.length > 0,
      fixFindings,
      hasArtifacts: artifacts.length > 0,
      hasPlugins: plugins.length > 0,
      plugins,
      artifacts,
      hasFabricationDiff: Boolean(fabricationView),
      fabrication: fabricationView,
      labels: markdownLabels(locale),
    },
    { summary: summaryTemplate },
  );
}

export { stickyMarker };

function formatFabricationDiff(diff: FabricationDiff, locale: Locale) {
  const addedFindings = diff.findings.added.slice(0, 10);
  return {
    ...diff,
    bom: {
      ...diff.bom,
      hasRows: diff.bom.rows.length > 0,
      rows: diff.bom.rows.map((row) => ({
        ...row,
        previous: row.previous || "-",
        current: row.current || "-",
      })),
    },
    outputs: diff.outputs.map((output) => ({
      ...output,
      summary: outputChangeSummary(output, locale),
    })),
    findings: {
      ...diff.findings,
      hasAdded: diff.findings.added.length > 0,
      added: addedFindings,
      addedTruncated: diff.findings.added.length > addedFindings.length,
      addedRemaining: diff.findings.added.length - addedFindings.length,
      addedRemainingLabel: t(
        "report.moreNewFindings",
        { count: diff.findings.added.length - addedFindings.length },
        locale,
      ),
    },
  };
}

function markdownLabels(locale: Locale): Record<string, string> {
  return {
    artifacts: t("report.artifacts", {}, locale),
    bom: t("report.bom", {}, locale),
    bomDiffTruncated: t("report.bomDiffTruncated", {}, locale),
    count: t("report.count", {}, locale),
    critical: t("severity.critical", {}, locale),
    current: t("report.current", {}, locale),
    fabricationChanges: t("report.fabricationChanges", {}, locale),
    fix: t("report.fix", {}, locale),
    high: t("severity.high", {}, locale),
    info: t("severity.info", {}, locale),
    low: t("severity.low", {}, locale),
    manufacturingOutputs: t("report.manufacturingOutputs", {}, locale),
    plugins: "Plugins",
    medium: t("severity.medium", {}, locale),
    metric: t("report.metric", {}, locale),
    newFindings: t("report.newFindings", {}, locale),
    noBomChanges: t("report.noBomChanges", {}, locale),
    noFindings: t("report.noFindings", {}, locale),
    previous: t("report.previous", {}, locale),
    ref: t("report.ref", {}, locale),
    reportTitle: t("report.title", {}, locale),
    status: t("report.status", {}, locale),
    topFindings: t("report.topFindings", {}, locale),
    total: t("report.total", {}, locale),
  };
}

function markdownFinding(finding: Finding) {
  return {
    ...finding,
    report: reportFindingContext(finding),
  };
}
