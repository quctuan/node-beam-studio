import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { PresetConflictError, readPresetLibrary, type PresetStorage } from './preset-library';

type Operation = { operation?: unknown; id?: unknown; name?: unknown; settings?: unknown; settingsJson?: unknown; playing?: unknown };
class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
export function createSharedDefaultHandler(options: { storage: PresetStorage; validate: (value: unknown) => unknown | null; now?: () => number }) {
  const now = options.now ?? Date.now;
  function send(res: ServerResponse, code: number, body: unknown) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Clear the old session if a browser still has it. It grants no permission.
    res.setHeader('Set-Cookie', '__Host-nodebeam-admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    const result = body as { library?: import('./preset-library').PresetLibrary; selectedId?: string | null; error?: string };
    if (result.library) {
      const library = result.library;
      res.end(JSON.stringify({ library: { version: 2, revision: library.revision, defaultPresetId: library.defaultPresetId, presets: Object.fromEntries(library.presets.map(preset => [preset.id, { id: preset.id, name: preset.name, createdAt: preset.createdAt, updatedAt: preset.updatedAt, playing: preset.playing, settingsJson: JSON.stringify(preset.settings), ...(preset.deletedAt ? { deletedAt: preset.deletedAt } : {}) }])) }, ...(result.selectedId === undefined ? {} : { selectedId: result.selectedId }) }));
    } else { res.end(JSON.stringify(body)); }
  }
  async function body(req: IncomingMessage) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new RequestError(400, 'Use a JSON request.');
    let size = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 256 * 1024) throw new RequestError(413, 'Preset is too large.');
      chunks.push(Buffer.from(chunk));
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Operation; }
    catch { throw new RequestError(400, 'Invalid JSON request.'); }
  }
  return async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'GET') {
      try { const stored = await options.storage.read(); return send(res, 200, { library: readPresetLibrary(stored.value, options.validate) }); }
      catch { return send(res, 503, { error: 'Could not load saved presets. Please retry.' }); }
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'Method not allowed.' }); }
    // This is a public website workflow. Origin validation is not login/authentication.
    if (req.headers.origin !== `https://${req.headers.host}` || req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { error: 'Use the preset actions on this website.' });
    try {
      const input = await body(req);
      if (!input || !['save', 'rename', 'delete', 'restore', 'set-default'].includes(String(input.operation))) throw new RequestError(400, 'Unknown preset action.');
      const operation = String(input.operation);
      if (input.id !== null && input.id !== undefined && (typeof input.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(input.id))) throw new RequestError(400, 'Invalid preset ID.');
      const id = typeof input.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(input.id) ? input.id : operation === 'save' ? randomUUID() : null;
      if (!id && operation !== 'set-default') throw new RequestError(400, 'Choose a saved preset first.');
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (['save', 'rename'].includes(operation) && (!name || name.length > 80)) throw new RequestError(400, 'Enter a preset name (up to 80 characters).');
      let authoredSettings = input.settings;
      if (typeof input.settingsJson === 'string') {
        try { authoredSettings = JSON.parse(input.settingsJson); } catch { throw new RequestError(400, 'Invalid preset settings.'); }
      }
      const settings = ['save', 'set-default'].includes(operation) ? options.validate(authoredSettings) : null;
      if (['save', 'set-default'].includes(operation) && (!settings || typeof input.playing !== 'boolean')) throw new RequestError(400, 'Invalid preset settings.');
      const stamp = new Date(now()).toISOString();
      // Stable ID survives conditional-write retries; concurrent saves cannot erase sets.
      const newId = id ?? randomUUID();
      for (let attempt = 0; attempt < 3; attempt++) {
        const stored = await options.storage.read();
        const previous = readPresetLibrary(stored.value, options.validate);
        const library = structuredClone(previous);
        let preset = library.presets.find(item => item.id === newId);
        if (['rename', 'delete', 'restore'].includes(operation) && !preset) throw new RequestError(404, 'This preset no longer exists. Refresh the list.');
        if (preset?.deletedAt && operation !== 'restore') throw new RequestError(409, 'This preset has been deleted. Restore it first.');
        if (['save', 'rename'].includes(operation) && library.presets.some(item => !item.deletedAt && item.id !== newId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new RequestError(409, 'This name is already used. Choose another name.');
        if (operation === 'save' || operation === 'set-default') {
          if (operation === 'save' && preset) return send(res, 200, { library, selectedId: preset.id });
          if (!preset) {
            if (library.presets.length >= 100) throw new RequestError(409, 'The shared library has reached 100 presets.');
            let nextName = name || `Preset ${library.presets.length + 1}`;
            if (library.presets.some(item => !item.deletedAt && item.name.toLocaleLowerCase() === nextName.toLocaleLowerCase())) nextName = `Preset ${stamp}`;
            preset = { id: newId, name: nextName, settings, playing: input.playing as boolean, createdAt: stamp, updatedAt: stamp };
            library.presets.push(preset);
          } else { preset.settings = settings; preset.playing = input.playing as boolean; preset.updatedAt = stamp; }
          if (operation === 'set-default') library.defaultPresetId = preset.id;
        }
        if (operation === 'rename' && preset) { preset.name = name; preset.updatedAt = stamp; }
        if (operation === 'delete' && preset) {
          // Recoverable removal preserves all settings; deleting default clears only startup selection.
          preset.deletedAt = stamp;
          if (library.defaultPresetId === preset.id) library.defaultPresetId = null;
        }
        if (operation === 'restore' && preset) {
          if (library.presets.some(item => !item.deletedAt && item.id !== preset!.id && item.name.toLocaleLowerCase() === preset!.name.toLocaleLowerCase())) {
            const base = preset.name.slice(0, 60); let suffix = 1;
            do { preset.name = `${base} (restored ${suffix++})`; } while (library.presets.some(item => !item.deletedAt && item.id !== preset!.id && item.name.toLocaleLowerCase() === preset!.name.toLocaleLowerCase()));
          }
          delete preset.deletedAt; preset.updatedAt = stamp;
        }
        library.revision = randomUUID();
        try { await options.storage.write(library, stored.etag); return send(res, 200, { library, selectedId: operation === 'delete' ? null : newId }); }
        catch (error) { if (error instanceof PresetConflictError) continue; throw error; }
      }
      return send(res, 409, { error: 'Another visitor saved at the same time. Please retry.' });
    } catch (error) {
      return send(res, error instanceof RequestError ? error.status : 503, { error: error instanceof RequestError ? error.message : 'Saving failed. Your previous presets are preserved; please retry.' });
    }
  };
}
