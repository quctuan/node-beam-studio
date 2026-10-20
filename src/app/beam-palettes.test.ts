import { expect, test } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";
import { createToolcraftSettingsPayload, parseToolcraftSettingsPayload } from "@/toolcraft/runtime/react";
import { appSchema } from "./app-schema";
import { beamPaletteGradientTargets, beamPaletteGradients, resolveBeamSettings } from "./beam-types";
import { getBeamColor, getBeamOpticalSample, getBeamNodeRect } from "./beam-paint";
import { createBeamHandoff } from "./beam-handoff";

const edited = {
  gradientType: "angular" as const, angle: 0,
  stops: [{ color: "#FF0000", opacity: 40, position: "0%" }, { color: "#0000FF", opacity: 80, position: "80%" }],
};
for (const [palette, target] of Object.entries(beamPaletteGradientTargets)) {
  test(`${palette} preserves its own complete edited gradient through native settings and handoff`, () => {
    const state = createToolcraftState(appSchema);
    state.values["beam.palette"] = palette;
    state.values[target] = edited;
    const snapshot = JSON.parse(JSON.stringify(createToolcraftSettingsPayload(state)));
    expect(parseToolcraftSettingsPayload(appSchema, snapshot)).not.toBeNull();
    expect(snapshot.values[target]).toEqual(edited);
    const settings = resolveBeamSettings(snapshot.values);
    expect(settings.gradient).toEqual(edited);
    const color = getBeamColor(settings, { x: 0, y: 0, t: .4 });
    [127.5, 0, 127.5, .6].forEach((channel, index) => expect(color[index]).toBeCloseTo(channel, 10));
    const sample = getBeamOpticalSample(settings, { x: 0, y: 0, t: .4 }, .4, 27, getBeamNodeRect(settings));
    expect(sample.color).toEqual(getBeamColor(settings, { x: 0, y: 0, t: .4 }));
    expect(createBeamHandoff(snapshot.values).optics.colorField.gradient).toEqual(edited);
    for (const [other, otherTarget] of Object.entries(beamPaletteGradientTargets)) {
      if (other !== palette) expect(resolveBeamSettings({ ...snapshot.values, "beam.palette": other }).gradient)
        .toEqual(beamPaletteGradients[other as keyof typeof beamPaletteGradients]);
      expect(snapshot.values[otherTarget]).toBeDefined();
    }
    expect(resolveBeamSettings({ ...snapshot.values, "beam.palette": palette }).gradient).toEqual(edited);
  });
}

test("Fiora exactly adopts the current saved Custom pink linear setup", () => {
  expect(beamPaletteGradients.fiora).toEqual({
    gradientType: "linear", angle: 0,
    stops: [{ color: "#EC379A", opacity: 100, position: "0%" }, { color: "#F58FC5", opacity: 100, position: "100%" }],
  });
});

test("older Custom settings keep their gradient and seed missing named palettes", () => {
  const old = { "beam.palette": "custom", "beam.gradient": edited };
  const parsed = parseToolcraftSettingsPayload(appSchema, {
    ...createToolcraftSettingsPayload(createToolcraftState(appSchema)), values: old,
  });
  expect(parsed).not.toBeNull();
  expect(resolveBeamSettings(old).gradient).toEqual(edited);
  expect(resolveBeamSettings({ ...old, "beam.palette": "fiora" }).gradient).toEqual(beamPaletteGradients.fiora);
});
