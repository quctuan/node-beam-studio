/** Dependency-free developer adapter. The painter and motion functions are the editor's originals. */
import { getBeamPhase, getBeamSceneRect, paintBeamNode } from "./beam-paint";
import { referenceHue, referenceTransportSeconds } from "./beam-reference";
import type { BeamSettings } from "./beam-types";

const surfaces = new WeakMap<HTMLCanvasElement, OffscreenCanvas>();

export function frameAt(settings: BeamSettings, timeSeconds: number, durationSeconds = referenceTransportSeconds, reducedMotion = false) {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : referenceTransportSeconds;
  const progress = ((timeSeconds % duration) + duration) % duration / duration;
  return {
    phase: reducedMotion ? 0.18 : getBeamPhase(progress, settings, duration),
    hue: reducedMotion || settings.motion === "static" ? 0 : referenceHue(progress, duration),
  };
}

export function renderFrame(canvas: HTMLCanvasElement, settings: BeamSettings, timeSeconds: number, options: { durationSeconds?: number; pixelRatio?: number; reducedMotion?: boolean } = {}) {
  const rect = getBeamSceneRect(settings);
  const scale = options.pixelRatio ?? window.devicePixelRatio ?? 1;
  const width = Math.max(1, Math.round(rect.width * scale));
  const height = Math.max(1, Math.round(rect.height * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  let surface = surfaces.get(canvas);
  if (!surface && typeof OffscreenCanvas !== "undefined") {
    surface = new OffscreenCanvas(width, height);
    surfaces.set(canvas, surface);
  }
  if (surface && surface.width !== width) surface.width = width;
  if (surface && surface.height !== height) surface.height = height;
  const context = surface ? surface.getContext("2d") : canvas.getContext("2d");
  if (!context) throw new Error("Canvas2D is unavailable");
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  const sx = width / rect.width, sy = height / rect.height;
  context.setTransform(sx, 0, 0, sy, -rect.x * sx, -rect.y * sy);
  const frame = frameAt(settings, timeSeconds, options.durationSeconds, options.reducedMotion);
  paintBeamNode(context, settings, frame.phase, frame.hue);
  if (surface) {
    const presentation = canvas.getContext("bitmaprenderer");
    if (presentation) presentation.transferFromImageBitmap(surface.transferToImageBitmap());
    else {
      const fallback = canvas.getContext("2d")!;
      fallback.clearRect(0, 0, width, height);
      fallback.drawImage(surface, 0, 0);
    }
  }
  return frame;
}

export function mount(canvas: HTMLCanvasElement, settings: BeamSettings, options: { durationSeconds?: number; startTimeSeconds?: number; paused?: boolean; loop?: boolean; respectReducedMotion?: boolean } = {}) {
  const duration = options.durationSeconds ?? referenceTransportSeconds;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let startTime = options.startTimeSeconds ?? 0;
  let startClock = performance.now();
  let paused = options.paused ?? false;
  let stopped = false;
  let frameId = 0;
  const time = () => paused ? startTime : startTime + (performance.now() - startClock) / 1000;
  const draw = () => {
    if (stopped) return;
    const elapsed = options.loop === false ? Math.min(duration, time()) : time();
    renderFrame(canvas, settings, elapsed, { durationSeconds: duration, reducedMotion: options.respectReducedMotion !== false && preference.matches });
    if (!paused && settings.motion !== "static" && (options.loop !== false || elapsed < duration)) frameId = requestAnimationFrame(draw);
  };
  const redraw = () => { cancelAnimationFrame(frameId); draw(); };
  draw();
  return {
    seek(seconds: number) { startTime = seconds; startClock = performance.now(); redraw(); },
    pause() { startTime = time(); paused = true; redraw(); },
    play() { startClock = performance.now(); paused = false; redraw(); },
    resize() { redraw(); },
    destroy() { stopped = true; cancelAnimationFrame(frameId); surfaces.delete(canvas); },
  };
}
