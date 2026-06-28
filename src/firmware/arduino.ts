import fs from "node:fs/promises";
import {
  type FirmwareContractAdapter,
  type FirmwarePinAssignment,
  type LoadedFirmwareContract,
  normalizeHardwareKey,
} from "./contract.js";

const DEFINE_PATTERN = /^\s*#\s*define\s+([A-Za-z_]\w*)\s+([^\s/]+)\s*(?:\/\/\s*(.*))?$/;

/**
 * Parse an Arduino / C firmware header that maps signal macros to hardware pins, e.g.
 *
 *   #define LED_STATUS U1.PA1   // net=LED_STATUS pin=GPIO2 env=esp32
 *
 * The optional trailing comment carries `net=`, `pin=`, and `env=`/`environment=` metadata.
 */
export async function loadArduinoPinContract(file: string): Promise<LoadedFirmwareContract> {
  let text: string;
  try {
    text = await fs.readFile(file, "utf8");
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : "Arduino pin header could not be loaded"] };
  }
  const pins: FirmwarePinAssignment[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = DEFINE_PATTERN.exec(line);
    if (!match) {
      continue;
    }
    const [, signal, hardware, comment] = match;
    if (!signal || !hardware) {
      continue;
    }
    const meta = parseMeta(comment ?? "");
    pins.push({
      signal,
      hardware: normalizeHardwareKey(hardware),
      ...(meta.net ? { net: meta.net } : {}),
      ...(meta.pin ? { pin: meta.pin } : {}),
      ...(meta.environment ? { environment: meta.environment } : {}),
    });
  }
  if (pins.length === 0) {
    return { errors: ["Arduino pin header has no #define pin assignments"] };
  }
  return { document: { version: 1, pins }, errors: [] };
}

export const arduinoAdapter: FirmwareContractAdapter = {
  id: "arduino",
  label: "Arduino/C header",
  configKey: "arduino",
  load: loadArduinoPinContract,
};

function parseMeta(comment: string): {
  net?: string | undefined;
  pin?: string | undefined;
  environment?: string | undefined;
} {
  return {
    net: matchMeta(comment, "net"),
    pin: matchMeta(comment, "pin"),
    environment: matchMeta(comment, "env(?:ironment)?"),
  };
}

function matchMeta(comment: string, key: string): string | undefined {
  return new RegExp(`\\b${key}\\s*=\\s*(\\S+)`, "i").exec(comment)?.[1];
}
