export function findI18nProblems(
  root?: string,
  options?: {
    sourceGlobs?: string[];
    catalogs?: Array<{ file: string; exportName: string; source: boolean }>;
  },
): Promise<string[]>;

export function main(root?: string): Promise<void>;
