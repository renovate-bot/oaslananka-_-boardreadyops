import fs from "node:fs/promises";
import * as yaml from "js-yaml";
import { z } from "zod";
import {
  type FirmwareContract,
  type FirmwareContractAdapter,
  type LoadedFirmwareContract,
  normalizeHardwareKey,
} from "./contract.js";

export type LoadedPlatformioPinContract = LoadedFirmwareContract;

const pinObjectSchema = z.strictObject({
  hardware: z.string().min(1),
  net: z.string().min(1).optional(),
  pin: z.string().min(1).optional(),
  environment: z.string().min(1).optional(),
});

const pinArrayEntrySchema = pinObjectSchema.extend({
  signal: z.string().min(1),
});

const contractSchema = z.strictObject({
  version: z.literal(1),
  pins: z.union([z.record(z.string().min(1), pinObjectSchema), z.array(pinArrayEntrySchema)]),
});

export async function loadPlatformioPinContract(file: string): Promise<LoadedPlatformioPinContract> {
  try {
    const raw = yaml.load(await fs.readFile(file, "utf8"));
    const parsed = contractSchema.safeParse(raw);
    if (!parsed.success) {
      return { errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
    }
    return { document: normalizeContract(parsed.data), errors: [] };
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : "PlatformIO pin contract could not be loaded"] };
  }
}

export const platformioAdapter: FirmwareContractAdapter = {
  id: "platformio",
  label: "PlatformIO",
  configKey: "platformio",
  load: loadPlatformioPinContract,
};

function normalizeContract(input: z.infer<typeof contractSchema>): FirmwareContract {
  const pins = Array.isArray(input.pins)
    ? input.pins
    : Object.entries(input.pins).map(([signal, assignment]) => ({ signal, ...assignment }));
  return {
    version: 1,
    pins: pins.map((assignment) => ({
      signal: assignment.signal,
      hardware: normalizeHardwareKey(assignment.hardware),
      ...(assignment.net ? { net: assignment.net } : {}),
      ...(assignment.pin ? { pin: assignment.pin } : {}),
      ...(assignment.environment ? { environment: assignment.environment } : {}),
    })),
  };
}
