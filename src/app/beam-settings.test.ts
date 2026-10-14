import { describe, expect, test } from "vitest";

import { beamSections } from "./beam-schema";
import { beamDefaults, beamTargets, resolveBeamSettings } from "./beam-types";

const customGradient = {
  angle: 72,
  gradientType: "linear" as const,
  stops: [
    { color: "#EF346C", position: "0%", opacity: 100 },
    { color: "#305EFA", position: "24%", opacity: 45 },
    { color: "#20C1B2", position: "79%", opacity: 82 },
    { color: "#F1A52B", position: "100%", opacity: 10 },
  ],
};

const settingsCases = [
  { target: beamTargets.theme, field: "theme", type: "segmented", edited: "dark" },
  { target: beamTargets.shape, field: "shape", type: "select", edited: "circle" },
  { target: beamTargets.aspect, field: "aspect", type: "segmented", edited: "portrait" },
  { target: beamTargets.width, field: "width", type: "slider", edited: 640 },
  { target: beamTargets.radius, field: "radius", type: "slider", edited: 48 },
  { target: beamTargets.motion, field: "motion", type: "segmented", edited: "breathing" },
  { target: beamTargets.speed, field: "speed", type: "slider", edited: 2.25 },
  { target: beamTargets.easing, field: "easing", type: "segmented", edited: "ease" },
  { target: beamTargets.palette, field: "palette", type: "select", edited: "custom" },
  { target: beamTargets.gradient, field: "gradient", type: "gradient", edited: customGradient },
  { target: beamTargets.style, field: "style", type: "segmented", edited: "neon" },
  { target: beamTargets.borderWidth, field: "borderWidth", type: "slider", edited: 5.5 },
  { target: beamTargets.spread, field: "spread", type: "slider", edited: 80 },
  { target: beamTargets.intensity, field: "intensity", type: "slider", edited: 25 },
  { target: beamTargets.blur, field: "blur", type: "slider", edited: 22 },
  { target: beamTargets.background, field: "background", type: "color", edited: "#253042" },
] as const;

for (const { target, field, type, edited } of settingsCases) {
test(`${target} has a canonical editable product contract`, () => {
  const control = beamSections.flatMap((section) => Object.values(section.controls)).find((entry) => entry.target === target);
  expect(control, "Every accepted product operation has one schema-owned control").toBeDefined();
  expect(control?.type).toBe(type);
  expect(control?.defaultValue).toEqual(beamDefaults[field]);
  const input: Record<string, unknown> = { [target]: edited, ...(target === beamTargets.gradient ? { [beamTargets.palette]: "custom" } : {}) };
  const settings = resolveBeamSettings(input);
  expect(settings[field], "The renderer receives the exact canonical edited value").toEqual(edited);
  expect(input[target], "Reading settings must not overwrite runtime or hidden values").toEqual(edited);
});
}

describe("Node beam canonical settings", () => {
  test("retains every authored gradient stop, position and opacity without flattening colors", () => {
    const settings = resolveBeamSettings({ [beamTargets.palette]: "custom", [beamTargets.gradient]: customGradient });
    expect(settings.gradient).toBe(customGradient);
    expect(settings.gradient.stops.map((stop) => stop.opacity)).toEqual([100, 45, 82, 10]);
    expect(settings.gradient.stops.map((stop) => stop.position)).toEqual(["0%", "24%", "79%", "100%"]);
    expect(settings.colors).toEqual(["#EF346C", "#305EFA", "#20C1B2", "#F1A52B"]);
  });

  test("preserves ratio and rounded radius through Circle and timing through Static", () => {
    const values = {
      [beamTargets.shape]: "circle", [beamTargets.aspect]: "portrait", [beamTargets.radius]: 48,
      [beamTargets.motion]: "static", [beamTargets.speed]: 2.25, [beamTargets.easing]: "ease",
    };
    const hidden = resolveBeamSettings(values);
    const restored = resolveBeamSettings({ ...values, [beamTargets.shape]: "rounded", [beamTargets.motion]: "orbit" });
    expect(hidden).toMatchObject({ shape: "circle", aspect: "portrait", radius: 48, motion: "static", speed: 2.25, easing: "ease" });
    expect(restored).toMatchObject({ shape: "rounded", aspect: "portrait", radius: 48, motion: "orbit", speed: 2.25, easing: "ease" });
    expect(values[beamTargets.shape]).toBe("circle");
    expect(values[beamTargets.motion]).toBe("static");
  });

  test("uses the Fiora four-color spectrum and visible 380px Light node at reference speed", () => {
    expect(resolveBeamSettings({})).toMatchObject({
      theme: "light", shape: "rounded", width: 380, radius: 16, motion: "orbit", speed: 1,
      borderWidth: 2, palette: "fiora", colors: ["#ED3696", "#AF52E8", "#5984F3", "#28C4E7"],
      includeBackground: false,
    });
  });

  test("every reachable Speed closes at the reference transport seam", () => {
    const speed = beamSections.flatMap((section) => Object.values(section.controls)).find((entry) => entry.target === beamTargets.speed);
    expect(speed?.type).toBe("slider");
    if (speed?.type !== "slider") throw new Error("Speed must be a schema slider.");
    expect({ min: speed.min, max: speed.max, step: speed.step }).toEqual({ min: 0.25, max: 3, step: 0.25 });
    for (let value = 0.25; value <= 3; value += 0.25) {
      expect(Number.isInteger(resolveBeamSettings({ [beamTargets.speed]: value }).speed * 24)).toBe(true);
    }
  });

  test("rejects callback-shaped and non-finite inputs rather than changing the canonical value model", () => {
    expect(resolveBeamSettings({ [beamTargets.background]: { hex: "#121212" }, [beamTargets.width]: Number.POSITIVE_INFINITY, [beamTargets.speed]: "2.5" }))
      .toMatchObject({ background: "#F6F7F8", width: 380, speed: 1 });
  });
});
