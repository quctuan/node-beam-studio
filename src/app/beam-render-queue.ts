import type { RefObject } from "react";
import { beamRenderError, presentBeamFrame, renderBeamFrame, type BeamPipeline } from "./beam-presentation";
import type { BeamPaintRequest } from "./beam-worker";

/** A single consumer coalesces edits while a retained worker finishes a frame. */
export class BeamRenderQueue {
  private pending: BeamPaintRequest | null = null;
  private busy = false;
  private live = false;
  private previousBacking = "";

  constructor(
    private readonly pipeline: BeamPipeline,
    private readonly canvas: RefObject<HTMLCanvasElement | null>,
    private readonly reportError: (message: string) => void,
  ) {}

  resume(): void { this.live = true; }
  stop(): void { this.live = false; this.pending = null; }

  enqueue(request: BeamPaintRequest): void {
    this.pending = request;
    if (this.busy || !this.live) return;
    void this.flush();
  }

  private async flush(): Promise<void> {
    this.busy = true;
    try {
      while (this.live && this.pending) {
        const request = this.pending;
        this.pending = null;
        const key = `${request.pixelWidth}:${request.pixelHeight}`;
        const response = await renderBeamFrame(this.pipeline, request, key !== this.previousBacking);
        this.previousBacking = key;
        if ("backingReady" in response) continue;
        if ("error" in response) throw new Error(response.error);
        const target = this.canvas.current;
        if (!this.live || !target) { response.bitmap.close(); continue; }
        await presentBeamFrame(this.pipeline, target, response.bitmap, request);
      }
    } catch (cause) {
      if (this.live) this.reportError(beamRenderError(cause));
      this.pending = null;
    } finally {
      this.busy = false;
    }
  }
}
