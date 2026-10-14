import type {
  ToolcraftComponentAcceptance,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { referenceTransportSeconds } from "./beam-reference";
export { appControlSectionInventory } from "./beam-schema";

const starterPersistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    mode: "timeline-playback",
    loopDuration: {
      seconds: referenceTransportSeconds,
      source: "product-derived",
      evidence: "24 reference rotations at 1.96 seconds each; quarter-step speeds retain a closed angular loop. The hue sway is fitted to four complete cycles for a seamless transport loop.",
    },
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Node Beam Studio",
  productSummary: "A visual editor for the gradient border and synchronized inner light of a generating node.",
  requestedBehavior: "Edit Light/Dark appearance, workspace, node geometry, motion, palette, glow spread and softness, border width, and effect style with immediate preview. Inspect effective motion and optical parameters and export a developer document containing reference motion samples and the exact renderer.",
  exportIntent: {
    image: {
      mode: "user-removed",
      evidence: {
        source: "user-message",
        messageRef: "/Users/tuanvq/.codex/sessions/2026/10/08/rollout-2026-10-08T09-14-22-01a1194a-4dd2-7a20-b9b5-4108a7ebd1fe.jsonl:4538",
        messageText: "Vậy cho cụm 2 button này xuống bên dưới, fixed position. Bỏ tính năng export PNG đi, ko cần thiết",
        quote: "Bỏ tính năng export PNG đi, ko cần thiết",
      },
    },
    svg: { mode: "not-requested" }, video: { mode: "not-requested" },
  },
  viewInteraction: { mode: "non-spatial", reason: "The product is a flat two-dimensional node; there is no model or three-dimensional camera." },
  interactionOwnership: [{
    id: "beam-properties", target: "beam.width", capability: "property-edit", surface: "panel",
    selectionScope: { mode: "global" },
    evidence: { source: "user-request", detail: "The user requests a tool to tune effect parameters, geometry and colors." },
    reason: "The inspector supports exact values while preserving an unobstructed node preview.",
    alternative: { surface: "canvas", reason: "Canvas navigation pans and zooms the workspace; it does not duplicate inspector property editing." },
  }, {
    id: "beam-preset-selection", target: "beam.sharedDefault", capability: "structured-selection", surface: "panel",
    evidence: { source: "user-request", detail: "The user explicitly wants all visitors to save named sets and open their parameters by choosing a saved setting, with no key or administrator." },
    reason: "A server-backed preset browser loads whole settings snapshots into the existing property editor.",
    alternative: { surface: "canvas", reason: "Preset names and management belong in the panel; the node canvas remains an unobstructed effect preview." },
  }],
};

const browserFiles: Record<string, string> = {
  "browser: workspace plain and dots change the editor backing": "e2e/beam-workspace.spec.ts",
  "browser: reset restores all product values and node output": "e2e/beam-controls.spec.ts",
  "browser: finite canvas size and Infinity preserve the node": "e2e/beam-canvas.spec.ts",
  "browser: render scale selects real backing pixels in every state": "e2e/beam-canvas.spec.ts",
  "browser: background fill preserves Infinity without image export": "e2e/product-beam.spec.ts",
  "browser: fixed settings footer restores JSON without image export": "e2e/beam-settings.spec.ts",
  "browser: canvas pan zoom and center keep node geometry stable": "e2e/beam-viewport.spec.ts",
  "browser: beam workspace restores every resolved slice after reload": "e2e/beam-persistence.spec.ts",
  "browser: timeline controls the actual shared beam cycle": "e2e/beam-timeline.spec.ts"
};

const browser = (testName: string, io = false) => ({
  file: (browserFiles[testName] ?? "e2e/product-beam.spec.ts") as `e2e/${string}.spec.ts`,
  testName,
  budget: io ? "extended-io" as const : "standard" as const,
});

const controlRows = [
  ["beam.theme", "segmented", "Select Light and Dark.", "Node surface and gradient contrast adapt immediately.", ["light", "dark"]],
  ["beam.shape", "select", "Select Rounded, Rectangle and Circle.", "The actual node silhouette changes; only relevant geometry controls remain.", ["rounded", "rectangle", "circle"]],
  ["beam.aspect", "segmented", "Select every node ratio.", "Node height changes relative to its retained width.", ["square", "wide", "portrait"]],
  ["beam.width", "slider", "Drag Width / Diameter while holding the pointer.", "The visible outline and real backing resize during the drag.", undefined],
  ["beam.radius", "slider", "Drag Corner radius.", "Visible node corners change before pointer release.", undefined],
  ["beam.motion", "segmented", "Select Orbit, Trail, Breathe and Static.", "Motion styles change the rendered frame and Static hides timing controls.", ["orbit", "trail", "breathing", "static"]],
  ["beam.speed", "slider", "Drag Speed at a fixed timeline phase.", "Border and inward glow move together with changed cadence.", undefined],
  ["beam.easing", "segmented", "Select Linear and Ease.", "Both optical layers use the selected temporal rhythm.", ["linear", "ease"]],
  ["beam.palette", "select", "Select each palette and return to Custom.", "Border and inner light share the selected palette; custom stops are retained.", ["fiora", "spectrum", "cyan", "custom"]],
  ["beam.gradient", "gradient", "Edit gradient type, angle, position, color and opacity.", "Every gradient part changes real border and inward-light pixels.", undefined],
  ["beam.style", "segmented", "Select Soft, Neon and Crisp.", "The optical profile changes without losing authored values.", ["soft", "neon", "crisp"]],
  ["beam.borderWidth", "slider", "Drag Border width.", "The rendered gradient outline visibly changes thickness live.", undefined],
  ["beam.spread", "slider", "Drag Inward spread.", "Colored light reaches a different depth inside the node live.", undefined],
  ["beam.intensity", "slider", "Drag Glow strength.", "Inward colored light becomes brighter or fainter live.", undefined],
  ["beam.blur", "slider", "Drag Softness.", "The light feather changes in rendered pixels live.", undefined],
  ["beam.background", "color", "Enable Background and edit its color.", "The runtime fills the workspace with the selected color beneath the node.", undefined],
] as const;

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    id: "beam.trail-convergence", kind: "runtime", componentType: "renderer", automated: true,
    automatedTestName: "trail splits at left converges at right and fades completely",
    browser: { file: "e2e/beam-trail.spec.ts", testName: "browser: trail splits converges and disappears on light", budget: "standard" },
    evidence: "rendered-pixels", fixture: "Single-color split Trail at birth, upper/lower travel, right convergence, fade and empty interval",
    userAction: "Choose Trail and scrub through its complete split/converge/fade cycle.",
    expectedObservable: "Actual colored pixels start at the left midpoint, move over top and bottom, meet only at the right midpoint, decrease in brightness, and disappear completely with the inward glow.",
  },
  {
    id: "beam.trail", kind: "runtime", componentType: "renderer", automated: true,
    automatedTestName: "trail splits at left converges at right and fades completely",
    browser: { file: "e2e/beam-trail.spec.ts", testName: "browser: trail highlights follow light node geometry and seam", budget: "standard" },
    evidence: "rendered-pixels", fixture: "Two split-path fronts across Light/Dark and Rounded/Rectangle/Circle",
    userAction: "Select Trail, switch node shapes, and scrub over the loop seam.",
    expectedObservable: "Fronts start together at the left midpoint, follow opposite upper/lower half-paths, meet and stop at the right midpoint, then vanish with their glow; the loop seam stays neutral.",
  },
  {
    id: "beam.trail-handoff", kind: "runtime", componentType: "renderer", automated: true,
    automatedTestName: "trail saves canonical native and shared snapshots with a precise developer specification",
    browser: { file: "e2e/beam-trail.spec.ts", testName: "browser: trail export restores identical developer frames", budget: "standard" },
    evidence: "rendered-pixels", fixture: "Trail node and exported canonical settings plus exact painter",
    userAction: "Export Trail JSON, render its selected frame with the supplied source, and import it back.",
    expectedObservable: "Export preserves Trail with precise perimeter metadata; standalone renderer and restored node have identical pixels.",
  },
  {
    id: "beam.sharedDefault", target: "beam.sharedDefault", kind: "control", componentType: "beamPresetLibrary",
    automated: true, automatedTestName: "public preset library preserves legacy defaults and canonical settings",
    browser: { file: "e2e/beam-shared-default.spec.ts", testName: "browser: public presets load saved parameters and support management", budget: "standard" },
    evidence: "command-side-effect", fixture: "Public shared library with two complete node snapshots",
    userAction: "Select a saved set, rename it, delete it, restore it and select it again.",
    expectedObservable: "The named snapshot loads exact effect values and playback; remote name/removal/restoration is reflected in the list without any sign-in.",
    customControlCoverage: "all-custom-control-behavior", interactionId: "beam-preset-selection",
    builtInFitCheck: { capabilities: ["custom-interaction", "collection", "selection", "commands"], checkedBuiltIns: ["select", "sourceCollection", "collectionActions", "text", "actions"], closestBuiltIn: "sourceCollection",
      whyInsufficient: "These built-ins author runtime item values or fixed options. This server-owned collection loads named whole-settings snapshots via the canonical codec, refreshes changes from other visitors and restores archived snapshots; schema text/actions own naming and mutations separately.",
      productObservable: "Selecting a server preset loads its authored node controls and preview, and management persists changes for another visitor." },
  },
  {
    id: "beam.presetName", target: "beam.presetName", kind: "control", componentType: "text",
    automated: true, automatedTestName: "preset name is a native draft excluded from effect snapshots",
    browser: { file: "e2e/beam-shared-default.spec.ts", testName: "browser: public preset names save named settings snapshots", budget: "standard" },
    evidence: "command-side-effect", fixture: "Edited effect and native Preset name field",
    userAction: "Name the current settings and save a preset.",
    expectedObservable: "The server-saved set uses the entered name and exact settings; empty or duplicate names produce actionable errors.",
  },
  {
    id: "beam.defaultActions", target: "beam.defaultActions", kind: "control", componentType: "actions",
    automated: true, automatedTestName: "public preset publishing uses native actions without auth",
    browser: { file: "e2e/beam-shared-default.spec.ts", testName: "browser: public default preset opens for fresh visitors", budget: "standard" },
    evidence: "command-side-effect", fixture: "Unauthenticated editor and independent visitor context",
    userAction: "Save current settings, set the set as default and open or reload a visitor.",
    expectedObservable: "Anyone can publish the startup preset; fresh visitors load it, no credentials are requested, and failed storage does not discard prior presets.",
  },
  {
    id: "beam.developerHandoff", target: "beam.developerHandoff", kind: "control", componentType: "beamHandoffInspector",
    automated: true, automatedTestName: "developer handoff supplies effective motion and exact renderer",
    browser: { file: "e2e/beam-handoff.spec.ts", testName: "browser: developer handoff exports motion and reproduces preview", budget: "standard" },
    evidence: "product-output", fixture: "Paused node, effective timing graph and native Settings export",
    userAction: "Change speed and rhythm, inspect the phase graph and derived units, export Settings and run the supplied renderer at the exported playhead.",
    expectedObservable: "The graph and readable timing update; exported JSON has effective periods, reference motion samples, glow formulas and executable source that reproduces preview pixels.",
    customControlCoverage: "all-custom-control-behavior",
    builtInFitCheck: {
      capabilities: ["custom-visualization"], checkedBuiltIns: ["code", "curves", "sourceCollection", "actions"], closestBuiltIn: "code",
      whyInsufficient: "Code edits a string, Curves edits authored points and sourceCollection edits source items; this read-only surface visualizes the renderer-derived time-to-angle curve and effective optical units without a second property editor.",
      productObservable: "Changing speed/rhythm changes the readable effective period and rendered phase curve and the same derived data appears in native JSON.",
    },
  },
  {
    id: "beam.handoffActions", target: "beam.handoffActions", kind: "control", componentType: "actions",
    automated: true, automatedTestName: "developer copy commands use native actions",
    browser: { file: "e2e/beam-handoff.spec.ts", testName: "browser: developer handoff copies runnable HTML and specification", budget: "standard" },
    evidence: "command-side-effect", fixture: "Current node and native Copy HTML / Copy spec actions",
    userAction: "Click both native copy commands and inspect the actual clipboard contents.",
    expectedObservable: "Clipboard receives self-contained executable HTML or the complete developer specification with success feedback.",
  },
  ...controlRows.map(([target, componentType, userAction, expectedObservable, options]) => ({
    id: target, target, kind: "control" as const, componentType,
    automated: true, automatedTestName: `${target} has a canonical editable product contract`,
    browser: browser(`browser: ${target} changes actual node output`),
    evidence: "product-output" as const, fixture: "Paused node at deterministic timeline phase with relevant branch active",
    userAction, expectedObservable,
    ...(options ? { optionCoverage: options } : {}),
    ...(target === "beam.width" ? { interactionId: "beam-properties" } : {}),
    ...(target === "beam.gradient" ? { controlPartCoverage: ["gradient.gradientType", "gradient.angle", "gradient.stops.position", "gradient.stops.color", "gradient.stops.opacity"] as const } : {}),
  })),
  {
    id: "beam.background-output", target: "export.includeBackground", kind: "control", componentType: "switch",
    automated: true, automatedTestName: "background preserves native preview ownership",
    browser: browser("browser: background fill preserves Infinity without image export"),
    evidence: "product-output", fixture: "Finite and infinite workspace with background on and off",
    userAction: "Toggle Background and restore it while Infinity is enabled.",
    expectedObservable: "Runtime preview fill disappears and restores; node pixels and Infinity mode remain.",
  },
  {
    id: "workspace.pattern", target: "canvas.workspaceBackground", kind: "runtime", componentType: "select",
    automated: true, automatedTestName: "workspace pattern remains an editor-only preference",
    browser: browser("browser: workspace plain and dots change the editor backing"), evidence: "command-side-effect",
    fixture: "Infinity workspace with Background off", userAction: "Select Blanc and Dots.",
    expectedObservable: "Workspace pattern changes behind the node without editing its parameters.", optionCoverage: ["blanc", "dots"],
  },
  {
    id: "canvas.sizing", target: "canvas.infinity", kind: "runtime", componentType: "canvas-sizing",
    automated: true, automatedTestName: "canvas sizing remains independent from node geometry",
    browser: browser("browser: finite canvas size and Infinity preserve the node"), evidence: "viewport-side-effect",
    fixture: "Finite artboard different from node dimensions", userAction: "Edit finite canvas ratio and dimensions; toggle Infinity both ways.",
    expectedObservable: "Finite output crop follows saved size while Infinity preserves node, view and backing.",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
  },
  {
    id: "canvas.renderScale", target: "canvas.renderScale", kind: "runtime", componentType: "slider",
    automated: true, automatedTestName: "render scale declares exact backing proof for every preview state",
    browser: browser("browser: render scale selects real backing pixels in every state"), evidence: "product-output",
    fixture: "Same node CSS dimensions at scale 1 and 2", userAction: "Change Resolution scale during steady preview, playback and navigation.",
    expectedObservable: "Backing equals CSS size × DPR × selected scale without changing scene size.",
    renderScaleCoverage: { kind: "selected-backing-pixels", states: ["interaction", "playback", "steady"] },
  },
  {
    id: "timeline.playback", kind: "runtime", componentType: "timeline",
    automated: true, automatedTestName: "timeline declares one shared forward loop and complete transport proof",
    browser: browser("browser: timeline controls the actual shared beam cycle"), evidence: "timeline-output",
    fixture: "Orbit node, runtime timeline extended", userAction: "Scrub, pause/resume, edit duration and inspect both seams.",
    expectedObservable: "Real rendered phase tracks the native playhead and remains seamless after duration edits.",
    timelineCoverage: "playback", timelinePlaybackCoverage: "all-playback-behavior",
    timelineLoopProof: { direction: "forward-only", reversePlayback: "forbidden", seam: "first-last-match", durationChange: "reproved-after-edit" },
  },
  {
    id: "controls.reset", target: "controls.reset", kind: "runtime", componentType: "reset",
    automated: true, automatedTestName: "reset restores every authored product default",
    browser: browser("browser: reset restores all product values and node output"), evidence: "command-side-effect",
    fixture: "Changed node parameters and hidden custom gradient", userAction: "Click Reset controls in the panel header.",
    expectedObservable: "Visible and hidden values restore exact schema defaults and the resulting node restores.",
  },
  {
    id: "viewport.navigation", target: "canvas.viewport", kind: "runtime", componentType: "toolbar",
    automated: true, automatedTestName: "navigation preserves authored node dimensions and animation ownership",
    browser: browser("browser: canvas pan zoom and center keep node geometry stable"), evidence: "viewport-side-effect",
    fixture: "Playing node, visible canvas and runtime toolbar", userAction: "Pan, zoom and center the canvas.",
    expectedObservable: "Presentation changes, product dimensions remain stable, and playback is never toggled by navigation.",
  },
  {
    id: "settings.transfer", target: "runtime.settingsTransfer", kind: "runtime", componentType: "settingsTransfer",
    automated: true, automatedTestName: "native settings footer retains JSON and excludes image export",
    browser: browser("browser: fixed settings footer restores JSON without image export"), evidence: "exported-bytes",
    fixture: "Scrollable inspector with edited node geometry, color, motion and hidden values",
    userAction: "Scroll properties, export JSON from the fixed footer and import it into a fresh workspace.",
    expectedObservable: "Two native buttons stay at the panel bottom; JSON restores the full effect, including old presets; no image export UI remains.",
  },
  {
    automated: true, automatedTestName: "persistence restores the exact resolved workspace slices",
    browser: browser("browser: beam workspace restores every resolved slice after reload", true), componentType: "persistence",
    evidence: "persistence-state", expectedObservable: "Node values, canvas navigation, panel state and timeline are restored with actual output after reload.",
    fixture: "Changed values, canvas, panels and timeline", id: "persistence.reload", kind: "runtime",
    persistenceCoverage: "reload", persistenceSlices: starterPersistenceSlices, target: "canvas.size.width",
    userAction: "Edit each resolved workspace slice, wait for persistence and reload.",
  },
];
