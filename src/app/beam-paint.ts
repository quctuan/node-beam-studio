import type { BeamSettings } from "./beam-types";
import { referenceOrbitSeconds, referenceTransportSeconds, referenceWindow } from "./beam-reference";

export type BeamRect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type BeamPoint = Readonly<{ x: number; y: number; t: number }>;
type PaintContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Rgba = readonly [number, number, number, number];
const TAU = Math.PI * 2;
const fract = (value: number) => ((value % 1) + 1) % 1;

export function getBeamNodeRect(settings: BeamSettings): BeamRect {
  const width = settings.width;
  const height = settings.shape === "circle" || settings.aspect === "square" ? width
    : settings.aspect === "wide" ? width * 9 / 16 : width * 4 / 3;
  return { x: -width / 2, y: -height / 2, width, height };
}
export function getBeamSceneRect(settings: BeamSettings): BeamRect {
  const node = getBeamNodeRect(settings);
  const margin = settings.borderWidth / 2 + 2;
  return { x: node.x - margin, y: node.y - margin, width: node.width + margin * 2, height: node.height + margin * 2 };
}
export function getBeamPhase(progress: number, settings: BeamSettings, duration = referenceTransportSeconds): number {
  if (settings.motion === "static") return 0.18;
  const turns = Math.max(1, Math.round(duration / referenceOrbitSeconds * settings.speed));
  const cycle = fract(progress * turns);
  return settings.easing === "ease" ? cycle - Math.sin(TAU * cycle) * 0.105 : cycle;
}
function radiusFor(settings: BeamSettings, node: BeamRect): number {
  return settings.shape === "circle" ? node.width / 2 : settings.shape === "rectangle" ? 0
    : Math.min(settings.radius, node.width / 2, node.height / 2);
}
function nodePath(ctx: PaintContext, rect: BeamRect, radius: number): void {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
}
/** Uniform arc-length samples keep the glow and border on precisely the same path. */
export function sampleBeamPerimeter(settings: BeamSettings, count = 512): readonly BeamPoint[] {
  const rect = getBeamNodeRect(settings);
  const r = radiusFor(settings, rect);
  const x = rect.x, y = rect.y, w = rect.width, h = rect.height;
  const a = w - 2 * r, b = h - 2 * r, arc = Math.PI * r / 2;
  const lengths = [a, arc, b, arc, a, arc, b, arc];
  const total = lengths.reduce((sum, value) => sum + value, 0);
  const points: BeamPoint[] = [];
  for (let index = 0; index <= count; index++) {
    let distance = (index / count) * total;
    let segment = 0;
    while (segment < 7 && distance > lengths[segment]) distance -= lengths[segment++];
    const f = lengths[segment] > 0 ? distance / lengths[segment] : 0;
    let px = 0, py = 0;
    if (segment === 0) { px = x + r + a * f; py = y; }
    else if (segment === 2) { px = x + w; py = y + r + b * f; }
    else if (segment === 4) { px = x + w - r - a * f; py = y + h; }
    else if (segment === 6) { px = x; py = y + h - r - b * f; }
    else {
      const angle = (segment === 1 ? -Math.PI / 2 : segment === 3 ? 0 : segment === 5 ? Math.PI / 2 : Math.PI) + f * Math.PI / 2;
      const cx = segment === 1 || segment === 3 ? x + w - r : x + r;
      const cy = segment === 1 || segment === 7 ? y + r : y + h - r;
      px = cx + Math.cos(angle) * r; py = cy + Math.sin(angle) * r;
    }
    points.push({ x: px, y: py, t: index / count });
  }
  return points;
}
function readRgba(hex: string, opacity = 100): Rgba {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), opacity / 100];
}
function mix(left: Rgba, right: Rgba, amount: number): Rgba {
  return left.map((value, index) => value + (right[index] - value) * amount) as unknown as Rgba;
}
function cssColor(color: Rgba, alpha: number): string {
  return `rgba(${color[0]},${color[1]},${color[2]},${Math.max(0, Math.min(1, color[3] * alpha))})`;
}
export function getBeamColor(settings: BeamSettings, point: BeamPoint): Rgba {
  const rect = getBeamNodeRect(settings);
  const angle = settings.gradient.angle * Math.PI / 180;
  const nx = point.x / (rect.width / 2), ny = point.y / (rect.height / 2);
  const rx = nx * Math.cos(angle) + ny * Math.sin(angle);
  const ry = -nx * Math.sin(angle) + ny * Math.cos(angle);
  const type = settings.gradient.gradientType;
  const position = type === "linear" ? Math.max(0, Math.min(1, (rx + 1) / 2))
    : type === "radial" ? Math.min(1, Math.hypot(rx, ry) / Math.SQRT2)
      : type === "diamond" ? Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 2)
        : fract(point.t - angle / TAU);
  const stops = settings.gradient.stops.map((stop) => ({ position: parseFloat(stop.position) / 100, color: readRgba(stop.color, stop.opacity ?? 100) })).sort((a, b) => a.position - b.position);
  if (position <= stops[0].position) return stops[0].color;
  for (let index = 1; index < stops.length; index++) {
    if (position <= stops[index].position) {
      const left = stops[index - 1], right = stops[index];
      return mix(left.color, right.color, (position - left.position) / Math.max(0.0001, right.position - left.position));
    }
  }
  return stops[stops.length - 1].color;
}
/** The accepted conic window rotates about the center, not along arc length. */
export function getBeamExposure(angle: number, phase: number, settings: BeamSettings): number {
  if (settings.motion === "breathing") return 0.38 + 0.62 * (0.5 - 0.5 * Math.cos(TAU * phase));
  return referenceWindow(angle, phase);
}

export function getBeamOpticalSample(settings: BeamSettings, point: BeamPoint, phase: number, hue: number, node: BeamRect) {
  if (settings.motion === "trail") {
    return { color: getBeamColor(settings, point), exposure: getBeamTrailExposure(point.t, phase, getBeamTrailAnchors(settings).left) };
  }
  const angle = fract(Math.atan2(point.y, point.x) / TAU + .25);
  const color = getBeamColor(settings, point);
  return { color, exposure: getBeamExposure(angle, phase, settings) };
}

/** Both branches use one lifetime and exact geometry, shared by border and light. */
export const beamTrailProfile = {
  count: 2, length: 0.10, feather: 0.012,
  appearEnd: 0.06, travelStart: 0.04, travelEnd: 0.76,
  fadeStart: 0.72, fadeEnd: 0.94, travelDimming: 0.25,
} as const;
const smoothstep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
export function getBeamTrailAnchors(settings: BeamSettings) {
  const node = getBeamNodeRect(settings), radius = radiusFor(settings, node);
  const horizontal = node.width - 2 * radius;
  const vertical = node.height - 2 * radius;
  const arc = Math.PI * radius / 2;
  const perimeter = 2 * (horizontal + vertical) + 4 * arc;
  const right = (horizontal + arc + vertical / 2) / perimeter;
  return { left: right + .5, right, perimeter };
}
export function getBeamTrailFrame(phase: number) {
  const profile = beamTrailProfile;
  const progress = Math.max(0, Math.min(1, (phase - profile.travelStart) / (profile.travelEnd - profile.travelStart)));
  const opacity = smoothstep(phase / profile.appearEnd)
    * (1 - profile.travelDimming * progress)
    * (1 - smoothstep((phase - profile.fadeStart) / (profile.fadeEnd - profile.fadeStart)));
  return { progress, opacity };
}
export function getBeamTrailExposure(position: number, phase: number, leftMidpoint = .75): number {
  const frame = getBeamTrailFrame(phase);
  if (frame.opacity === 0) return 0;
  let strength = 0;
  for (const direction of [1, -1]) {
    const distance = fract(direction * (position - leftMidpoint));
    // Each front owns only its half-path. No wrapping past the right midpoint.
    if (distance > .5 + 1e-9) continue;
    const behind = frame.progress * .5 - Math.min(.5, distance);
    const profile = behind < 0
      ? 1 - smoothstep(-behind / beamTrailProfile.feather)
      : 1 - smoothstep((behind / beamTrailProfile.length - .15) / .85);
    strength = Math.max(strength, profile);
  }
  // Max instead of addition prevents a brightness flash where the fronts meet.
  return strength * frame.opacity;
}

/** Transparent product foreground only; Toolcraft owns the workspace/background. */
export function paintBeamNode(ctx: PaintContext, settings: BeamSettings, phase: number, hue = -30): void {
  const node = getBeamNodeRect(settings), radius = radiusFor(settings, node);
  const dark = settings.theme === "dark";
  const perimeter = sampleBeamPerimeter(settings);
  ctx.save();
  nodePath(ctx, node, radius);
  ctx.fillStyle = dark ? "#202123" : "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = dark ? "#37383D" : "#E3E4EB";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  nodePath(ctx, node, radius);
  ctx.clip();
  paintInwardLight(ctx, settings, phase, hue, node, perimeter);
  ctx.restore();
  paintGradientBorder(ctx, settings, phase, hue, node, radius, perimeter);
  ctx.restore();
}

function paintInwardLight(ctx: PaintContext, settings: BeamSettings, phase: number, hue: number, node: BeamRect, perimeter: readonly BeamPoint[]): void {
  const dark = settings.theme === "dark";
  if (settings.spread > 0 && settings.intensity > 0) {
    const spread = settings.spread + settings.blur * 1.6;
    const reach = Math.max(4, spread);
    const density = Math.max(node.width, node.height) / 380;
    const styleGain = settings.style === "neon" ? 1.5 : settings.style === "crisp" ? 0.48 : 1;
    // Keep adjacent light kernels close enough to overlap smoothly on every
    // node size. Normalize their contribution so denser sampling changes
    // smoothness without accidentally increasing the authored intensity.
    const perimeterLength = perimeter.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - perimeter[index].x, point.y - perimeter[index].y), 0);
    const lightCount = Math.min(256, Math.max(36, Math.ceil(perimeterLength / Math.max(3, reach * 0.3))));
    const lightStep = Math.max(1, Math.floor((perimeter.length - 1) / lightCount));
    const sampleGain = 36 / Math.ceil((perimeter.length - 1) / lightStep);
    for (let index = 0; index < perimeter.length - 1; index += lightStep) {
      const point = perimeter[index];
      const { color, exposure } = getBeamOpticalSample(settings, point, phase, hue, node);
      const strength = (settings.intensity / 55) * exposure * styleGain * (dark ? 0.30 : 0.22) * density * sampleGain;
      const light = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, reach);
      light.addColorStop(0, cssColor(color, strength));
      light.addColorStop(0.16, cssColor(color, strength * 0.81));
      light.addColorStop(0.42, cssColor(color, strength * 0.40));
      light.addColorStop(0.72, cssColor(color, strength * 0.085));
      light.addColorStop(1, cssColor(color, 0));
      ctx.fillStyle = light;
      ctx.fillRect(point.x - reach, point.y - reach, reach * 2, reach * 2);
    }
  }
}

function paintGradientBorder(ctx: PaintContext, settings: BeamSettings, phase: number, hue: number, node: BeamRect, radius: number, perimeter: readonly BeamPoint[]): void {
  const dark = settings.theme === "dark";
  // One closed stroke avoids seams from overlapping semi-transparent segments.
  // Project the shared reference field onto a closed stroke; no segment seams.
  const startAngle = Math.atan2(perimeter[0].y, perimeter[0].x);
  const border = ctx.createConicGradient(startAngle, 0, 0);
  nodePath(ctx, node, radius);
  const brightness = settings.style === "neon" ? 1.4 : settings.style === "crisp" ? 1.1 : 1;
  for (let index = 0; index < perimeter.length; index++) {
    const point = perimeter[index];
    const angularPosition = index === 0 ? 0 : index === perimeter.length - 1 ? 1
      : fract((Math.atan2(point.y, point.x) - startAngle) / TAU);
    const { color, exposure } = getBeamOpticalSample(settings, point, phase, hue, node);
    const alpha = settings.motion === "trail"
      ? exposure * (dark ? 1 : 0.96) * brightness
      : exposure * brightness * (dark ? 0.46 : 0.90);
    border.addColorStop(angularPosition, cssColor(color, alpha));
  }
  if (settings.motion === "trail" && settings.style !== "crisp" && settings.spread > 0 && settings.intensity > 0) {
    // A feather hugging the same closed stroke rounds the highlights visually.
    // Clip all extra width inward: no external halo or scene-bound truncation.
    ctx.save();
    nodePath(ctx, node, radius); ctx.clip();
    ctx.strokeStyle = border;
    const gain = settings.intensity / 55 * (settings.style === "neon" ? 1.5 : 1);
    ctx.lineWidth = settings.borderWidth + Math.min(settings.spread, settings.blur * 1.2);
    ctx.globalAlpha = 0.10 * gain; ctx.stroke();
    ctx.lineWidth = settings.borderWidth + Math.min(settings.spread, settings.blur * 0.55);
    ctx.globalAlpha = 0.20 * gain; ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = settings.borderWidth;
  ctx.strokeStyle = border;
  ctx.stroke();
}
