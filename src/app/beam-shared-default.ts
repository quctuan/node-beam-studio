import type { ToolcraftState } from '@/toolcraft/runtime';
import { createToolcraftSettingsPayload, parseToolcraftSettingsPayload, type ToolcraftSettingsTransferPayload } from '@/toolcraft/runtime/react';
import { appSchema } from './app-schema';

export type SavedPreset = { id: string; name: string; createdAt: string; updatedAt: string; settingsJson: string; playing: boolean; deletedAt?: string };
export type PresetLibrary = { version: 2; revision: string; defaultPresetId: string | null; presets: Record<string, SavedPreset> };
export type SharedDefaultStatus = { library: PresetLibrary | null; loading: boolean; error: string | null };
let status: SharedDefaultStatus = { library: null, loading: true, error: null };
const listeners = new Set<() => void>();
export const subscribeSharedDefault = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getSharedDefaultStatus = () => status;
export function updateSharedDefault(patch: Partial<SharedDefaultStatus>) {
  status = { ...status, ...patch };
  for (const listener of listeners) listener();
}
export type PresetMutation = { operation: string; id?: string | null; name?: string; settingsJson?: string; playing?: boolean };
export type PresetServiceResult = { library: PresetLibrary; selectedId?: string | null };
export async function sharedDefaultRequest(body?: PresetMutation): Promise<PresetServiceResult> {
  let serializedBody: string | null = null;
  if (body !== undefined) serializedBody = JSON.stringify(body);
  const options: RequestInit = {
    method: serializedBody === null ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(12000),
    ...(serializedBody === null ? {} : { headers: { 'Content-Type': 'application/json' }, body: serializedBody }),
  };
  const response: Response = await fetch('/api/shared-default', options);
  const result: { library?: PresetLibrary; selectedId?: string | null; error?: string } = await response.json();
  if (result.library) validatePresetLibrary(result.library);
  if (!response.ok || !result.library) {
    const failure = new Error();
    failure.message = result.error ?? 'Saved presets are unavailable. Please retry.';
    throw failure;
  }
  updateSharedDefault({ library: result.library, loading: false, error: null });
  return { library: result.library, selectedId: result.selectedId };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function validatePresetLibrary(library: PresetLibrary): void {
  if (!isRecord(library) || library.version !== 2 || typeof library.revision !== 'string' || (library.defaultPresetId !== null && typeof library.defaultPresetId !== 'string') || !isRecord(library.presets)) throw new Error('Invalid preset library.');
  for (const item of Object.values(library.presets)) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string' || typeof item.playing !== 'boolean' || typeof item.settingsJson !== 'string' || (item.deletedAt !== undefined && typeof item.deletedAt !== 'string')) throw new Error('Invalid saved preset.');
    if (!parseToolcraftSettingsPayload(appSchema, JSON.parse(item.settingsJson))) throw new Error('Invalid saved settings.');
  }
}

export function loadSharedPresets() { return sharedDefaultRequest(); }
export function captureSharedSettings(state: ToolcraftState) {
  const payload = createToolcraftSettingsPayload(state);
  delete payload.values['beam.developerHandoff'];
  delete payload.values['beam.sharedDefault'];
  delete payload.values['beam.presetName'];
  return payload;
}
export function sharedSettingsFingerprint(state: ToolcraftState) {
  const payload = captureSharedSettings(state);
  return JSON.stringify({ values: payload.values, canvas: payload.canvas, duration: payload.timeline.durationSeconds, looping: payload.timeline.isLooping, expanded: payload.timeline.expanded });
}
