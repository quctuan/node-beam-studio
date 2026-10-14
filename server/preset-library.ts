export type SavedPreset = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: unknown;
  playing: boolean;
  deletedAt?: string;
};
export type PresetLibrary = { version: 2; revision: string; defaultPresetId: string | null; presets: SavedPreset[] };
export type LegacyDefault = { version: 1; revision: string; updatedAt: string; settings: unknown; playing: boolean };
export class PresetConflictError extends Error {}
export type PresetStorage = {
  read(): Promise<{ value: unknown; etag: string | null }>;
  write(value: PresetLibrary, etag: string | null): Promise<void>;
};
export function readPresetLibrary(value: unknown, validate: (settings: unknown) => unknown | null): PresetLibrary {
  if (value === null) return { version: 2, revision: 'empty', defaultPresetId: null, presets: [] };
  if (!value || typeof value !== 'object') throw new Error('Invalid preset library.');
  const record = value as PresetLibrary | LegacyDefault;
  if (record.version === 1) {
    const settings = validate(record.settings);
    if (!settings || typeof record.updatedAt !== 'string' || typeof record.playing !== 'boolean') throw new Error('Invalid legacy default.');
    return { version: 2, revision: record.revision, defaultPresetId: 'legacy-default', presets: [{ id: 'legacy-default', name: 'Original default', settings, playing: record.playing, createdAt: record.updatedAt, updatedAt: record.updatedAt }] };
  }
  if (record.version !== 2 || typeof record.revision !== 'string' || !Array.isArray(record.presets) || record.presets.length > 100 || (record.defaultPresetId !== null && typeof record.defaultPresetId !== 'string')) throw new Error('Invalid preset library.');
  const ids = new Set<string>();
  for (const preset of record.presets) {
    if (!preset || typeof preset.id !== 'string' || ids.has(preset.id) || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 80 || typeof preset.playing !== 'boolean' || !Number.isFinite(Date.parse(preset.createdAt)) || !Number.isFinite(Date.parse(preset.updatedAt)) || (preset.deletedAt !== undefined && !Number.isFinite(Date.parse(preset.deletedAt))) || !validate(preset.settings)) throw new Error('Invalid saved preset.');
    ids.add(preset.id);
  }
  if (record.defaultPresetId && !record.presets.some(preset => preset.id === record.defaultPresetId && !preset.deletedAt)) throw new Error('Missing default preset.');
  return record;
}
