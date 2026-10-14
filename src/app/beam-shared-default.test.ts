import { expect, test } from 'vitest';
import { createToolcraftState } from '@/toolcraft/runtime';
import { appSchema } from './app-schema';
import { captureSharedSettings } from './beam-shared-default';
import { sharedDefaultSection } from './beam-shared-default-schema';
import { validateSharedSettings } from '../../server/shared-default-validation';
import { createSharedDefaultHandler } from '../../server/shared-default-handler';
import { readPresetLibrary, PresetConflictError, type PresetLibrary } from '../../server/preset-library';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';

const settings = () => captureSharedSettings(createToolcraftState(appSchema));
test('public preset library preserves legacy defaults and canonical settings', () => {
  const snapshot = settings(); snapshot.values['beam.speed'] = 2;
  expect(validateSharedSettings(snapshot)).not.toBeNull();
  const migrated = readPresetLibrary({ version: 1, revision: 'old', updatedAt: '2026-10-13T00:00:00.000Z', settings: snapshot, playing: true }, validateSharedSettings);
  expect(migrated.version).toBe(2);
  expect(migrated.defaultPresetId).toBe('legacy-default');
  expect(migrated.presets[0].settings).toEqual(snapshot);
  expect(migrated.presets[0].playing).toBe(true);
  expect(validateSharedSettings({ ...snapshot, values: { ...snapshot.values, 'beam.speed': -1 } })).toBeNull();
  expect(validateSharedSettings({ ...snapshot, appId: 'other' })).toBeNull();
});
test('preset name is a native draft excluded from effect snapshots', () => {
  const state = createToolcraftState(appSchema);
  state.values['beam.presetName'] = 'My preset'; state.values['beam.sharedDefault'] = 'selected';
  const payload = captureSharedSettings(state);
  expect(sharedDefaultSection.controls.name.type).toBe('text');
  expect(payload.values).not.toHaveProperty('beam.presetName');
  expect(payload.values).not.toHaveProperty('beam.sharedDefault');
  expect(payload.values).not.toHaveProperty('beam.developerHandoff');
});
test('public preset publishing uses native actions without auth', () => {
  expect(sharedDefaultSection.controls.publish.actions.map(action => action.value)).toEqual(['beam.savePreset', 'beam.setDefault', 'beam.renamePreset', 'beam.deletePreset']);
});
function fixture() {
  let value: unknown = null; let revision = 0; let fail = false; let conflict = false;
  const handler = createSharedDefaultHandler({ validate: validateSharedSettings, storage: {
    read: async () => ({ value: structuredClone(value), etag: value ? String(revision) : null }),
    write: async (next, etag) => {
      if (fail) throw new Error('storage down');
      if (conflict) { conflict = false; throw new PresetConflictError('retry'); }
      if (etag !== (value ? String(revision) : null)) throw new PresetConflictError('concurrent update');
      value = structuredClone(next); revision++;
    },
  } });
  return {
    get library() { return value as PresetLibrary; },
    set fail(next: boolean) { fail = next; }, set conflict(next: boolean) { conflict = next; },
    async call(operation?: unknown, origin = 'https://nodeanimation.vercel.app') {
      const req = Object.assign(Readable.from(operation === undefined ? [] : [Buffer.from(JSON.stringify(operation))]), { method: operation === undefined ? 'GET' : 'POST', url: '/api/shared-default', headers: { host: 'nodeanimation.vercel.app', origin, 'content-type': 'application/json' } });
      let body = ''; const res = { statusCode: 200, setHeader: () => {}, end: (next: string) => { body = next; } };
      await handler(req as IncomingMessage, res as unknown as ServerResponse);
      return { status: res.statusCode, body: JSON.parse(body) };
    },
  };
}
test('anonymous preset save rename default delete and restore persist exact snapshots', async () => {
  const api = fixture(); const snapshot = settings(); snapshot.values['beam.speed'] = 2;
  expect((await api.call({ operation: 'save', id: 'first', name: 'First', settings: snapshot, playing: true })).status).toBe(200);
  expect((await api.call({ operation: 'save', name: 'FIRST', settings: snapshot, playing: true })).status).toBe(409);
  expect((await api.call({ operation: 'rename', id: 'first', name: 'Renamed' })).status).toBe(200);
  expect(api.library.presets[0].name).toBe('Renamed');
  expect((await api.call({ operation: 'set-default', id: 'first', settings: snapshot, playing: false })).status).toBe(200);
  expect(api.library.defaultPresetId).toBe('first');
  expect(JSON.parse((await api.call()).body.library.presets.first.settingsJson).values['beam.speed']).toBe(2);
  expect((await api.call({ operation: 'delete', id: 'first' })).status).toBe(200);
  expect(api.library.presets[0].deletedAt).toBeTruthy();
  expect(api.library.defaultPresetId).toBeNull();
  expect((await api.call({ operation: 'restore', id: 'first' })).status).toBe(200);
  expect(api.library.presets[0].settings).toEqual(snapshot);
  expect(api.library.presets[0].deletedAt).toBeUndefined();
});
test('concurrent visitor saves and conditional retries never drop another set', async () => {
  const api = fixture(); const snapshot = settings(); api.conflict = true;
  const outcomes = await Promise.all(['a', 'b'].map(id => api.call({ operation: 'save', id, name: id, settings: snapshot, playing: false })));
  expect(outcomes.map(result => result.status)).toEqual([200, 200]);
  expect(api.library.presets.map(preset => preset.id).sort()).toEqual(['a', 'b']);
  // Same submitted ID is idempotent, not another set.
  await api.call({ operation: 'save', id: 'a', name: 'a', settings: snapshot, playing: false });
  expect(api.library.presets).toHaveLength(2);
});
test('invalid public writes and storage failures preserve all prior sets', async () => {
  const api = fixture(); const snapshot = settings();
  await api.call({ operation: 'save', id: 'first', name: 'First', settings: snapshot, playing: false });
  const previous = structuredClone(api.library);
  expect((await api.call({ operation: 'save', name: '', settings: snapshot, playing: true })).status).toBe(400);
  expect((await api.call({ operation: 'save', name: 'Bad', settings: {}, playing: true })).status).toBe(400);
  expect((await api.call({ operation: 'save', name: 'Bad', settings: snapshot, playing: true }, 'https://other.example')).status).toBe(403);
  expect((await api.call({ operation: 'rename', id: 'missing', name: 'Bad' })).status).toBe(404);
  api.fail = true;
  expect((await api.call({ operation: 'save', name: 'Second', settings: snapshot, playing: true })).status).toBe(503);
  expect(api.library).toEqual(previous);
});
