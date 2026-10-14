import { expect, test } from "vitest";
import { beamRenderPlanAssessment } from "./app-performance";
import { createToolcraftState } from "@/toolcraft/runtime";
import { createToolcraftSettingsPayload, parseToolcraftSettingsPayload } from "@/toolcraft/runtime/react";
import { appSchema } from "./app-schema";
import { beamTrailProfile, getBeamTrailAnchors, getBeamTrailFrame, getBeamOpticalSample, getBeamPhase, getBeamTrailExposure, sampleBeamPerimeter } from "./beam-paint";
import { createBeamHandoff } from "./beam-handoff";
import { captureSharedSettings } from "./beam-shared-default";
import { resolveBeamSettings } from "./beam-types";
import { referenceTransportSeconds, referenceWindow } from "./beam-reference";
import { validateSharedSettings } from "../../server/shared-default-validation";

test("trail reuses the structurally valid retained painter pipeline", () => {
  expect(beamRenderPlanAssessment.errors).toEqual([]);
});

test("trail splits at left converges at right and fades completely", () => {
  const left = .75, right = .25;
  expect(getBeamTrailFrame(0)).toMatchObject({ progress: 0, opacity: 0 });
  expect(getBeamTrailExposure(left, .02, left)).toBeGreaterThan(.1);
  expect(getBeamTrailExposure(right, .02, left)).toBe(0);
  const split = getBeamTrailFrame(.4);
  expect(split.progress).toBeCloseTo(.5, 10);
  expect(getBeamTrailExposure(0, .4, left)).toBeCloseTo(split.opacity, 10);
  expect(getBeamTrailExposure(.5, .4, left)).toBeCloseTo(split.opacity, 10);
  expect(getBeamTrailExposure(left, .4, left)).toBe(0);
  expect(getBeamTrailExposure(right, .4, left)).toBe(0);
  const merged = getBeamTrailFrame(beamTrailProfile.travelEnd);
  expect(merged.progress).toBe(1);
  // The merge is one shared exposure, never doubled brightness.
  expect(getBeamTrailExposure(right, beamTrailProfile.travelEnd, left)).toBeCloseTo(merged.opacity, 10);
  expect(getBeamTrailExposure(right, .86, left)).toBeLessThan(merged.opacity);
  for (const phase of [.94, .96, 1]) for (let i = 0; i <= 1000; i++) expect(getBeamTrailExposure(i / 1000, phase, left)).toBe(0);
});

test("trail midpoint geometry and shared light stay correct across every node shape and ratio", () => {
  for (const shape of ["rounded", "rectangle", "circle"] as const) for (const aspect of ["square", "wide", "portrait"] as const) {
    const settings = resolveBeamSettings({ "beam.motion": "trail", "beam.shape": shape, "beam.aspect": aspect, "beam.radius": 32 });
    const anchors = getBeamTrailAnchors(settings);
    const points = sampleBeamPerimeter(settings, 4096);
    const node = { x: 0, y: 0, width: settings.width, height: settings.shape === "circle" || settings.aspect === "square" ? settings.width : settings.aspect === "wide" ? settings.width * 9 / 16 : settings.width * 4 / 3 };
    const at = (t: number) => points[Math.round(((t % 1) + 1) % 1 * 4096)];
    expect(at(anchors.left).x).toBeCloseTo(-node.width / 2, 1);
    expect(Math.abs(at(anchors.left).y)).toBeLessThan(.3);
    expect(at(anchors.right).x).toBeCloseTo(node.width / 2, 1);
    expect(Math.abs(at(anchors.right).y)).toBeLessThan(.3);
    expect(at(anchors.left + .25).y).toBeCloseTo(-node.height / 2, 1);
    expect(at(anchors.left - .25).y).toBeCloseTo(node.height / 2, 1);
    for (const phase of [.02, .4, .76, .86, .96]) {
      for (const point of points.filter((_, index) => index % 16 === 0)) {
        expect(getBeamOpticalSample(settings, point, phase, 0, node).exposure).toBe(getBeamTrailExposure(point.t, phase, anchors.left));
      }
    }
  }
  const orbit = resolveBeamSettings({});
  for (const point of sampleBeamPerimeter(orbit)) {
    const angle = ((Math.atan2(point.y, point.x) / (Math.PI * 2) + .25) % 1 + 1) % 1;
    expect(getBeamOpticalSample(orbit, point, .28, 0, { x: 0, y: 0, width: 380, height: 380 }).exposure).toBe(referenceWindow(angle, .28));
  }
});

test("trail speed and rhythm preserve forward laps and the transport seam", () => {
  for (const duration of [2, 10, referenceTransportSeconds]) for (const speed of [.25, 1, 1.5, 3]) for (const easing of ["linear", "ease"] as const) {
    const settings = resolveBeamSettings({ "beam.motion": "trail", "beam.speed": speed, "beam.easing": easing });
    const turns = Math.max(1, Math.round(duration / 1.96 * speed));
    let previous = -1;
    for (let index = 0; index < 100; index++) {
      const phase = getBeamPhase(index / 100 / turns, settings, duration);
      expect(phase).toBeGreaterThan(previous); previous = phase;
    }
    expect(getBeamPhase(0, settings, duration)).toBe(getBeamPhase(1, settings, duration));
    for (const position of [0, .1, .45, .8, 1]) {
      expect(getBeamTrailExposure(position, getBeamPhase(0, settings, duration))).toBe(getBeamTrailExposure(position, getBeamPhase(1, settings, duration)));
    }
  }
});

test("trail saves canonical native and shared snapshots with a precise developer specification", () => {
  const state = createToolcraftState(appSchema);
  state.values["beam.motion"] = "trail";
  state.values["beam.speed"] = 1.5;
  const payload = createToolcraftSettingsPayload(state);
  const restored = parseToolcraftSettingsPayload(appSchema, JSON.parse(JSON.stringify(payload)));
  expect(restored?.values["beam.motion"]).toBe("trail");
  const shared = captureSharedSettings(state);
  expect(validateSharedSettings(shared)?.values["beam.motion"]).toBe("trail");
  const doc = createBeamHandoff(state.values, state.timeline.durationSeconds);
  expect(doc.motion).toMatchObject({ coordinate: "two-half-perimeter-paths", trail: { count: 2, length: .1 }, hue: { active: false }, effectiveAngularDegreesPerSecond: null });
  expect(doc.motion.trail!.averagePixelsPerSecond).toBeCloseTo(doc.motion.trail!.perimeterPx / 2 / doc.motion.trail!.travelSeconds);
  expect(doc.motion.keyframes.perimeter).toHaveLength(33);
  expect(doc.motion.keyframes.perimeter.at(-1)!).toMatchObject({ progress: 1, opacity: 0 });
  expect(doc.motion.trail).toMatchObject({ source: "left-midpoint", destination: "right-midpoint", pathDirections: ["clockwise-upper", "counterclockwise-lower"] });
  expect(doc.motion.keyframes.rotation).toEqual([]);
  expect(doc.optics.border.baseTrackAlpha).toBe(0);
  expect(doc.optics.colorField).toMatchObject({ kind: "authored-gradient", filterApplied: false, carrierStops: [], spots: [] });
});
