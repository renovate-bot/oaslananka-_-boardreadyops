import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject,
} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export interface ReleaseManifestSignature {
  schemaVersion: 1;
  algorithm: "ed25519";
  manifestDigest: string;
  signature: string;
  publicKey: string;
  signedAt: string;
}

export interface SignatureVerification {
  ok: boolean;
  errors: string[];
}

const SIGNATURE_FILE = "manifest.sig";
const MANIFEST_FILE = "manifest.json";

/** Sign the raw bytes of a release manifest with an Ed25519 private key. */
export function signManifestBytes(bytes: Buffer, privateKeyPem: string, signedAt: string): ReleaseManifestSignature {
  const privateKey = loadKey(privateKeyPem, "private");
  if (privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error(
      `release signing requires an Ed25519 private key, received ${privateKey.asymmetricKeyType ?? "unknown"}`,
    );
  }
  const signature = cryptoSign(null, bytes, privateKey);
  const publicKey = createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  return {
    schemaVersion: 1,
    algorithm: "ed25519",
    manifestDigest: createHash("sha256").update(bytes).digest("hex"),
    signature: signature.toString("base64"),
    publicKey,
    signedAt,
  };
}

/** Verify a manifest signature against the manifest bytes, optionally pinning a trusted public key. */
export function verifyManifestSignature(
  bytes: Buffer,
  signature: ReleaseManifestSignature,
  trustedPublicKeyPem?: string,
): SignatureVerification {
  const errors: string[] = [];
  if (signature.algorithm !== "ed25519") {
    return { ok: false, errors: [`unsupported signature algorithm: ${signature.algorithm}`] };
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (signature.manifestDigest && signature.manifestDigest !== digest) {
    errors.push("manifest digest in signature does not match manifest contents");
  }
  let publicKey: KeyObject;
  try {
    publicKey = loadKey(signature.publicKey, "public");
  } catch {
    return { ok: false, errors: ["signature public key could not be parsed"] };
  }
  let valid = false;
  try {
    valid = cryptoVerify(null, bytes, publicKey, Buffer.from(signature.signature, "base64"));
  } catch {
    valid = false;
  }
  if (!valid) {
    errors.push("signature does not match manifest contents");
  }
  if (trustedPublicKeyPem !== undefined) {
    if (!publicKeysMatch(publicKey, trustedPublicKeyPem)) {
      errors.push("signature public key does not match the trusted public key");
    }
  }
  return { ok: errors.length === 0, errors };
}

export interface SignReleaseBundleResult {
  signaturePath: string;
  signature: ReleaseManifestSignature;
}

/** Read a bundle's manifest, sign it, and write the `manifest.sig` sidecar next to it. */
export async function signReleaseBundle(
  bundleDir: string,
  privateKeyPem: string,
  signedAt: string,
): Promise<SignReleaseBundleResult> {
  const bytes = await fs.readFile(path.join(bundleDir, MANIFEST_FILE));
  const signature = signManifestBytes(bytes, privateKeyPem, signedAt);
  const signaturePath = path.join(bundleDir, SIGNATURE_FILE);
  await fs.writeFile(signaturePath, `${JSON.stringify(signature, null, 2)}\n`, "utf8");
  return { signaturePath, signature };
}

export interface BundleSignatureVerification extends SignatureVerification {
  present: boolean;
}

/** Verify a bundle's `manifest.sig` against its `manifest.json`, optionally pinning a trusted key. */
export async function verifyReleaseBundleSignature(
  bundleDir: string,
  trustedPublicKeyPem?: string,
): Promise<BundleSignatureVerification> {
  const signaturePath = path.join(bundleDir, SIGNATURE_FILE);
  let signatureRaw: string;
  try {
    signatureRaw = await fs.readFile(signaturePath, "utf8");
  } catch {
    return { ok: false, present: false, errors: [] };
  }
  let signature: ReleaseManifestSignature;
  try {
    signature = JSON.parse(signatureRaw) as ReleaseManifestSignature;
  } catch {
    return { ok: false, present: true, errors: ["manifest.sig is not valid JSON"] };
  }
  let bytes: Buffer;
  try {
    bytes = await fs.readFile(path.join(bundleDir, MANIFEST_FILE));
  } catch (error) {
    return { ok: false, present: true, errors: [`manifest could not be read: ${asMessage(error)}`] };
  }
  return { present: true, ...verifyManifestSignature(bytes, signature, trustedPublicKeyPem) };
}

function loadKey(pem: string, kind: "private" | "public"): KeyObject {
  return kind === "private" ? createPrivateKey(pem) : createPublicKey(pem);
}

function publicKeysMatch(publicKey: KeyObject, trustedPublicKeyPem: string): boolean {
  let trusted: KeyObject;
  try {
    trusted = createPublicKey(trustedPublicKeyPem);
  } catch {
    return false;
  }
  const trustedDer = trusted.export({ type: "spki", format: "der" });
  const embeddedDer = publicKey.export({ type: "spki", format: "der" });
  return Buffer.isBuffer(trustedDer) && Buffer.isBuffer(embeddedDer) && trustedDer.equals(embeddedDer);
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
