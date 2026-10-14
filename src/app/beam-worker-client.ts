import type { BeamPaintRequest, BeamPaintResponse } from "./beam-worker";

export type BeamWorkerHandle = number;
const workers: Record<BeamWorkerHandle, Worker | undefined> = {};
let nextHandle = 0;

/** Keep native messaging authority private; the pipeline retains a lease id. */
export function createBeamWorker(): BeamWorkerHandle {
  const worker: Worker = new Worker(new URL("./beam-worker.ts", import.meta.url), { type: "module" });
  const handle = ++nextHandle;
  workers[handle] = worker;
  return handle;
}

export function disposeBeamWorker(handle: BeamWorkerHandle): void {
  workers[handle]?.terminate();
  delete workers[handle];
}

function requireBeamWorker(handle: BeamWorkerHandle): Worker {
  const worker = workers[handle];
  if (!worker) throw new Error("The beam worker lease has been released.");
  return worker;
}

/** One in-flight request owns the retained worker's native message handlers. */
export function drawBeamWorker(handle: BeamWorkerHandle, request: BeamPaintRequest): Promise<BeamPaintResponse> {
  return new Promise((resolve, reject) => {
    const worker: Worker = requireBeamWorker(handle);
    worker.onmessage = (event: MessageEvent<BeamPaintResponse>) => {
      if (event.data.id !== request.id) return;
      worker.onmessage = null;
      worker.onerror = null;
      resolve(event.data);
    };
    worker.onerror = (event: ErrorEvent) => {
      worker.onmessage = null;
      worker.onerror = null;
      reject(new Error(event.message || "Beam renderer could not finish a frame."));
    };
    worker.postMessage(request);
  });
}
