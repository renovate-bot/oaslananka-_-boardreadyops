import { findVendorProfile, listVendorProfiles, resolveVendorProfile } from "../../vendor/profiles.js";

export interface VendorCommandOptions {
  format?: "text" | "json";
}

export function vendorListCommand(
  options: VendorCommandOptions,
  streams: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream },
): number {
  const profiles = listVendorProfiles();
  if (options.format === "json") {
    streams.stdout.write(`${JSON.stringify(profiles, null, 2)}\n`);
    return 0;
  }
  for (const profile of profiles) {
    streams.stdout.write(`${profile.id}\t${profile.name}\t${profile.service}\t${profile.summary}\n`);
  }
  return 0;
}

export function vendorExplainCommand(
  profileInput: string | undefined,
  options: VendorCommandOptions,
  streams: { stdout: NodeJS.WritableStream; stderr: NodeJS.WritableStream },
): number {
  const profile = findVendorProfile(profileInput);
  if (!profile) {
    streams.stderr.write(`Unknown vendor profile: ${profileInput ?? ""}\n`);
    return 2;
  }
  const resolved = resolveVendorProfile({ profile: profile.id });
  if (options.format === "json") {
    streams.stdout.write(`${JSON.stringify({ profile, requiredOutputs: resolved?.requiredOutputs ?? [] }, null, 2)}\n`);
    return 0;
  }
  streams.stdout.write(`${profile.name} (${profile.id})\n`);
  streams.stdout.write(`${profile.summary}\n`);
  streams.stdout.write(`Service: ${profile.service}\n`);
  streams.stdout.write(`Required outputs: ${(resolved?.requiredOutputs ?? []).join(", ") || "none"}\n`);
  if (profile.fabrication) {
    streams.stdout.write("Fabrication limits:\n");
    for (const [key, value] of Object.entries(profile.fabrication)) {
      streams.stdout.write(`- ${key}: ${value}\n`);
    }
  }
  if (profile.evidence.length > 0) {
    streams.stdout.write("Evidence:\n");
    for (const requirement of profile.evidence) {
      streams.stdout.write(`- ${requirement.output} (${requirement.requiredFor}): ${requirement.rationale}\n`);
    }
  }
  if (profile.caveats.length > 0) {
    streams.stdout.write("Caveats:\n");
    for (const caveat of profile.caveats) {
      streams.stdout.write(`- ${caveat}\n`);
    }
  }
  return 0;
}
