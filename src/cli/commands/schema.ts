import agentPlanSchema from "../../../schemas/agent-plan.schema.json" with { type: "json" };
import configSchema from "../../../schemas/config.schema.json" with { type: "json" };
import doctorSchema from "../../../schemas/doctor.schema.json" with { type: "json" };
import findingsSchema from "../../../schemas/findings.schema.json" with { type: "json" };
import generateRecipeSchema from "../../../schemas/generate-recipe.schema.json" with { type: "json" };
import hbomSchema from "../../../schemas/hbom.schema.json" with { type: "json" };
import pinmapSchema from "../../../schemas/pinmap.schema.json" with { type: "json" };

export function schemaCommand(name: string | undefined, streams: { stdout: NodeJS.WritableStream }): number {
  const schema =
    name === "agent-plan" || name === "plan"
      ? agentPlanSchema
      : name === "doctor"
        ? doctorSchema
        : name === "findings"
          ? findingsSchema
          : name === "hbom"
            ? hbomSchema
            : name === "pinmap"
              ? pinmapSchema
              : name === "generate"
                ? generateRecipeSchema
                : configSchema;
  streams.stdout.write(`${JSON.stringify(schema, null, 2)}\n`);
  return 0;
}
