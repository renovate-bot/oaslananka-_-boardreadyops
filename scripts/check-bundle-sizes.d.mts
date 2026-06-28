export interface SizePolicy {
  budget: number;
  failAtRatio: number;
}

export function normalizeSizePolicy(
  policy: number | Partial<SizePolicy> | null | undefined,
  label?: string,
): SizePolicy;
