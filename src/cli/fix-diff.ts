/**
 * Myers diff algorithm and unified-diff formatting for fix-plan display.
 *
 * Extracted from fixes.ts to keep the fix-plan module under 250 lines of
 * business logic.
 */

interface ChangeShape {
  path: string;
  before?: string;
  after: string;
}

interface DiffOperation {
  prefix: " " | "-" | "+";
  line: string;
}

/**
 * Format a file location string from optional line/column values.
 */
export function formatLocation(file: string, line: number | undefined, column: number | undefined): string {
  if (line && column) {
    return `${file}:${line}:${column}`;
  }
  if (line) {
    return `${file}:${line}`;
  }
  return file;
}

/**
 * Produce a unified-diff string for a single file change.
 */
export function formatUnifiedDiff(change: ChangeShape): string {
  const beforePath = change.before === undefined ? "/dev/null" : change.path;
  const beforeLines = splitDiffLines(change.before ?? "");
  const afterLines = splitDiffLines(change.after);
  const lines = [
    `--- ${beforePath}`,
    `+++ ${change.path}`,
    `@@ -${formatDiffRange(beforeLines.length, change.before === undefined)} +${formatDiffRange(afterLines.length, false)} @@`,
  ];
  for (const operation of diffLines(beforeLines, afterLines)) {
    lines.push(`${operation.prefix}${operation.line}`);
  }
  return lines.join("\n");
}

/**
 * Split text into lines, discarding a trailing empty line.
 */
function splitDiffLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  return lines;
}

/**
 * Myers diff algorithm. Returns the edit operations between two line arrays.
 */
function diffLines(beforeLines: string[], afterLines: string[]): DiffOperation[] {
  const maxDistance = beforeLines.length + afterLines.length;
  let frontier = new Map<number, number>([[1, 0]]);
  const trace: Map<number, number>[] = [];
  for (let distance = 0; distance <= maxDistance; distance += 1) {
    const nextFrontier = new Map(frontier);
    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      const insertion =
        diagonal === -distance ||
        (diagonal !== distance && getFrontier(frontier, diagonal - 1) < getFrontier(frontier, diagonal + 1));
      let beforeIndex = insertion ? getFrontier(frontier, diagonal + 1) : getFrontier(frontier, diagonal - 1) + 1;
      let afterIndex = beforeIndex - diagonal;
      while (
        beforeIndex < beforeLines.length &&
        afterIndex < afterLines.length &&
        beforeLines[beforeIndex] === afterLines[afterIndex]
      ) {
        beforeIndex += 1;
        afterIndex += 1;
      }
      nextFrontier.set(diagonal, beforeIndex);
      if (beforeIndex >= beforeLines.length && afterIndex >= afterLines.length) {
        trace.push(nextFrontier);
        return backtrackDiff(trace, beforeLines, afterLines);
      }
    }
    trace.push(nextFrontier);
    frontier = nextFrontier;
  }
  return [];
}

function backtrackDiff(trace: Map<number, number>[], beforeLines: string[], afterLines: string[]): DiffOperation[] {
  const operations: DiffOperation[] = [];
  let beforeIndex = beforeLines.length;
  let afterIndex = afterLines.length;
  for (let distance = trace.length - 1; distance > 0; distance -= 1) {
    const previousFrontier = trace[distance - 1] ?? new Map<number, number>();
    const diagonal = beforeIndex - afterIndex;
    const insertion =
      diagonal === -distance ||
      (diagonal !== distance &&
        getFrontier(previousFrontier, diagonal - 1) < getFrontier(previousFrontier, diagonal + 1));
    const previousDiagonal = insertion ? diagonal + 1 : diagonal - 1;
    const previousBeforeIndex = getFrontier(previousFrontier, previousDiagonal);
    const previousAfterIndex = previousBeforeIndex - previousDiagonal;
    while (beforeIndex > previousBeforeIndex && afterIndex > previousAfterIndex) {
      beforeIndex -= 1;
      afterIndex -= 1;
      operations.push({ prefix: " ", line: beforeLines[beforeIndex] ?? "" });
    }
    if (insertion) {
      afterIndex -= 1;
      operations.push({ prefix: "+", line: afterLines[afterIndex] ?? "" });
    } else {
      beforeIndex -= 1;
      operations.push({ prefix: "-", line: beforeLines[beforeIndex] ?? "" });
    }
  }
  while (beforeIndex > 0 && afterIndex > 0) {
    beforeIndex -= 1;
    afterIndex -= 1;
    operations.push({ prefix: " ", line: beforeLines[beforeIndex] ?? "" });
  }
  while (beforeIndex > 0) {
    beforeIndex -= 1;
    operations.push({ prefix: "-", line: beforeLines[beforeIndex] ?? "" });
  }
  while (afterIndex > 0) {
    afterIndex -= 1;
    operations.push({ prefix: "+", line: afterLines[afterIndex] ?? "" });
  }
  return operations.reverse();
}

function getFrontier(frontier: Map<number, number>, diagonal: number): number {
  return frontier.get(diagonal) ?? Number.NEGATIVE_INFINITY;
}

function formatDiffRange(lineCount: number, emptyFile: boolean): string {
  if (emptyFile || lineCount === 0) {
    return "0,0";
  }
  return `1,${lineCount}`;
}
