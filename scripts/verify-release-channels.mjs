import { readFile } from "node:fs/promises";

const checks = [];
const failures = [];

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const manifest = JSON.parse(await readFile(".release-please-manifest.json", "utf8"));
const generated = await readFile("src/generated/version.ts", "utf8");
const releasePlease = JSON.parse(await readFile("release-please-config.json", "utf8"));
const publishWorkflow = await readFile(".github/workflows/publish-npm.yml", "utf8");

const version = packageJson.version;
const generatedVersion = /boardReadyVersion\s*=\s*"([^"]+)"/.exec(generated)?.[1];

check("package.json version matches .release-please-manifest.json", manifest["."] === version, {
  package: version,
  manifest: manifest["."],
});
check("package.json version matches src/generated/version.ts", generatedVersion === version, {
  package: version,
  generated: generatedVersion,
});
check(
  "package publishConfig enables public provenance publishing",
  packageJson.publishConfig?.access === "public" && packageJson.publishConfig?.provenance === true,
  {
    publishConfig: packageJson.publishConfig,
  },
);

const extraFiles = releasePlease.packages?.["."]?.["extra-files"] ?? [];
check(
  "release-please updates src/generated/version.ts",
  extraFiles.some((entry) => entry?.path === "src/generated/version.ts"),
  { extraFiles },
);
check("npm publish workflow can mint OIDC tokens", /\bid-token:\s*write\b/.test(publishWorkflow));
check(
  "npm publish workflow disables package-manager cache for release builds",
  /package-manager-cache:\s*false/.test(publishWorkflow),
);
check(
  "npm publish workflow publishes with npm provenance",
  /npm publish[^\n]*--provenance/.test(publishWorkflow) ||
    (packageJson.publishConfig?.provenance === true && /id-token:\s*write/.test(publishWorkflow)),
);
check(
  "npm publish workflow verifies package version against the release tag",
  /v\$\{package_version\}/.test(publishWorkflow) && /RELEASE_TAG/.test(publishWorkflow),
);
check("npm publish workflow attests built artifacts", /actions\/attest-build-provenance@/.test(publishWorkflow));
check(
  "npm publish workflow uploads an SBOM artifact",
  /name:\s*sbom/.test(publishWorkflow) && /sbom\.cyclonedx\.json/.test(publishWorkflow),
);

if (process.env.BOARDREADY_VERIFY_PUBLIC_CHANNELS === "1") {
  await verifyPublicChannels(version);
}

if (failures.length > 0) {
  for (const failure of failures) {
    writeError(`release channel check failed: ${failure.name}`);
    if (failure.details) {
      writeError(JSON.stringify(failure.details, null, 2));
    }
  }
  process.exitCode = 1;
} else {
  for (const item of checks) {
    writeOutput(`ok: ${item}`);
  }
}

function check(name, passed, details) {
  checks.push(name);
  if (!passed) {
    failures.push({ name, details });
  }
}

async function verifyPublicChannels(version) {
  const tag = `v${version}`;
  const npmVersion = await fetchJson(`https://registry.npmjs.org/boardreadyops/${version}`)
    .then((body) => body.version)
    .catch(() => undefined);

  check("public npm package matches package.json version", npmVersion === version, {
    expected: version,
    actual: npmVersion,
  });

  const release = await fetchJson("https://api.github.com/repos/oaslananka/boardreadyops/releases/latest").catch(
    () => undefined,
  );
  check("latest GitHub release tag matches package.json version", release?.tag_name === tag, {
    expected: tag,
    actual: release?.tag_name,
  });

  const tags = await fetchJson("https://api.github.com/repos/oaslananka/boardreadyops/tags").catch(() => []);
  check("GitHub tag exists for package.json version", Array.isArray(tags) && tags.some((item) => item?.name === tag), {
    expected: tag,
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json, application/json",
      "User-Agent": "boardreadyops-release-channel-check",
    },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

function writeOutput(message) {
  process.stdout.write(`${message}\n`);
}

function writeError(message) {
  process.stderr.write(`${message}\n`);
}
