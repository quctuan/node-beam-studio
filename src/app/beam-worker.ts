// The worker uses the shared Worker messaging API only. Avoid merging the
// browser and worker global libraries into the application TypeScript program.
declare const self: Worker;
import { paintBeamNode, type BeamRect } from "./beam-paint";
import type { BeamSettings } from "./beam-types";

export type BeamPaintRequest = Readonly<{ id: number; cycleDuration: number; hue: number; backingOnly?: boolean; settings: BeamSettings; phase: number; rect: BeamRect; pixelWidth: number; pixelHeight: number }>;
export type BeamPaintResponse = Readonly<{ id: number; backingReady: true }> | Readonly<{ id: number; phase: number; bitmap: ImageBitmap; error?: never }> | Readonly<{ id: number; error: string }>;
const surface = new OffscreenCanvas(1, 1);
const ctx = surface.getContext("2d");
self.onmessage = (event: MessageEvent<BeamPaintRequest>) => {
  const request = event.data;
  try {
    if (!ctx) throw new Error("Canvas2D is unavailable in this browser.");
    if (surface.width !== request.pixelWidth) surface.width = request.pixelWidth;
    if (surface.height !== request.pixelHeight) surface.height = request.pixelHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, surface.width, surface.height);
    const sx = surface.width / request.rect.width, sy = surface.height / request.rect.height;
    ctx.setTransform(sx, 0, 0, sy, -request.rect.x * sx, -request.rect.y * sy);
    paintBeamNode(ctx, request.settings, request.phase, request.hue);
    if (request.backingOnly) {
      self.postMessage({ id: request.id, backingReady: true } satisfies BeamPaintResponse);
      return;
    }
    const bitmap = surface.transferToImageBitmap();
    self.postMessage({ id: request.id, bitmap, phase: request.phase } satisfies BeamPaintResponse, [bitmap]);
  } catch (error) {
    self.postMessage({ id: request.id, error: error instanceof Error ? error.message : String(error) } satisfies BeamPaintResponse);
  }
};
