import {
  useToolcraftEvaluatedValue,
  useToolcraftSelector,
  useToolcraftTheme,
  useToolcraftValue,
} from "@/toolcraft/runtime/react";
import { CanvasDotPattern } from "@/toolcraft/ui";

import { beamDefaults, beamTargets } from "./beam-types";

/** Only compensate when the native theme's dots would disappear into the fill. */
export function beamWorkspaceContrastColor(background: string, theme: "light" | "dark"): string | undefined {
  const hex = /^#[\da-f]{6}$/i.test(background) ? background : beamDefaults.background;
  const channels = [1, 3, 5].map(start => {
    const srgb = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  const lightBackground = luminance > 0.179;
  if (lightBackground && theme === "dark") return "#000000";
  if (!lightBackground && theme === "light") return "#FFFFFF";
  return undefined;
}

/** Preview-only decoration; the runtime retains the fill and original workspace. */
export function BeamWorkspaceContrast(): React.JSX.Element | null {
  const workspace = useToolcraftValue("canvas.workspaceBackground");
  const includeBackground = useToolcraftValue(beamTargets.includeBackground);
  const background = useToolcraftEvaluatedValue(beamTargets.background);
  const canvas = useToolcraftSelector(state => state.canvas);
  const { resolvedTheme } = useToolcraftTheme();
  const color = beamWorkspaceContrastColor(
    typeof background === "string" ? background : beamDefaults.background,
    resolvedTheme,
  );
  if (workspace !== "dots" || !includeBackground || !color) return null;

  return (
    <div className="pointer-events-none absolute inset-0" data-beam-workspace-contrast="">
      <CanvasDotPattern color={color} offset={canvas.offset} scale={canvas.zoom / 100} />
    </div>
  );
}
