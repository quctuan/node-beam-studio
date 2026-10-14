import type { BeamSettings } from "./beam-types";

type Rgba = readonly [number, number, number, number];
export const referenceOrbitSeconds = 1.96;
// 24 turns: every quarter-step Speed closes exactly at the transport seam.
export const referenceTransportSeconds = referenceOrbitSeconds * 24;
const fract = (value: number) => ((value % 1) + 1) % 1;

// The accepted synchronized-beam.ts field, including the original spot sizes.
// Positions are percentages of the box; radii are CSS pixels, as in that demo.
const spots = [
  [70, 40, .33, -.074, "#FF3264", 0],
  [60, 35, .12, -.05, "#288CFF", 2],
  [40, 70, .021, .683, "#32C850", 3],
  [20, 35, .021, .683, "#1EB9AA", 3],
  [180, 32, .744, 1, "#6446FF", 1],
  [85, 26, .55, 1, "#288CFF", 2],
  [74, 32, .939, 0, "#FF7828", 0],
  [26, 42, 1, .271, "#F032B4", 0],
  [52, 48, 1, .271, "#B428F0", 1],
] as const;
const windowStops = [[0, 0], [.30, 0], [.36, .1], [.44, .35], [.52, 1], [.80, 1], [.86, .35], [.92, .1], [.95, 0], [1, 0]] as const;
const carrierStops = [[0, 0], [.54, 0], [.57, .1], [.60, .3], [.63, .6], [.66, .75], [.69, .6], [.72, .3], [.75, .1], [.78, 0], [1, 0]] as const;
const darkCarrierStops = [[0, 0], [.54, 0], [.57, .03], [.60, .08], [.63, .16], [.66, .22], [.69, .16], [.72, .08], [.75, .03], [.78, 0], [1, 0]] as const;

// Read-only developer specification of the same field; rendering is unchanged.
export const beamReferenceModel = { spots, windowStops, carrierStops, darkCarrierStops } as const;

function interpolate(stops: readonly (readonly [number, number])[], t: number): number {
  for (let index = 1; index < stops.length; index++) {
    if (t <= stops[index][0]) {
      const [x, y] = stops[index - 1], [nextX, nextY] = stops[index];
      return y + (nextY - y) * (t - x) / (nextX - x);
    }
  }
  return stops[stops.length - 1][1];
}
export function referenceWindow(angle: number, phase: number): number {
  return interpolate(windowStops, fract(angle - phase));
}
function rgba(hex: string, alpha: number): Rgba {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), alpha];
}
function over(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top[3] + bottom[3] * (1 - top[3]);
  if (!alpha) return [0, 0, 0, 0];
  const color = [0, 1, 2].map(index => (top[index] * top[3] + bottom[index] * bottom[3] * (1 - top[3])) / alpha);
  return [color[0], color[1], color[2], alpha];
}
/** CSS hue-rotate matrix, followed by the accepted saturation/brightness. */
function filter(color: Rgba, hue: number, dark: boolean): Rgba {
  const c = Math.cos(hue * Math.PI / 180), s = Math.sin(hue * Math.PI / 180);
  const [r, g, b, alpha] = color;
  const rotated = [
    (.213 + c * .787 - s * .213) * r + (.715 - c * .715 - s * .715) * g + (.072 - c * .072 + s * .928) * b,
    (.213 - c * .213 + s * .143) * r + (.715 + c * .285 + s * .140) * g + (.072 - c * .072 - s * .283) * b,
    (.213 - c * .213 - s * .787) * r + (.715 - c * .715 + s * .715) * g + (.072 + c * .928 + s * .072) * b,
  ];
  const luma = rotated[0] * .213 + rotated[1] * .715 + rotated[2] * .072;
  const saturation = dark ? 1.2 : 1.5, brightness = dark ? 1.3 : 1;
  const rgb = rotated.map(value => Math.max(0, Math.min(255, (luma + saturation * (value - luma)) * brightness)));
  return [rgb[0], rgb[1], rgb[2], alpha];
}
export function referenceField(settings: BeamSettings, x: number, y: number, width: number, height: number, angle: number, phase: number, hue: number): Rgba {
  let color: Rgba = [0, 0, 0, 0];
  // CSS backgrounds paint the first listed spot on top.
  for (let index = spots.length - 1; index >= 0; index--) {
    const [rx, ry, px, py, original, paletteIndex] = spots[index];
    const distance = Math.hypot((x + width / 2 - width * px) / rx, (y + height / 2 - height * py) / ry);
    const hex = settings.palette === "spectrum" ? original : settings.colors[paletteIndex % settings.colors.length];
    color = over(rgba(hex, Math.max(0, 1 - distance)), color);
  }
  const dark = settings.theme === "dark";
  const carrier = interpolate(dark ? darkCarrierStops : carrierStops, fract(angle - phase));
  color = over(dark ? [100, 70, 255, carrier] : [103, 80, 221, carrier], color);
  return filter(color, hue, dark);
}

/** CSS ease-in-out (.42,0,.58,1), solved in x rather than substituting a sine. */
export function referenceHue(progress: number, duration: number): number {
  const cycle = fract(progress * Math.max(1, Math.round(duration / 12)));
  const half = cycle < .5 ? cycle * 2 : (1 - cycle) * 2;
  let left = 0, right = 1;
  for (let step = 0; step < 18; step++) {
    const t = (left + right) / 2;
    const x = 3 * (1 - t) ** 2 * t * .42 + 3 * (1 - t) * t ** 2 * .58 + t ** 3;
    if (x < half) left = t; else right = t;
  }
  const t = (left + right) / 2;
  return -30 + 60 * (3 * (1 - t) * t ** 2 + t ** 3);
}
