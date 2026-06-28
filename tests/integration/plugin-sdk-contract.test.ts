import { describe, expect, it } from "vitest";
import { definePlugin, type PluginFinding } from "../../packages/plugin-sdk/src/index.js";

describe("Plugin SDK Contract Verification", () => {
  it("defines and registers a compliant plugin rule with correct type mapping", () => {
    const plugin = definePlugin({
      name: "boardreadyops-plugin-contract-test",
      version: "1.0.0",
      permissions: ["fs:read"],
      rules: [
        {
          meta: {
            id: "contract.test-rule",
            title: "Contract Test Rule",
            description: "Verifies the SDK boundary types match core types.",
            rationale: "Ensures no compilation drift.",
            defaultSeverity: "medium",
            appliesTo: ["pcb"],
            configKeys: [],
            kicadVersions: ["10"],
            tags: ["test"],
          },
          run(context) {
            expect(context.root).toBeDefined();
            expect(context.projects).toBeDefined();
            expect(context.logger).toBeDefined();

            const finding: PluginFinding = {
              ruleId: "contract.test-rule",
              severity: "medium",
              message: "Contract verification finding",
              resource: {
                path: "board.kicad_pcb",
                kind: "pcb",
              },
            };
            return [finding];
          },
        },
      ],
    });

    expect(plugin.name).toBe("boardreadyops-plugin-contract-test");
    const rules = plugin.rules ?? [];
    expect(rules).toHaveLength(1);
    expect(rules[0]?.meta.id).toBe("contract.test-rule");
  });
});
