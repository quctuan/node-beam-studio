import {
  assessToolcraftRenderPlan,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  registerToolcraftRendererPipeline,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { beamTargets } from "./beam-types";
import type { BeamPaintResponse } from "./beam-worker";
import type { BeamWorkerHandle } from "./beam-worker-client";

const paintTargets = Object.values(beamTargets).filter((target) => !["beam.background", "export.includeBackground"].includes(target));
const dragTargets = ["beam.width", "beam.radius", "beam.speed", "beam.spread", "beam.intensity", "beam.blur", "beam.borderWidth", "canvas.renderScale"];
const intrinsic = { kind: "intrinsic", reason: "One authored node frame includes the complete border; the inner lighting is intentionally clipped to that node surface." } as const;

type Contracts = {
  "beam-worker": ToolcraftRendererPipelinePassContract<BeamWorkerHandle, BeamWorkerHandle, readonly [string]>;
  "beam-backing": ToolcraftRendererPipelinePassContract<BeamPaintResponse>;
  "beam-composite": ToolcraftRendererPipelinePassContract<BeamPaintResponse>;
  "beam-present": ToolcraftRendererPipelinePassContract<void>;
};

export const beamPipelineRegistration = registerToolcraftRendererPipeline<Contracts>()({
  runtimeId: "node-beam-studio-painter-v1",
  passes: [
    { id: "beam-worker", inputs: ["beam-worker-module"], invalidatedBy: ["renderer-unmount"], cacheKey: ["renderer"], kind: "handles", output: "overlay", quality: "full", runsOn: "main", cost: { dimensions: [], frequency: "once", relationship: "constant" }, lifecycle: { cache: "retained-resource", resourceScope: "renderer" } },
    { id: "beam-backing", inputs: ["beam.width", "beam.aspect", "beam.shape", "canvas.zoom", "canvas.renderScale", "devicePixelRatio"], invalidatedBy: ["beam.width", "beam.aspect", "beam.shape", "canvas.zoom", "canvas.renderScale", "devicePixelRatio"], kind: "rasterize", output: "intermediate", quality: "retina", runsOn: "worker", sceneBounds: intrinsic, cost: { dimensions: ["node-width", "preview-scale", "viewport-zoom"], frequency: "discrete", relationship: "product" }, lifecycle: { cache: "none", resourceScope: "call" } },
    { id: "beam-composite", inputs: [...paintTargets, "timeline.currentTimeSeconds", "timeline.durationSeconds", "beam-backing"], invalidatedBy: [...paintTargets, "timeline.currentTimeSeconds", "timeline.durationSeconds", "canvas.zoom", "canvas.renderScale"], kind: "composite", output: "preview", quality: "retina", runsOn: "worker", sceneBounds: intrinsic, cost: { dimensions: ["node-width", "preview-scale", "viewport-zoom"], frequency: "frame", relationship: "product" }, lifecycle: { cache: "none", resourceScope: "call" } },
    { id: "beam-present", inputs: ["beam-composite-bitmap"], invalidatedBy: ["beam-composite-bitmap"], kind: "handles", output: "preview", quality: "retina", runsOn: "main", sceneBounds: intrinsic, cost: { dimensions: [], frequency: "frame", relationship: "constant" }, lifecycle: { cache: "none", resourceScope: "call" } },
  ],
  interactionInvalidation: [
    { interaction: "initial-render", targets: ["beam.width"], invalidates: ["beam-worker", "beam-backing", "beam-composite", "beam-present"] },
    { interaction: "control-drag", targets: dragTargets, invalidates: ["beam-backing", "beam-composite", "beam-present"], mustNotInvalidate: ["beam-worker"] },
    { interaction: "control-change", targets: paintTargets.filter((target) => !dragTargets.includes(target)), invalidates: ["beam-backing", "beam-composite", "beam-present"], mustNotInvalidate: ["beam-worker"] },
    { interaction: "control-change", targets: ["beam.background", "export.includeBackground", "canvas.workspaceBackground", "beam.developerHandoff", "beam.handoffActions", "beam.sharedDefault", "beam.defaultActions", "beam.presetName"], invalidates: [], mustNotInvalidate: ["beam-worker", "beam-backing", "beam-composite", "beam-present"] },
    { interaction: "timeline-playback", targets: ["timeline.currentTimeSeconds"], invalidates: ["beam-composite", "beam-present"], mustNotInvalidate: ["beam-worker", "beam-backing"] },
    { interaction: "timeline-scrub", targets: ["timeline.currentTimeSeconds"], invalidates: ["beam-composite", "beam-present"], mustNotInvalidate: ["beam-worker", "beam-backing"] },
    { interaction: "viewport-drag", targets: ["canvas.offset"], invalidates: [], mustNotInvalidate: ["beam-worker", "beam-backing", "beam-composite", "beam-present"] },
    { interaction: "viewport-zoom", targets: ["canvas.zoom"], invalidates: ["beam-backing", "beam-composite", "beam-present"], mustNotInvalidate: ["beam-worker"] },
  ],
});

const numericAdapter = (dimensionId: string) => ({ dimensionId, apply: (value: number) => value, observe: (value: unknown) => Number(value) });
const model: ToolcraftEnvelopePerformanceConfig = {
  rendererStrategy: "canvas-2d", usesCustomRenderer: true, rendererPipeline: beamPipelineRegistration,
  rendererTechnique: {
    sourceRepresentation: "procedural-data", productRepresentation: "pixel", previewRenderer: "canvas-2d", exportRenderer: "none", rendererStrategy: "canvas-2d",
    intentionalRasterizationReason: "Continuous colored inward lighting is composited from native Canvas2D gradients in the live preview.",
    whyNotAlternativeStrategies: ["A single node does not require a shader provider; worker Canvas2D keeps native gradient composition off the panel thread."],
    fidelityRisks: ["Native gradient antialiasing may differ by one device pixel between browsers."],
    performanceRisks: ["Maximum node size, viewport zoom and selected retina backing multiply pixel work; only one frame runs at once and newer requests coalesce."],
    layers: [{ id: "node-beam", intentionalRasterizationReason: "The authored surface is a pixel effect with inward blurred gradient lighting; semantic vector geometry alone cannot represent its native composited light field.", kind: "product-foreground", content: ["geometry", "composite"], renderer: "canvas-2d", primitiveCount: "low", exportMode: "excluded", uiSelector: 'canvas[data-testid="beam-preview"]' }],
  },
  workloadEnvelope: { dimensions: [
    { id: "node-width", unit: "px", source: { kind: "schema-target", target: "beam.width", workloadBoundary: "maximum" }, mapping: "area", defaultValue: 380, interactiveMax: 640 },
    { id: "preview-scale", unit: "scale", source: { kind: "runtime-state", path: "values[canvas.renderScale]" }, mapping: "area", defaultValue: 2, interactiveMax: 2 },
    { id: "viewport-zoom", unit: "%", source: { kind: "runtime-state", path: "canvas.zoom" }, mapping: "area", defaultValue: 100, interactiveMax: 400 },
  ] },
  fixtureAdapters: { dimensions: {
    "node-width": numericAdapter("node-width"), "preview-scale": numericAdapter("preview-scale"), "viewport-zoom": numericAdapter("viewport-zoom"),
  } },
  scenarios: [],
};
export const beamRenderPlanAssessment = assessToolcraftRenderPlan(appSchema, model);
export const beamPerformancePaths = deriveToolcraftPerformancePaths(appSchema, model);
export const appPerformance = defineToolcraftPerformance({ ...model, scenarios: beamPerformancePaths.map((path, index) => ({
  id: `beam-path-${index}`, pathId: path.id, coversTargets: path.targets, interaction: path.interaction,
  automated: true, automatedTestName: "beam performance paths compile", browser: true, browserTestName: `browser perf: toolcraft path ${path.id}`,
  fixture: "Compiled node extent, viewport zoom and render scale.", expectedObservable: "Actual committed gradient node pixels at selected full backing quality.", uiSelector: 'canvas[data-testid="beam-preview"]',
})) } as ToolcraftEnvelopePerformanceConfig);
