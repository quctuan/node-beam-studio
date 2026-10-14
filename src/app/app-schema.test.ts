import { describe, expect, it } from "vitest";
import { appAcceptance, appProductReadiness, appTransferMode, validateProductAcceptanceCoverage } from "./app-acceptance";
import { appSchema } from "./app-schema";
import { beamDefaults, beamTargets, resolveBeamSettings } from "./beam-types";
import { referenceTransportSeconds } from "./beam-reference";

const control = (target: string) => appSchema.panels.controls?.sections.flatMap(section => Object.values(section.controls)).find(entry => entry.target === target);

describe("Node Beam Studio product contract", () => {
  it("background preserves native preview ownership", () => {
    expect(control("export.includeBackground")).toMatchObject({ type: "switch", defaultValue: false });
    expect(control("beam.background")).toMatchObject({ type: "color", defaultValue: "#F6F7F8" });
    expect(appSchema.panels.controls?.sections.some(section => section.title === "Background")).toBe(false);
    expect(appProductReadiness).toMatchObject({ exportIntent: { image: { mode: "user-removed" }, video: { mode: "not-requested" }, svg: { mode: "not-requested" } } });
  });
  it("workspace pattern remains an editor-only preference", () => {
    expect(control("canvas.workspaceBackground")).toMatchObject({ type: "select", defaultValue: "dots", keyframeable: false });
    expect(control("canvas.workspaceBackground")?.options?.map(item => item.value)).toEqual(["blanc", "dots"]);
  });
  it("canvas sizing remains independent from node geometry", () => {
    expect(appSchema.canvas.sizing.mode).toBe("editable-output");
    expect(control("canvas.size.width")).toMatchObject({ type: "text" });
    expect(resolveBeamSettings({ [beamTargets.width]: 480 }).width).toBe(480);
    expect(appSchema.canvas.size.width).toBe(800);
  });
  it("render scale declares exact backing proof for every preview state", () => {
    expect(appSchema.canvas.renderScale).toMatchObject({ enabled: true, min: 1, max: 2, defaultValue: 2 });
    expect(appAcceptance.find(row => row.id === "canvas.renderScale")?.renderScaleCoverage).toEqual({ kind: "selected-backing-pixels", states: ["interaction", "playback", "steady"] });
  });
  it("timeline declares one shared forward loop and complete transport proof", () => {
    expect(appSchema.panels.timeline?.mode).toBe("playback");
    expect(appTransferMode.animationIntent).toMatchObject({ mode: "timeline-playback", loopDuration: { seconds: referenceTransportSeconds, source: "product-derived" } });
    expect(appAcceptance.find(row => row.id === "timeline.playback")?.timelineLoopProof).toEqual({ direction: "forward-only", durationChange: "reproved-after-edit", reversePlayback: "forbidden", seam: "first-last-match" });
    expect(appSchema.panels.layers).toBeUndefined();
  });
  it("reset restores every authored product default", () => {
    for (const [name, target] of Object.entries(beamTargets)) {
      expect(control(target)?.defaultValue, `${target} default`).toEqual(beamDefaults[name as keyof typeof beamDefaults]);
    }
    expect(appSchema.assembly.commands).toContain("controls.reset");
  });
  it("navigation preserves authored node dimensions and animation ownership", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.toolbar).toMatchObject({ zoom: true, radar: true, history: true });
    expect(appProductReadiness).toMatchObject({ viewInteraction: { mode: "non-spatial" } });
    expect(appSchema.assembly.commands).toContain("canvas.center");
  });
  it("persistence restores the exact resolved workspace slices", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage === "localStorage") {
      expect(appSchema.persistence.include).toEqual(["canvas", "panels", "timeline", "values"]);
      expect(appAcceptance.find(row => row.id === "persistence.reload")?.persistenceSlices).toEqual(appSchema.persistence.include);
    }
  });
  it("covers every visible product entity through the protected acceptance validator", () => {
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
