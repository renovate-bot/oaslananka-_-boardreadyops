# Manufacturer Handoff Package

`boardreadyops release handoff [path]` assembles a clean, vendor-specific package intended for fabrication and assembly handoff. It discovers the manufacturing outputs already present in the project, lays them out in a predictable directory structure for the receiver, writes a README and a package manifest, and reports any required outputs that are missing for the selected vendor profile.

```bash
boardreadyops release handoff . --profile jlcpcb --output build/boardreadyops-handoff
```

The [JLCPCB profile](../vendor-profiles.md) is the default and is covered first; `pcbway` and `oshpark` are also available. Use `--profile <id>` to select another profile and `--service <service>` to override the assumed service (`fabrication`, `assembly`, or `fabrication+assembly`).

## Package layout

The package uses a stable, vendor-agnostic directory layout so the receiver always finds outputs in the same place:

```text
build/boardreadyops-handoff/
├── README.md                 # receiver-facing summary
├── handoff-manifest.json     # structured package record
├── gerbers/                  # gerber outputs
├── drill/                    # drill outputs
├── bom/                      # bill of materials
├── assembly/                 # placement / CPL outputs
└── documentation/            # PDF and STEP outputs
```

Each discovered file is assigned to exactly one output kind (the vendor profile's required kinds first, then any extras) so a file is never copied twice, and target names are disambiguated on collision. Output discovery, file ordering, and the manifest are deterministic, which keeps the package stable enough to diff and publish from CI.

## Manifest

`handoff-manifest.json` records:

- `tool`: the BoardReadyOps name and version
- `generatedAt`: ISO 8601 generation time
- `vendor`: the resolved profile id, name, and service
- `decision`: `ready` when every required output is present, otherwise `incomplete` with the list of `missingOutputs`
- `requiredOutputs` and `includedOutputs`
- `assumptions`: the vendor profile's conservative defaults and caveats
- `files`: every copied file with its `output` kind, original `source`, package-relative `target`, `sha256` digest, and `bytes`

## Required output checks

The command compares the discovered outputs against the vendor profile's required outputs. When any required output is missing it is listed in the manifest decision and the README, and the command exits with code `1` so a CI job can block the handoff. When all required outputs are present the command exits `0`.

```bash
boardreadyops release handoff . --profile jlcpcb --format json
```

Pass `--format json` to print the manifest to stdout for further processing.
