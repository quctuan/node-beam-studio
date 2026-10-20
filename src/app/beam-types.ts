import type { ToolcraftGradientValue } from "@/toolcraft/runtime";

export const beamTargets = {
  theme: "beam.theme",
  aspect: "beam.aspect",
  shape: "beam.shape",
  width: "beam.width",
  radius: "beam.radius",
  motion: "beam.motion",
  speed: "beam.speed",
  easing: "beam.easing",
  palette: "beam.palette",
  gradient: "beam.gradient",
  fioraGradient: "beam.fioraGradient",
  spectrumGradient: "beam.spectrumGradient",
  cyanGradient: "beam.cyanGradient",
  spread: "beam.spread",
  intensity: "beam.intensity",
  blur: "beam.blur",
  borderWidth: "beam.borderWidth",
  style: "beam.style",
  background: "beam.background",
  includeBackground: "export.includeBackground",
} as const;

export type BeamTheme = "light" | "dark";
export type BeamAspect = "square" | "wide" | "portrait";
export type BeamShape = "rounded" | "rectangle" | "circle";
export type BeamMotion = "orbit" | "trail" | "breathing" | "static";
export type BeamEasing = "linear" | "ease";
export type BeamPalette = "spectrum" | "fiora" | "cyan" | "custom";
export type BeamStyle = "soft" | "neon" | "crisp";

export type BeamSettings = Readonly<{
  theme: BeamTheme;
  aspect: BeamAspect;
  shape: BeamShape;
  width: number;
  radius: number;
  motion: BeamMotion;
  speed: number;
  easing: BeamEasing;
  palette: BeamPalette;
  gradient: ToolcraftGradientValue;
  colors: readonly string[];
  spread: number;
  intensity: number;
  blur: number;
  borderWidth: number;
  style: BeamStyle;
  background: string;
  includeBackground: boolean;
}>;

export const beamPaletteColors: Readonly<Record<Exclude<BeamPalette, "custom">, readonly string[]>> = {
  spectrum: ["#FF5D8F", "#F5B64C", "#31CBE0", "#9259F7"],
  fiora: ["#EC379A", "#F58FC5"],
  cyan: ["#19C6E8", "#507CF6", "#B175F3", "#30DBC4"],
};

/** Fiora adopts the Custom setup saved in the shared Loading node preset. */
export const beamDefaultGradient: ToolcraftGradientValue = {
  angle: 0,
  gradientType: "linear",
  stops: beamPaletteColors.fiora.map((color, index) => ({
    color, opacity: 100, position: `${index * 100}%`,
  })),
};
const angularGradient = (colors: readonly string[]): ToolcraftGradientValue => ({
  angle: 0, gradientType: "angular",
  stops: colors.map((color, index) => ({ color, opacity: 100, position: `${Math.round(index * 100 / (colors.length - 1))}%` })),
});
export const beamPaletteGradients: Readonly<Record<BeamPalette, ToolcraftGradientValue>> = {
  fiora: beamDefaultGradient,
  spectrum: angularGradient(beamPaletteColors.spectrum),
  cyan: angularGradient(beamPaletteColors.cyan),
  custom: beamDefaultGradient,
};
export const beamPaletteGradientTargets = {
  fiora: beamTargets.fioraGradient, spectrum: beamTargets.spectrumGradient,
  cyan: beamTargets.cyanGradient, custom: beamTargets.gradient,
} as const;

export const beamDefaults = {
  theme: "light" as const,
  aspect: "square" as const,
  shape: "rounded" as const,
  width: 380,
  radius: 16,
  motion: "orbit" as const,
  speed: 1,
  easing: "linear" as const,
  palette: "fiora" as const,
  gradient: beamDefaultGradient,
  fioraGradient: beamPaletteGradients.fiora,
  spectrumGradient: beamPaletteGradients.spectrum,
  cyanGradient: beamPaletteGradients.cyan,
  spread: 28,
  intensity: 55,
  blur: 12,
  borderWidth: 2,
  style: "soft" as const,
  background: "#F6F7F8",
  includeBackground: false,
};

const choices = <T extends string>(value: unknown, accepted: readonly T[], fallback: T): T =>
  typeof value === "string" && accepted.includes(value as T) ? value as T : fallback;

const numeric = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const isGradient = (value: unknown): value is ToolcraftGradientValue => {
  if (!value || typeof value !== "object") return false;
  const gradient = value as ToolcraftGradientValue;
  return Number.isFinite(gradient.angle)
    && ["linear", "radial", "angular", "diamond"].includes(gradient.gradientType)
    && Array.isArray(gradient.stops)
    && gradient.stops.length >= 2
    && gradient.stops.every((stop) => typeof stop.color === "string"
      && /^#[0-9A-F]{6}$/i.test(stop.color) && typeof stop.position === "string");
};

/** Read canonical runtime values; callback payloads stay owned by Toolcraft. */
export function resolveBeamSettings(values: Readonly<Record<string, unknown>>): BeamSettings {
  const palette = choices(values[beamTargets.palette], ["spectrum", "fiora", "cyan", "custom"], beamDefaults.palette);
  const authoredGradient = values[beamPaletteGradientTargets[palette]];
  const gradient = isGradient(authoredGradient) ? authoredGradient : beamPaletteGradients[palette];
  const background = values[beamTargets.background];
  const includeBackground = values[beamTargets.includeBackground];
  return {
    theme: choices(values[beamTargets.theme], ["light", "dark"], beamDefaults.theme),
    aspect: choices(values[beamTargets.aspect], ["square", "wide", "portrait"], beamDefaults.aspect),
    shape: choices(values[beamTargets.shape], ["rounded", "rectangle", "circle"], beamDefaults.shape),
    width: numeric(values[beamTargets.width], beamDefaults.width, 300, 640),
    radius: numeric(values[beamTargets.radius], beamDefaults.radius, 0, 64),
    motion: choices(values[beamTargets.motion], ["orbit", "trail", "breathing", "static"], beamDefaults.motion),
    speed: numeric(values[beamTargets.speed], beamDefaults.speed, 0.25, 3),
    easing: choices(values[beamTargets.easing], ["linear", "ease"], beamDefaults.easing),
    palette,
    gradient,
    colors: gradient.stops.map((stop) => stop.color),
    spread: numeric(values[beamTargets.spread], beamDefaults.spread, 0, 100),
    intensity: numeric(values[beamTargets.intensity], beamDefaults.intensity, 0, 100),
    blur: numeric(values[beamTargets.blur], beamDefaults.blur, 2, 24),
    borderWidth: numeric(values[beamTargets.borderWidth], beamDefaults.borderWidth, 1, 8),
    style: choices(values[beamTargets.style], ["soft", "neon", "crisp"], beamDefaults.style),
    background: typeof background === "string" && /^#[0-9A-F]{6}$/i.test(background) ? background : beamDefaults.background,
    includeBackground: typeof includeBackground === "boolean"
      ? includeBackground : beamDefaults.includeBackground,
  };
}
