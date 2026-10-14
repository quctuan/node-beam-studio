import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from '@vercel/blob';
import { createSharedDefaultHandler } from './shared-default-handler';
import { PresetConflictError } from './preset-library';
import { validateSharedSettings } from './shared-default-validation';
const pathname = 'node-beam/shared-default.json';
export default createSharedDefaultHandler({
  validate: validateSharedSettings,
  storage: {
    async read() {
      // Read the mutation API's version tag before the uncached body. A later change
      // causes conditional put to fail instead of replacing a newer snapshot.
      let metadata;
      try { metadata = await head(pathname); }
      catch (error) { if (error instanceof BlobNotFoundError) return { value: null, etag: null }; throw error; }
      const result = await get(pathname, { access: 'private', useCache: false });
      if (!result || !result.stream) return { value: null, etag: null };
      return { value: await new Response(result.stream).json(), etag: metadata.etag };
    },
    async write(library, etag) {
      try {
        await put(pathname, JSON.stringify(library), { access: 'private', addRandomSuffix: false, ...(etag ? { ifMatch: etag } : { allowOverwrite: false }), contentType: 'application/json', cacheControlMaxAge: 0 });
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) throw new PresetConflictError('Concurrent update.');
        throw error;
      }
    },
  },
});
