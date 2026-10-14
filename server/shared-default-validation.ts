import { appSchema } from "../src/app/app-schema";
import { parseToolcraftSettingsPayload } from "../src/toolcraft/runtime/react/app-shell/settings-transfer";
import { getToolcraftValueControls, normalizeToolcraftControlValue } from "../src/toolcraft/runtime/state/control-value-normalization";
export function validateSharedSettings(value: unknown) {
  const parsed = parseToolcraftSettingsPayload(appSchema, value);
  if (!parsed || parsed.attachments.length !== 0) return null;
  const controls = getToolcraftValueControls(appSchema);
  for (const [target, candidate] of Object.entries(parsed.values)) {
    const control = controls.get(target);
    if (!control || target === "beam.developerHandoff" || target === "beam.sharedDefault" || target === "beam.presetName") return null;
    const normalized = normalizeToolcraftControlValue(control, candidate);
    if (!normalized.accepted || JSON.stringify(normalized.value) !== JSON.stringify(candidate)) return null;
  }
  return parsed;
}

