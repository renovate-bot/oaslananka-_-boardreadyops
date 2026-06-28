const pluginPermissionValues = ["fs:read", "fs:write", "network", "process", "kicad-cli"] as const;

export type PluginPermission = (typeof pluginPermissionValues)[number];

export interface PluginPermissionGrantConfig {
  default?: PluginPermission[] | undefined;
  allow?: Record<string, PluginPermission[]> | undefined;
  deny?: Record<string, PluginPermission[]> | undefined;
}

export interface LoadedPluginPermissions {
  requested: PluginPermission[];
  allowed: PluginPermission[];
  denied: PluginPermission[];
  approvedBy: string[];
}

const pluginPermissionSet = new Set<string>(pluginPermissionValues);

export function isPluginPermission(value: unknown): value is PluginPermission {
  return typeof value === "string" && pluginPermissionSet.has(value);
}

function normalizePluginPermissions(input: readonly PluginPermission[] | undefined): PluginPermission[] {
  if (!input) {
    return [];
  }
  return [...new Set(input)].sort((a, b) => a.localeCompare(b));
}

export function evaluatePluginPermissions(input: {
  specifier: string;
  name: string;
  requested: readonly PluginPermission[] | undefined;
  config: PluginPermissionGrantConfig | undefined;
}): LoadedPluginPermissions {
  const requested = normalizePluginPermissions(input.requested);
  const allowed = allowedPermissionsFor(input.config, input.specifier, input.name);
  const denied = requested.filter((permission) => !allowed.has(permission));
  return {
    requested,
    allowed: requested.filter((permission) => allowed.has(permission)),
    denied,
    approvedBy: approvalKeysFor(input.config, input.specifier, input.name, requested),
  };
}

export function pluginPermissionDenialMessage(input: {
  specifier: string;
  name: string;
  denied: readonly PluginPermission[];
}): string {
  return `Plugin "${input.specifier}" (${input.name}) requests unapproved permission${input.denied.length === 1 ? "" : "s"}: ${input.denied.join(", ")}. Add them under pluginPermissions.allow["${input.name}"] or pluginPermissions.allow["${input.specifier}"] after review.`;
}

function allowedPermissionsFor(
  config: PluginPermissionGrantConfig | undefined,
  specifier: string,
  name: string,
): Set<PluginPermission> {
  const allowed = new Set<PluginPermission>(normalizePluginPermissions(config?.default));
  for (const key of ["*", specifier, name]) {
    for (const permission of config?.allow?.[key] ?? []) {
      allowed.add(permission);
    }
  }
  for (const key of ["*", specifier, name]) {
    for (const permission of config?.deny?.[key] ?? []) {
      allowed.delete(permission);
    }
  }
  return allowed;
}

function approvalKeysFor(
  config: PluginPermissionGrantConfig | undefined,
  specifier: string,
  name: string,
  requested: readonly PluginPermission[],
): string[] {
  if (requested.length === 0) {
    return [];
  }
  const keys: string[] = [];
  for (const key of ["default", "*", specifier, name]) {
    const granted = key === "default" ? config?.default : config?.allow?.[key];
    if (granted?.some((permission) => requested.includes(permission))) {
      keys.push(key);
    }
  }
  return keys;
}
