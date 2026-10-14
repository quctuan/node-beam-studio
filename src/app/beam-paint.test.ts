import { describe, expect, it } from "vitest";
import { getBeamColor, getBeamExposure, getBeamNodeRect, getBeamPhase, getBeamSceneRect, sampleBeamPerimeter } from "./beam-paint";
import { resolveBeamSettings } from "./beam-types";
import { beamPerformancePaths, beamRenderPlanAssessment } from "./app-performance";
import { referenceHue, referenceOrbitSeconds, referenceTransportSeconds, referenceWindow, referenceField } from "./beam-reference";
const settings = resolveBeamSettings({});
describe("beam continuity", () => {
  it("joins the first and last optical frame at every selectable speed and rhythm", () => {
    for (let speed = .25; speed <= 3; speed += .25) for (const easing of ["linear", "ease"] as const) {
      const config = { ...settings, speed, easing };
      expect(getBeamPhase(0, config)).toBe(getBeamPhase(1, config));
      expect(getBeamExposure(.4, getBeamPhase(0, config), config)).toBe(getBeamExposure(.4, getBeamPhase(1, config), config));
    }
  });
  it("advances without reversal during an eased circuit", () => {
    const phases = Array.from({ length: 200 }, (_, i) => getBeamPhase(i / 200 / 6, { ...settings, speed: .25, easing: "ease" }));
    for (let i = 1; i < phases.length; i++) expect(phases[i]).toBeGreaterThan(phases[i - 1]);
  });
  it("closes rounded and circular paths without a corner jump", () => {
    for (const shape of ["rounded", "rectangle", "circle"] as const) {
      const points = sampleBeamPerimeter({ ...settings, shape });
      expect(points[0].x).toBeCloseTo(points.at(-1)!.x, 8);
      expect(points[0].y).toBeCloseTo(points.at(-1)!.y, 8);
      const steps = points.slice(1).map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
      expect(Math.max(...steps) / Math.min(...steps)).toBeLessThan(shape === "rectangle" ? 1.5 : 1.02);
    }
  });
  it("keeps the head of the inward light at the border head", () => {
    for (const phase of [0, .2, .5, .999]) {
      expect(getBeamExposure(phase + .66, phase, settings)).toBe(1);
      expect(getBeamExposure(phase + .16, phase, settings)).toBe(0);
    }
  });
  it("retains the approved 1.96-second angular cadence at every Speed", () => {
    for (let speed = .25; speed <= 3; speed += .25) {
      const config = { ...settings, speed };
      const halfOrbit = referenceOrbitSeconds / speed / 2;
      expect(getBeamPhase(halfOrbit / referenceTransportSeconds, config)).toBeCloseTo(.5, 10);
    }
  });
  it("uses the original wide conic window rather than an arc-length head", () => {
    expect(referenceWindow(.3, 0)).toBeCloseTo(0, 12);
    expect(referenceWindow(.44, 0)).toBeCloseTo(.35, 10);
    expect(referenceWindow(.66, 0)).toBe(1);
    expect(referenceWindow(.95, 0)).toBeCloseTo(0, 12);
    expect(referenceWindow(.66, .5)).toBeCloseTo(0, 12);
  });
  it("sways hue gently and joins both optical clocks at the transport seam", () => {
    expect(referenceHue(0, referenceTransportSeconds)).toBeCloseTo(-30, 6);
    expect(referenceHue(.125, referenceTransportSeconds)).toBeCloseTo(30, 6);
    expect(referenceHue(1, referenceTransportSeconds)).toBe(referenceHue(0, referenceTransportSeconds));
  });
  it("keeps the original color locations stationary as the window rotates", () => {
    const config = { ...settings, palette: "spectrum" as const };
    const first = referenceField(config, -182, 70, 380, 380, .1, .1, 0);
    const second = referenceField(config, -182, 70, 380, 380, .1, .2, 0);
    expect(first).toEqual(second);
    expect(first[3]).toBeGreaterThan(0);
  });
  it("includes the entire thick border in finite scene bounds", () => {
    const config = { ...settings, aspect: "portrait" as const, borderWidth: 8 };
    const node = getBeamNodeRect(config), scene = getBeamSceneRect(config);
    expect(scene.x).toBeLessThan(node.x - config.borderWidth / 2);
    expect(scene.width).toBeGreaterThan(node.width + config.borderWidth);
    expect(scene.height).toBeGreaterThan(node.height + config.borderWidth);
  });
  it("retains a true circle regardless of the dormant aspect ratio", () => {
    const node = getBeamNodeRect({ ...settings, shape: "circle", aspect: "portrait" });
    expect(node.height).toBe(node.width);
  });
  it("honors custom stop opacity instead of replacing it with white light", () => {
    const color = getBeamColor({ ...settings, palette: "custom", gradient: { gradientType: "angular", angle: 0, stops: [{ color: "#FF0000", opacity: 20, position: "0%" }, { color: "#0000FF", opacity: 80, position: "100%" }] } }, { x: 0, y: -190, t: .5 });
    expect(color).toEqual([127.5, 0, 127.5, .5]);
  });
  it("beam performance paths compile", () => {
    expect(beamRenderPlanAssessment.errors).toEqual([]);
    expect(beamPerformancePaths.length).toBeGreaterThan(5);
    expect(beamPerformancePaths.some(path => path.interaction === "timeline-playback")).toBe(true);
    expect(beamPerformancePaths.some(path => path.interaction === "export")).toBe(true);
  });
});
