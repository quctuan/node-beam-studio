import { expect, test } from "vitest";
import { appSchema } from "./app-schema";
import { appProductReadiness } from "./app-acceptance-data";
import { beamPerformancePaths, beamPipelineRegistration, beamRenderPlanAssessment } from "./app-performance";
import { withSettingsFooter } from "./beam-panel-presentation";

test("native settings footer retains JSON and excludes image export", () => {
  const presentation = withSettingsFooter(appSchema);
  const original = appSchema.panels.controls!.sections[0]!;
  const sections = presentation.panels.controls!.sections;
  expect(sections.at(-1)).toMatchObject({ id: "runtime.defaults", actionGroup: "secondary" });
  expect(sections.at(-1)!.controls).toBe(original.controls);
  expect(sections.filter(section => section.id === "runtime.defaults")).toHaveLength(1);
  expect(presentation.settingsTransfer).toBe(appSchema.settingsTransfer);
  expect(presentation.settingsTransfer).toMatchObject({ enabled: true, fileName: "node-beam-preset.json" });
  expect(appSchema.panels.controls!.sections[0]).toBe(original);
  expect(original.actionGroup).toBeUndefined();
  expect(sections.flatMap(section => Object.values(section.controls)).some(control => control.target.startsWith("export.image."))).toBe(false);
  expect(appSchema.modulePlan.capabilities.map(capability => capability.capabilityId).some(id => id.startsWith("artifact."))).toBe(false);
  expect(appProductReadiness).toMatchObject({ mode: "product", exportIntent: { image: { mode: "user-removed", evidence: { quote: "Bỏ tính năng export PNG đi, ko cần thiết" } } } });
  expect(beamPipelineRegistration.passes.some(pass => pass.kind === "export")).toBe(false);
  expect(beamPerformancePaths.some(path => path.interaction === "export")).toBe(false);
  expect(beamRenderPlanAssessment.errors).toEqual([]);
});
