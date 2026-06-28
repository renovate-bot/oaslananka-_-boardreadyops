import path from "node:path";
import type { RuleContext } from "../../core/context.js";
import { buildSchematicNetGraph, type SchematicNetGraph } from "../../kicad/schematic-graph.js";

export function resolvePinmap(context: Pick<RuleContext, "root" | "options" | "config">): string | undefined {
  const configured = context.options.pinmap || context.config.projects?.find((project) => project.pinmap)?.pinmap;
  return configured ? path.resolve(context.root, configured) : undefined;
}

export async function schematicNetLabels(context: Pick<RuleContext, "root" | "projects">): Promise<Set<string>> {
  return (await schematicNetGraph(context)).visibleNetLabels;
}

export async function schematicNetGraph(context: Pick<RuleContext, "root" | "projects">): Promise<SchematicNetGraph> {
  const roots: string[] = [];
  for (const project of context.projects) {
    const firstSchematic = project.schematicFiles[0];
    if (firstSchematic) {
      roots.push(path.resolve(context.root, firstSchematic));
    }
  }
  return buildSchematicNetGraph(roots);
}
