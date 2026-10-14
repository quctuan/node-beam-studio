import type { ResolvedToolcraftAppSchema } from "@/toolcraft/runtime";

/** Move the existing native control into Panel's footer without replacing its codec or UI. */
export function withSettingsFooter(schema: ResolvedToolcraftAppSchema): ResolvedToolcraftAppSchema {
  const controls = schema.panels.controls;
  if (!controls) return schema;
  const settings = controls.sections.find(section => section.id === "runtime.defaults");
  if (!settings) return schema;
  return Object.freeze({
    ...schema,
    panels: Object.freeze({
      ...schema.panels,
      controls: Object.freeze({
        ...controls,
        sections: Object.freeze([
          ...controls.sections.filter(section => section !== settings),
          Object.freeze({ ...settings, actionGroup: "secondary" as const }),
        ]),
      }),
    }),
  });
}
