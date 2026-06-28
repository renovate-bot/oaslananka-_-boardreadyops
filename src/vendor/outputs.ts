export type VendorOutputKind = "gerber" | "drill" | "bom" | "position" | "pdf" | "step";

export const VENDOR_OUTPUT_KINDS: VendorOutputKind[] = ["gerber", "drill", "bom", "position", "pdf", "step"];

export const VENDOR_OUTPUT_PATTERNS: Record<VendorOutputKind, string[]> = {
  gerber: [
    "**/*.gbr",
    "**/*.gtl",
    "**/*.gbl",
    "**/*.gts",
    "**/*.gbs",
    "**/*.gto",
    "**/*.gbo",
    "**/*.gm1",
    "**/*.gm2",
    "**/*.gbrjob",
    "**/gerbers/**/*.gbr",
    "**/fabrication/**/*.gbr",
    "**/production/**/*.gbr",
    "**/jlcpcb/**/*.gbr",
    "**/pcbway/**/*.gbr",
    "**/aisler/**/*.gbr",
    "**/oshpark/**/*.gbr",
    "**/outputs/**/*.gbr",
    "**/release/**/*.gbr",
    "**/manufacturing/**/*.gbr",
  ],
  drill: ["**/*.drl", "**/*.xln", "**/*.ncd", "**/*.cnc", "**/*-PTH.drl", "**/*-NPTH.drl"],
  position: [
    "**/*.pos",
    "**/*position*.csv",
    "**/CPL*.csv",
    "**/positions*.csv",
    "**/*-top-pos.csv",
    "**/*-bottom-pos.csv",
    "**/*_cpl.csv",
    "**/*-both.pos",
  ],
  bom: [
    "**/bom.csv",
    "**/BOM*.csv",
    "**/bill-of-materials*.csv",
    "**/*_bom.csv",
    "**/bom*.xml",
    "**/BOM*.xml",
    "**/*_bom.xml",
    "**/bill-of-materials*.xml",
    "**/bom.xlsx",
    "**/BOM*.xlsx",
  ],
  pdf: ["**/*.pdf"],
  step: ["**/*.step", "**/*.stp"],
};

export function vendorOutputPatterns(kind: string): string[] {
  return VENDOR_OUTPUT_PATTERNS[kind as VendorOutputKind] ?? [`**/*${kind}*`];
}
