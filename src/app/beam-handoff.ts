import { beamRuntimeSource as runtimeSource } from "./beam-runtime-source";
import { beamTrailProfile, getBeamTrailAnchors, getBeamTrailFrame, getBeamNodeRect, getBeamPhase } from "./beam-paint";
import { beamReferenceModel, referenceHue, referenceOrbitSeconds, referenceTransportSeconds } from "./beam-reference";
import { resolveBeamSettings, type BeamSettings } from "./beam-types";

export const beamHandoffTarget = "beam.developerHandoff";
export const beamHandoffActionsTarget = "beam.handoffActions";
const samples = (sample: (fraction: number) => Record<string, number>) => Array.from({ length: 33 }, (_, index) => sample(index / 32));

export function createBeamHandoff(values: Readonly<Record<string, unknown>>, durationSeconds = referenceTransportSeconds, isLooping = true) {
  const settings = resolveBeamSettings(values);
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : referenceTransportSeconds;
  const node = getBeamNodeRect(settings);
  const moving = settings.motion !== "static";
  const turns = Math.max(1, Math.round(duration / referenceOrbitSeconds * settings.speed));
  const period = duration / turns;
  const hueCycles = Math.max(1, Math.round(duration / 12));
  const trail = settings.motion === "trail";
  const hueActive = moving && !trail && settings.palette !== "custom";
  const anchors = getBeamTrailAnchors(settings);
  const perimeter = anchors.perimeter;
  const phaseTime = (phase: number) => {
    if (settings.easing === "linear") return phase * period;
    let low = 0, high = 1;
    for (let index = 0; index < 32; index++) {
      const middle = (low + high) / 2;
      if (middle - .105 * Math.sin(2 * Math.PI * middle) < phase) low = middle; else high = middle;
    }
    return (low + high) / 2 * period;
  };
  const travelSeconds = phaseTime(beamTrailProfile.travelEnd) - phaseTime(beamTrailProfile.travelStart);
  const huePeriod = duration / hueCycles;
  const glowActive = settings.spread > 0 && settings.intensity > 0;
  const dark = settings.theme === "dark";
  return {
    schema: "node-beam-developer-handoff", version: 1,
    renderer: "Canvas2D / shared editor painter", settings,
    geometry: { widthPx: node.width, heightPx: node.height, radiusPx: settings.shape === "circle" ? node.width / 2 : settings.shape === "rectangle" ? 0 : Math.min(settings.radius, node.width / 2, node.height / 2), borderWidthPx: settings.borderWidth },
    motion: {
      kind: settings.motion, direction: trail ? "split-left-to-right" : moving ? "clockwise" : "none", origin: trail ? "Shared left midpoint; upper path clockwise and lower path counterclockwise; both terminate at the right midpoint" : "0° = top; 90° = right; screen coordinates",
      coordinate: trail ? "two-half-perimeter-paths" : "normalized-center-angle",
      trail: trail ? {
        ...beamTrailProfile, perimeterPx: perimeter, lengthPx: perimeter * beamTrailProfile.length,
        source: "left-midpoint", destination: "right-midpoint",
        leftPerimeterFraction: anchors.left, rightPerimeterFraction: anchors.right,
        pathDirections: ["clockwise-upper", "counterclockwise-lower"], distancePerFrontPx: perimeter / 2,
        travelSeconds, averagePixelsPerSecond: perimeter / 2 / travelSeconds,
        stageTimesSeconds: { appearEnd: phaseTime(beamTrailProfile.appearEnd), travelStart: phaseTime(beamTrailProfile.travelStart), converge: phaseTime(beamTrailProfile.travelEnd), fadeStart: phaseTime(beamTrailProfile.fadeStart), disappear: phaseTime(beamTrailProfile.fadeEnd), cycleEnd: period },
        exposureEquation: "progress=clamp((phase-travelStart)/(travelEnd-travelStart)); each front travels 0.5*progress from left in its own direction. Smooth tail and leading cap times shared appearance, gentle travel dimming, and terminal fade; max of the two fronts at convergence; zero after fadeEnd.",
        inwardFeather: "Two wider strokes clipped inward; widths = borderWidth + min(Spread, Softness * 1.2 / 0.55); alpha = 0.10 / 0.20 * Intensity/55 * Neon gain. Both use the same fading exposure.",
      } : null,
      transportDurationSeconds: duration, looping: isLooping,
      turnsPerTransport: moving ? turns : 0, rotationPeriodSeconds: moving ? period : null, cyclePeriodSeconds: moving ? period : null,
      requestedSpeed: settings.speed, effectiveAngularDegreesPerSecond: trail ? null : moving ? 360 / period : 0,
      averageLapsPerSecond: trail ? 0 : moving ? 1 / period : 0, cyclesPerSecond: moving ? 1 / period : 0,
      phaseEquation: moving ? "cycle = fract((timeSeconds / transportDurationSeconds) * turnsPerTransport); phase = rhythm(cycle)" : "phase = 0.18; hue = 0",
      rhythm: { kind: settings.easing, equation: settings.easing === "ease" ? "phase = cycle - 0.105 * sin(2 * PI * cycle)" : "phase = cycle", instantaneousSpeedRange: settings.easing === "ease" ? [1 - 2 * Math.PI * 0.105, 1 + 2 * Math.PI * 0.105] : [1, 1] },
      exposure: trail ? "Two fronts split at the left midpoint, converge at the right midpoint, stop and fade to zero; border and inward glow share lifetime" : settings.motion === "breathing" ? "0.38 + 0.62 * (0.5 - 0.5 * cos(2 * PI * phase)); color carrier shares rotating phase" : "piecewise-linear window(fract(pointAngle - phase)); border and inward light share phase",
      windowStops: trail ? [] : beamReferenceModel.windowStops,
      hue: { active: hueActive, periodSeconds: hueActive ? huePeriod : null, rangeDegrees: hueActive ? [-30, 30, -30] : [0], easing: "cubic-bezier(0.42, 0, 0.58, 1) on each half-cycle", equation: "referenceHue(timeSeconds / transportDurationSeconds, transportDurationSeconds)", note: trail ? "Trail uses the authored gradient on the perimeter, without hue rotation." : settings.palette === "custom" ? "Custom gradient does not use hue rotation." : "Independent hue clock; Speed changes phase only." },
      keyframes: {
        kind: trail ? "sampled-procedural-split" : "sampled-procedural-reference", interpolation: "Reference samples only. Use implementation.javascript for exact equations and optical composition.",
        perimeter: trail ? samples(fraction => {
          const phase = fraction === 1 ? 1 : getBeamPhase(fraction / turns, settings, duration);
          const frame = getBeamTrailFrame(phase);
          const wrap = (value: number) => ((value % 1) + 1) % 1;
          return { timeSeconds: fraction * period, phase, progress: frame.progress, opacity: frame.opacity, distanceFromLeftPx: frame.progress * perimeter / 2, upperPerimeterFraction: wrap(anchors.left + frame.progress / 2), lowerPerimeterFraction: wrap(anchors.left - frame.progress / 2) };
        }) : [],
        rotation: trail ? [] : moving ? samples(fraction => {
          const phase = getBeamPhase(fraction / turns, settings, duration);
          return { timeSeconds: fraction * period, phase, unwrappedAngleDegrees: (fraction === 1 ? 1 : phase) * 360 };
        }) : [{ timeSeconds: 0, phase: 0.18, unwrappedAngleDegrees: 64.8 }],
        hue: hueActive ? samples(fraction => ({ timeSeconds: fraction * huePeriod, hueDegrees: referenceHue(fraction / hueCycles, duration) })) : [{ timeSeconds: 0, hueDegrees: 0 }],
      },
    },
    optics: {
      inwardGlow: { enabled: glowActive, spreadPx: settings.spread, softnessPx: settings.blur, effectiveReachPx: glowActive ? Math.max(4, settings.spread + settings.blur * 1.6) : 0, authoredIntensityPercent: settings.intensity, intensityMultiplier: settings.intensity / 55, styleGain: settings.style === "neon" ? 1.5 : settings.style === "crisp" ? 0.48 : 1, themeGain: dark ? 0.30 : 0.22, direction: "inward only; clipped to node silhouette", radialFalloff: [[0, 1], [0.16, 0.81], [0.42, 0.40], [0.72, 0.085], [1, 0]], note: "Kernel reach = Spread + 1.6 × Softness. Intensity is a gain, not a single CSS opacity. Perimeter contributions are density-normalized by the supplied painter." },
      border: { widthPx: settings.borderWidth, themeAlphaGain: trail ? dark ? 1 : 0.96 : dark ? 0.46 : 0.90, baseTrackAlpha: 0, styleGain: settings.style === "neon" ? 1.4 : settings.style === "crisp" ? 1.1 : 1, note: trail ? "Alpha = gradient stop alpha * shared fading split-path exposure * themeAlphaGain * styleGain, clamped to 0…1. No colored track survives the fade." : "Final alpha also depends on field alpha and shared angular exposure; clamped to 0…1." },
      colorField: { kind: trail || settings.palette === "custom" ? "authored-gradient" : "nine-radial-spots-and-angular-carrier", gradient: settings.gradient, spots: trail || settings.palette === "custom" ? [] : beamReferenceModel.spots.map(([radiusX, radiusY, centerX, centerY, original, paletteIndex]) => ({ radiusXpx: radiusX, radiusYpx: radiusY, centerXfraction: centerX, centerYfraction: centerY, color: settings.palette === "spectrum" ? original : settings.colors[paletteIndex % settings.colors.length] })), carrierStops: trail || settings.palette === "custom" ? [] : dark ? beamReferenceModel.darkCarrierStops : beamReferenceModel.carrierStops, filterApplied: !trail && settings.palette !== "custom", saturation: trail || settings.palette === "custom" ? 1 : dark ? 1.2 : 1.5, brightness: trail || settings.palette === "custom" ? 1 : dark ? 1.3 : 1 },
    },
    integration: {
      settingsJsonPath: `values["${beamHandoffTarget}"]`,
      selectedFrame: "Read timeSeconds from the enclosing Settings JSON's timeline.currentTimeSeconds. NodeBeam.renderFrame(canvas, handoff.settings, timeSeconds, { durationSeconds: handoff.motion.transportDurationSeconds }) reconstructs that frame.",
      instructions: "Save implementation.javascript as node-beam-runtime.js. Save implementation.exampleHtml as index.html beside it and open in a browser. Copy HTML in the tool provides the same preview in one file. No packages or Toolcraft installation required.",
      note: "Workspace Dots, editor theme, pan and zoom are editor preferences; node geometry and light are expressed in unzoomed CSS px. Native imported handoff metadata is regenerated from current controls and never executed by this tool.",
    },
    implementation: { javascript: runtimeSource, exampleHtml: createPreviewHtml(settings, duration, isLooping, false) },
  };
}

export type BeamHandoff = ReturnType<typeof createBeamHandoff>;
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export function createPreviewHtml(settings: BeamSettings, durationSeconds: number, loop = true, inlineRuntime = true, startTimeSeconds = 0) {
  const script = inlineRuntime ? `<script>${runtimeSource.replace(/<\/script/gi, "<\\/script")}</script>` : '<script src="node-beam-runtime.js"></script>';
  const background = settings.includeBackground ? settings.background : settings.theme === "dark" ? "#111214" : "#F6F7F8";
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Node Beam — Developer Preview</title>
<style>html,body{margin:0;min-height:100%;background:${background}}body{display:grid;place-items:center;min-height:100vh}canvas{max-width:95vw;max-height:95vh;object-fit:contain}</style>
<canvas id="beam" aria-label="Node beam preview"></canvas>
${script}
<script>
const settings = ${scriptJson(settings)};
const seek = new URLSearchParams(location.search).get('t');
const seekTime = seek === null ? ${scriptJson(startTimeSeconds)} : Number(seek);
const player = NodeBeam.mount(document.getElementById('beam'), settings, {durationSeconds:${scriptJson(durationSeconds)},startTimeSeconds:Number.isFinite(seekTime)?seekTime:0,paused:seek!==null,loop:${scriptJson(loop)}});
// player.pause(), player.play(), player.seek(seconds), player.destroy()
</script></html>`;
}
