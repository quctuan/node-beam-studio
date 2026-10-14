import { expect, test } from "vitest";
import { buildSync } from "esbuild";
import { createToolcraftSettingsPayload, parseToolcraftSettingsPayload } from "@/toolcraft/runtime/react";
import { createToolcraftState } from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { beamHandoffTarget, createBeamHandoff, createPreviewHtml } from "./beam-handoff";
import { getBeamPhase } from "./beam-paint";
import { referenceHue, referenceTransportSeconds } from "./beam-reference";
import { resolveBeamSettings } from "./beam-types";

test("developer handoff supplies effective motion and exact renderer", () => {
  const doc = createBeamHandoff({});
  expect(doc.motion.rotationPeriodSeconds).toBeCloseTo(1.96, 8);
  expect(doc.motion.hue.periodSeconds).toBeCloseTo(11.76, 8);
  expect(doc.optics.inwardGlow.effectiveReachPx).toBeCloseTo(47.2, 8);
  expect(doc.motion.keyframes.rotation).toHaveLength(33);
  for (const frame of doc.motion.keyframes.rotation) {
    expect(frame.phase).toBeCloseTo(getBeamPhase(frame.timeSeconds / referenceTransportSeconds, resolveBeamSettings({}), referenceTransportSeconds), 8);
  }
  for (const frame of doc.motion.keyframes.hue) expect(frame.hueDegrees).toBeCloseTo(referenceHue(frame.timeSeconds / referenceTransportSeconds, referenceTransportSeconds), 8);
  const build = buildSync({ entryPoints: ["src/app/beam-runtime-entry.ts"], bundle: true, write: false, format: "iife", globalName: "NodeBeam", target: "es2020", minify: true });
  expect(doc.implementation.javascript).toBe(build.outputFiles[0].text);
});

test("developer handoff handles retiming static custom and zero glow", () => {
  const retimed = createBeamHandoff({ "beam.speed": 2, "beam.easing": "ease" }, 10);
  expect(retimed.motion.turnsPerTransport).toBe(10);
  expect(retimed.motion.rotationPeriodSeconds).toBe(1);
  const curve = retimed.motion.keyframes.rotation;
  expect(curve[8].unwrappedAngleDegrees).toBeLessThan(90);
  expect(curve[24].unwrappedAngleDegrees).toBeGreaterThan(270);
  for (let index = 1; index < curve.length; index++) expect(curve[index].unwrappedAngleDegrees).toBeGreaterThan(curve[index - 1].unwrappedAngleDegrees);
  const still = createBeamHandoff({ "beam.motion": "static", "beam.spread": 0 });
  expect(still.motion.rotationPeriodSeconds).toBeNull();
  expect(still.motion.hue.active).toBe(false);
  expect(still.motion.keyframes.rotation).toEqual([{ timeSeconds: 0, phase: 0.18, unwrappedAngleDegrees: 64.8 }]);
  expect(still.optics.inwardGlow.enabled).toBe(false);
  const custom = createBeamHandoff({ "beam.palette": "custom" });
  expect(custom.motion.hue.active).toBe(false);
  expect(custom.optics.colorField).toMatchObject({ filterApplied: false, saturation: 1, brightness: 1, carrierStops: [] });
  expect(createBeamHandoff({ "beam.palette": "spectrum" }).optics.colorField.spots[0].color).toBe("#FF3264");
});

test("native JSON carries fresh motion data without breaking older presets", () => {
  const state = createToolcraftState(appSchema);
  const document = createBeamHandoff(state.values, state.timeline.durationSeconds, state.timeline.isLooping);
  state.values[beamHandoffTarget] = document;
  const payload = createToolcraftSettingsPayload(state);
  expect(payload.values[beamHandoffTarget]).toBe(document);
  expect(parseToolcraftSettingsPayload(appSchema, JSON.parse(JSON.stringify(payload)))).not.toBeNull();
  delete payload.values[beamHandoffTarget];
  expect(parseToolcraftSettingsPayload(appSchema, payload)).not.toBeNull();
  expect(createPreviewHtml(resolveBeamSettings({}), referenceTransportSeconds)).toContain("NodeBeam.mount");
});

test("developer copy commands use native actions", () => {
  const section = appSchema.panels.controls!.sections.find(section => section.id === "beam-handoff")!;
  expect(section.controls.copy.type).toBe("actions");
  expect(section.controls.copy.actions?.map(action => typeof action === "string" ? action : action.value)).toEqual(["beam.copyHtml", "beam.copySpec"]);
});
