/**
 * Structured error hierarchy for BoardReadyOps.
 *
 * All errors extend {@link BoardReadyOpsError}, allowing consumers to distinguish
 * BoardReadyOps errors from unexpected throws with a single `instanceof` check.
 *
 * Edge layers (CLI, Action) should catch these and translate them into
 * user-facing diagnostics; internal helpers should throw typed errors where
 * practical instead of bare `Error`.
 */

/** Base error class for all BoardReadyOps-specific errors. */
export class BoardReadyOpsError extends Error {
  override readonly name: string = "BoardReadyOpsError";

  constructor(
    message: string,
    public readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** Raised when configuration loading or validation fails. */
export class ConfigError extends BoardReadyOpsError {
  override readonly name: string = "ConfigError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, "CONFIG_INVALID", options);
  }
}

/** Raised when a plugin cannot be loaded, validated, or registered. */
export class PluginError extends BoardReadyOpsError {
  override readonly name: string = "PluginError";

  constructor(
    message: string,
    public readonly specifier: string,
    options?: ErrorOptions,
  ) {
    super(message, "PLUGIN_LOAD_FAILED", options);
  }
}

/** Raised when a rule execution fails unexpectedly. */
export class RuleError extends BoardReadyOpsError {
  override readonly name: string = "RuleError";

  constructor(
    message: string,
    public readonly ruleId: string,
    options?: ErrorOptions,
  ) {
    super(message, "RULE_EXECUTION_FAILED", options);
  }
}

/** Raised when a CLI argument or option is invalid. */
export class CliError extends BoardReadyOpsError {
  override readonly name: string = "CliError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, "CLI_INVALID_ARGS", options);
  }
}

/** Raised when a KiCad CLI invocation fails or the binary is missing. */
export class KicadCliError extends BoardReadyOpsError {
  override readonly name: string = "KicadCliError";

  constructor(
    message: string,
    public readonly exitCode?: number,
    options?: ErrorOptions,
  ) {
    super(message, "KICAD_CLI_FAILED", options);
  }
}

/** Raised when a release evidence bundle is malformed or fails verification. */
export class EvidenceBundleError extends BoardReadyOpsError {
  override readonly name: string = "EvidenceBundleError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, "EVIDENCE_BUNDLE_INVALID", options);
  }
}

/** Raised when file discovery or path resolution fails. */
export class DiscoveryError extends BoardReadyOpsError {
  override readonly name: string = "DiscoveryError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, "DISCOVERY_FAILED", options);
  }
}

/**
 * Type guard to check if an unknown value is a BoardReadyOps error.
 * Useful at catch boundaries that need to distinguish expected failures from bugs.
 */
export function isBoardReadyOpsError(value: unknown): value is BoardReadyOpsError {
  return value instanceof BoardReadyOpsError;
}
