# Release Channel Verification

This page records clean-consumer verification evidence for the public
BoardReadyOps consumption channels. It is intentionally separate from the normal
release process so every unsupported public channel has a concrete follow-up
issue before completion is claimed.

> **Current status:** The latest public release is `boardreadyops@1.4.6` on npm
> and the `v1.4.6` GitHub Release. On 2026-06-19, npm clean-consumer install,
> Linux x64 binary checksum/runtime smoke, release asset publication, and
> anonymous GHCR `v1`/`latest` manifest access were re-verified. The historical
> `v1.1.0` audit remains below for traceability.

## Current Release Verification (2026-06-19)

| Field | Value |
| --- | --- |
| Public release | `v1.4.6` |
| Release tag commit | `288e2da378a3a80e7591dd410d0fcba6a2b46330` |
| npm package | `boardreadyops@1.4.6` |
| npm integrity | `sha512-U1yULYjsEKaQ0YV1ztfq2xoRmc5TXkZzME40RWOrDNtuP92qo6/i4H3X17FWCirno1r2rCgXeTryDERhR/c7/w==` |
| npm shasum | `4f79a9d9c74a522f1f0e0b1c62d211cc386bb6ec` |
| npm engines | `^22.0.0 || ^24.0.0` |
| GitHub Release assets | Present: Linux x64, Linux arm64, macOS x64, macOS arm64, Windows x64, `SHA256SUMS`, and `sbom.cyclonedx.json` |
| `SHA256SUMS` digest | `sha256:d042f60c219cc241ff67d004b605d62cf6301364d927555e9eeff140c3a601bf` |
| `sbom.cyclonedx.json` digest | `sha256:0bed369fc08218093fa1258df59cbd736d96e4b16d74de8af688b48c33d8b783` |
| Anonymous GHCR `v1`/`latest` digest | `sha256:03eea649a1968e67fdb91f9c53e97e040bee3ca481f2b5ec79a8b8b3a11f299a` |
| GHCR exact and alias tags | `v1.4.6`, `v1`, and `latest` all resolve to OCI index digest `sha256:03eea649a1968e67fdb91f9c53e97e040bee3ca481f2b5ec79a8b8b3a11f299a` after workflow run `27791461239`. |

### Current Pass/Follow-up Matrix

| Channel | Result | Evidence | Follow-up |
| --- | --- | --- | --- |
| npm clean install | Pass | A temporary-prefix install of `boardreadyops@1.4.6` reported CLI version `1.4.6`, produced a valid `doctor --format json` report, and generated JSON, SARIF, Markdown, HTML, and JUnit outputs from `check . --fail-on never`. | None |
| Linux x64 release binary | Pass | The `v1.4.6` Linux x64 binary was downloaded with `SHA256SUMS`; checksum validation passed and the binary returned `1.4.6`. | None |
| GitHub Release binary assets | Pass | `v1.4.6` contains seven uploaded assets: five platform binaries, `SHA256SUMS`, and `sbom.cyclonedx.json`. | None |
| Homebrew formula | Pass for formula data | `Formula/boardreadyops.rb` points at `v1.4.6` macOS/Linux assets and uses checksums from the release `SHA256SUMS`. Publishing an external tap remains a maintainer process. | Tap publication |
| GHCR major aliases | Pass | Anonymous OCI index inspection with a clean Docker config succeeded for `ghcr.io/oaslananka/boardreadyops-full:v1` and `latest`, both at digest `sha256:03eea649a1968e67fdb91f9c53e97e040bee3ca481f2b5ec79a8b8b3a11f299a`. | Record `v1.4.6` exact-tag digest after run `27791461239` completes. |

### Current Release Artifact List

| Artifact | SHA-256 |
| --- | --- |
| `boardreadyops-linux-x64` | `13099f85d5dffe812ce8d3d04516f37b5d3881d189348afc1517a3d894d2c6f8` |
| `boardreadyops-linux-arm64` | `0db9f99abdb4aae748fc2df640091ca4c9d6f9fe9460b699c00b33f500eacc1a` |
| `boardreadyops-macos-x64` | `110f644b813146f65d85259bc83efdd510323d71ea299fadc548f8100af2c671` |
| `boardreadyops-macos-arm64` | `7e450e8763bcae98414cd648d556a069f8865b065d8bd07a2ecff4e9793986bd` |
| `boardreadyops-win-x64.exe` | `bb1ab2c1ca98b4789f754d0bcefdec30ac648dcb392db9a6e91d99d13ce28404` |

## Historical Audit Target

| Field | Value |
| --- | --- |
| Audit date | 2026-05-28 |
| Public release | `v1.1.0` |
| Release URL | <https://github.com/oaslananka/boardreadyops/releases/tag/v1.1.0> |
| Release tag commit | `41856e44bb2fc5def47a71072eccdad307301fc4` |
| npm package | `boardreadyops@1.1.0` |
| npm tarball | `https://registry.npmjs.org/boardreadyops/-/boardreadyops-1.1.0.tgz` |
| npm integrity | `sha512-fN0zRcKP1/fqW0/wYknBr+nh5HhZ7udpcfZoSqyNuRvinCdmvbQO9kOz/yG4KrqeHSzXuk0iMT5Fuw/YtchngQ==` |
| npm shasum | `c358e9cc8dd4cb5d63e466d1602cd901ad62d24b` |
| npm engines for public package | `^22.0.0 || ^24.0.0` |
| GHCR image index | `ghcr.io/oaslananka/boardreadyops-full:v1.1.0@sha256:5258e7de0e25382894c70164e990820f78a7fdfce92453932e2f75d51728934b` |
| Audit hosts | Windows 11 with Node.js `v24.18.0` and KiCad CLI `10.0.3`; Docker Linux probes with `node:22-bookworm-slim` and `node:24-bookworm-slim` |

## Pass/Fail Matrix

| Channel | Result | Evidence | Follow-up |
| --- | --- | --- | --- |
| npm metadata | Pass | `npm view boardreadyops@1.1.0` reports version `1.1.0`, `latest` dist-tag `1.1.0`, engines `^22.0.0 || ^24.0.0`, CLI bin `dist/cli/index.cjs`, and the integrity listed above. | None |
| npm clean install on Windows 11 | Pass | A temporary prefix install ran `boardreadyops --version`, `boardreadyops doctor --format json`, `boardreadyops schema config`, and `boardreadyops check . --fail-on never` from a separate consumer directory. JSON, SARIF, Markdown, HTML, and JUnit reports were generated. | None |
| npm clean install on Linux, Node 24 | Pass | `node:24-bookworm-slim` installed `boardreadyops@1.1.0`, reported Node `v24.18.0`, npm `11.13.0`, CLI version `1.1.0`, valid doctor JSON check groups, schema entries for `html` and `junit`, and all five report outputs. | None |
| npm clean install on Linux, Node 22 | Pass | `node:22-bookworm-slim` installed `boardreadyops@1.1.0`, reported Node `v22.22.3`, npm `10.9.8`, CLI version `1.1.0`, valid doctor JSON check groups, and all five report outputs. | None |
| npm tarball contents | Pass (historical) | `npm pack boardreadyops@1.1.0` produced `boardreadyops-1.1.0.tgz` with `dist/`, `schemas/`, `docs/`, `action.yml`, and `kicad-plugin/metadata.json`, plugin Python files, and icon resources. `kicad-plugin/` has since been retired (commit `68e21df`). | None |
| Public tag archive contents | Pass (historical) | `git ls-tree -r --name-only v1.1.0 -- kicad-plugin` lists `metadata.json`, `plugins/__init__.py`, `plugins/boardreadyops_plugin.py`, and `resources/icon.png`. `kicad-plugin/` has since been retired. | None |
| Public package parity with current docs | Pass | The public package accepts `boardreadyops doctor --format json`, accepts `report.html` and `report.junit.xml` in config, generates JSON, SARIF, Markdown, HTML, and JUnit reports. `kicad-plugin/` was included at `v1.1.0` and has since been retired from main. | None |
| GitHub Release binary asset list | Pass | `gh release view v1.1.0` lists Linux x64, Linux arm64, macOS x64, macOS arm64, Windows x64, `SHA256SUMS`, and `sbom.cyclonedx.json` assets. | [BOARD-63](https://linear.app/oaslananka/issue/BOARD-63/completion-follow-up-publish-binary-release-assets-and-homebrew) for installer OS matrix and Homebrew checksums. |
| GHCR full container image | Partial | Manual `container-build` run `26543611642` published `v1.1.0`, `v1`, and `latest` to the same OCI index digest `sha256:5258e7de0e25382894c70164e990820f78a7fdfce92453932e2f75d51728934b`; `docker buildx imagetools inspect` shows `linux/amd64` and `linux/arm64`; a runtime probe returned BoardReadyOps `1.1.0` and KiCad CLI `10.0.3`. | [BOARD-64](https://linear.app/oaslananka/issue/BOARD-64/completion-follow-up-make-ghcr-container-image-anonymously-pullable) for explicit anonymous logout validation and clean container Action workflow evidence. |
| Homebrew formula | Partial | `Formula/boardreadyops.rb` still contains fail-closed checksum placeholders. | [BOARD-63](https://linear.app/oaslananka/issue/BOARD-63/completion-follow-up-publish-binary-release-assets-and-homebrew) |
| KiCad PCM publication | Retired | The `kicad-plugin/` package was present in npm and the tag archive at `v1.1.0` but was removed from main in commit `68e21df`. The PCM plugin integration test and CLI profile have been retired. KiCad PCM distribution is no longer planned. | None |

## Tested Release Artifact List

| Artifact | Status |
| --- | --- |
| `boardreadyops@1.1.0` npm package | Present and clean-consumer tested on Windows 11 plus Linux Node 22 and 24 |
| `oaslananka/boardreadyops@41856e44bb2fc5def47a71072eccdad307301fc4` root action | Present in public tag archive |
| GitHub Release `v1.1.0` assets | Seven assets present: five binaries, `SHA256SUMS`, and `sbom.cyclonedx.json` |
| `boardreadyops-linux-x64` | Present, digest `sha256:d0d07dd0d34e1bf2f748449d7603345b9533068cb6730bf5a52cd432f1805e65` |
| `boardreadyops-linux-arm64` | Present, digest `sha256:664c52b4ab8a31e34a21b9e0fb5c5968a5ab0915826ee949286f462d281a09c1` |
| `boardreadyops-macos-x64` | Present, digest `sha256:1bd9e914f848ee0086c5cd3e2823117e28f5b3409a766ed0c6cfa7a736ffb2f0` |
| `boardreadyops-macos-arm64` | Present, digest `sha256:8b28c9d68d02390b8873b788efd0d94cd06c92a9dc956cff596de6b2fdc7ae85` |
| `boardreadyops-win-x64.exe` | Present, digest `sha256:e849be5213b1c1973c36d424a487a325b3e69e6744cff43e89c9120f3a6ce7fe` |
| `SHA256SUMS` | Present, digest `sha256:71657f4731259c30354f7d22fc841d03a321fc522020776a1c1ed9903a7129e0` |
| `sbom.cyclonedx.json` | Present, digest `sha256:c42813ec33eff55f0a267cdb38f8245ea51cd3f256acf53c56ea8e9ac4428eb9` |
| `ghcr.io/oaslananka/boardreadyops-full:v1.1.0` | Present, OCI index digest `sha256:5258e7de0e25382894c70164e990820f78a7fdfce92453932e2f75d51728934b` |
| `ghcr.io/oaslananka/boardreadyops-full:v1` | Present, same OCI index digest as `v1.1.0` |
| `ghcr.io/oaslananka/boardreadyops-full:latest` | Present, same OCI index digest as `v1.1.0` |
| `Formula/boardreadyops.rb` | Template only; checksum placeholders remain |
| `kicad-plugin/` public package artifact | Retired. Present at `v1.1.0`; removed from main in commit `68e21df`. |

## Terminal Transcript Summary

```text
$ npm view boardreadyops@1.1.0 version dist-tags engines bin dist.tarball dist.integrity --json
version: 1.1.0
dist-tags.latest: 1.1.0
engines.node: ^22.0.0 || ^24.0.0
bin.boardreadyops: dist/cli/index.cjs
integrity: sha512-fN0zRcKP1/fqW0/wYknBr+nh5HhZ7udpcfZoSqyNuRvinCdmvbQO9kOz/yG4KrqeHSzXuk0iMT5Fuw/YtchngQ==
```

```text
$ npm pack boardreadyops@1.1.0
filename: boardreadyops-1.1.0.tgz
shasum: c358e9cc8dd4cb5d63e466d1602cd901ad62d24b
total files: 106
included: package/dist/action/index.cjs, package/dist/cli/index.cjs,
package/schemas/config.schema.json, package/docs/release/channel-verification.md,
package/action.yml
```

```text
$ boardreadyops --version
1.1.0
$ boardreadyops doctor --format json
tool.version: 1.1.0
checks: runtime,kicad,adapters,repository,suppressions,action
$ boardreadyops check . --fail-on never
generated: findings.json, findings.sarif.json, report.md, report.html, report.junit.xml
```

```text
$ docker buildx imagetools inspect ghcr.io/oaslananka/boardreadyops-full:v1.1.0
Digest: sha256:5258e7de0e25382894c70164e990820f78a7fdfce92453932e2f75d51728934b
Platforms: linux/amd64, linux/arm64
$ docker run --rm --entrypoint boardreadyops ghcr.io/oaslananka/boardreadyops-full:v1.1.0 --version
1.1.0
$ docker run --rm --entrypoint kicad-cli ghcr.io/oaslananka/boardreadyops-full:v1.1.0 version
10.0.3
```

```text
$ gh run view 26543611642
workflow: container-build
conclusion: success
jobs: smoke (KiCad 9.0, Node 22.22.3), smoke (KiCad 10.0, Node 24.18.0), publish
artifact: boardreadyops-full-cyclonedx
```

## Completion Rule

npm, release binaries, `SHA256SUMS`, SBOM, Homebrew formula checksum data,
and anonymous GHCR manifest access for `v1.4.6`, `v1`, and `latest` are
verified as of 2026-06-19. All three tags resolve to `sha256:03eea649a1968e67fdb91f9c53e97e040bee3ca481f2b5ec79a8b8b3a11f299a`. The `kicad-plugin/`
directory was retired from main in commit `68e21df`.
