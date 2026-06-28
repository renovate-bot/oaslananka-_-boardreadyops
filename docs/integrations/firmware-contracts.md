# Firmware contracts

BoardReadyOps can compare firmware-facing pin assignments with the hardware pinmap so firmware releases do not drift from the board that is being fabricated.

The first supported ecosystem is a PlatformIO-style pin assignment file referenced from `boardreadyops.yml`. PlatformIO projects use `platformio.ini` as their project configuration file, while BoardReadyOps keeps the pin contract in a small YAML file so teams can review it in CI without changing the build system.

```yaml
version: 1
projects:
  - path: .
    pinmap: pins.yml
    firmware:
      platformio:
        pinAssignments: firmware/platformio-pins.yml
rules:
  firmware.platformio-pin-contract:
    enabled: true
```

The contract maps firmware signal names to the expected hardware pin and, optionally, the expected net and firmware pin identifier:

```yaml
version: 1
pins:
  LED_STATUS:
    hardware: U1.PA1
    net: LED_STATUS
    pin: GPIO2
```

The pinmap entry should use the same `firmware` signal name:

```yaml
version: 1
pins:
  - designator: U1
    pin: PA1
    net: LED_STATUS
    firmware: LED_STATUS
```

The rule emits actionable findings for mismatched hardware pins, mismatched nets, firmware-only signals, and hardware signals missing from the firmware contract. Findings include both source paths in `details.sources` so reviewers can see the hardware and firmware sides of the mismatch.

## Adapter ecosystem

Firmware ecosystems are pluggable. Each adapter implements the `FirmwareContractAdapter` interface in `src/firmware/contract.ts` — it loads an ecosystem-specific file into the shared `FirmwareContract` model (`{ version, pins: [{ signal, hardware, net?, pin?, environment? }] }`). A single comparison helper (`compareFirmwareContract`) then checks any adapter's contract against the hardware pinmap, so every ecosystem reports identical, actionable findings.

Two adapters ship today:

- **PlatformIO** (`firmware.platformio`): the YAML contract shown above.
- **Arduino / C header** (`firmware.arduino`): a `#define` pin header, prototyping the adapter model for C-based firmware.

```yaml
version: 1
projects:
  - path: .
    pinmap: pins.yml
    firmware:
      arduino:
        pinAssignments: firmware/pins.h
rules:
  firmware.arduino-pin-contract:
    enabled: true
```

The Arduino header maps signal macros to hardware pins, with optional `net=`, `pin=`, and `env=` metadata in a trailing comment:

```c
#define LED_STATUS U1.PA1   // net=LED_STATUS pin=GPIO2
#define I2C_SDA    U1.PA2
```

To add another ecosystem (Zephyr devicetree, ESP-IDF/Kconfig-style assignments, STM32CubeMX `.ioc`, or Rust embedded board crates), implement a new `FirmwareContractAdapter`, expose it through a thin rule that reuses `runFirmwareContractRule`, and add its `firmware.<ecosystem>` config key — no changes to the comparison logic are required.
