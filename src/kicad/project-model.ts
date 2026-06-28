import type { SexprDocument, SexprListNode, SexprNode, SexprSourceSpan } from "./sexpr.js";
import {
  findSexprLists,
  parseSexprDocument,
  sexprChildLists,
  sexprChildValue,
  sexprDescendantScalars,
  sexprHead,
  sexprListValue,
  sexprSourceText,
} from "./sexpr.js";

export type KiCadDocumentKind = "pcb" | "schematic" | "project" | "jobset" | "unknown";

export interface KiCadDocumentModel {
  kind: KiCadDocumentKind;
  text: string;
  ast: SexprDocument;
  root?: SexprListNode | undefined;
  formatVersion?: string | undefined;
}

export function parseKicadDocument(text: string, kind: KiCadDocumentKind = "unknown"): KiCadDocumentModel {
  const ast = parseSexprDocument(text);
  const root = ast.nodes.find((node): node is SexprListNode => node.kind === "list");
  const model: KiCadDocumentModel = { kind, text, ast };
  if (root) {
    model.root = root;
    const version = listChildValue(root, "version") ?? listChildValue(root, "generator_version");
    if (version) {
      model.formatVersion = version;
    }
  }
  return model;
}

export function findKiCadLists(
  modelOrList: KiCadDocumentModel | SexprListNode,
  head: string,
  options: { recursive?: boolean } = {},
): SexprListNode[] {
  if ("ast" in modelOrList) {
    return findSexprLists(modelOrList.ast, head, options);
  }
  return findSexprLists(modelOrList, head, options);
}

export function directChildLists(list: SexprListNode, head?: string | undefined): SexprListNode[] {
  return sexprChildLists(list, head);
}

export function listHead(list: SexprListNode): string | undefined {
  return sexprHead(list);
}

export function listValue(list: SexprListNode, index = 1): string | undefined {
  return sexprListValue(list, index);
}

export function listChildValue(list: SexprListNode, head: string, index = 1): string | undefined {
  return sexprChildValue(list, head, index);
}

export function propertyValue(list: SexprListNode, property: string): string | undefined {
  for (const child of directChildLists(list, "property")) {
    if (listValue(child, 1) === property) {
      return listValue(child, 2);
    }
  }
  return undefined;
}

export function descendantScalars(list: SexprListNode): string[] {
  return sexprDescendantScalars(list);
}

export function sourceText(model: KiCadDocumentModel, node: SexprNode): string {
  return sexprSourceText(model.text, node);
}

export function sourceSpan(node: SexprNode): SexprSourceSpan {
  return node.span;
}
