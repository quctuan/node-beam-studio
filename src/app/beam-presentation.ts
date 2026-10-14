import type { useToolcraftPipeline } from "@/toolcraft/runtime/react";
import type { ToolcraftRendererPipelinePassExecutionContext } from "@/toolcraft/runtime";
import { beamPipelineRegistration } from "./app-performance";
import { createBeamWorker, disposeBeamWorker, drawBeamWorker, type BeamWorkerHandle } from "./beam-worker-client";
import type { BeamPaintRequest, BeamPaintResponse } from "./beam-worker";

export type BeamPipeline = NonNullable<ReturnType<typeof useToolcraftPipeline>>;
const workerPass = beamPipelineRegistration.getPass("beam-worker");
const backingPass = beamPipelineRegistration.getPass("beam-backing");
const compositePass = beamPipelineRegistration.getPass("beam-composite");
const presentPass = beamPipelineRegistration.getPass("beam-present");

function retainBeamWorker(context: ToolcraftRendererPipelinePassExecutionContext<typeof workerPass>): Promise<BeamWorkerHandle> {
  return context.getOrCreateResource(["node-beam"], createBeamWorker, disposeBeamWorker);
}

export async function renderBeamFrame(pipeline: BeamPipeline, request: BeamPaintRequest, resize: boolean): Promise<BeamPaintResponse> {
  const worker = await pipeline.runPass(workerPass, { renderer: "node-beam" }, retainBeamWorker);
  if (resize) {
    const resized = await pipeline.runPass(backingPass, undefined, () => drawBeamWorker(worker, { ...request, backingOnly: true }));
    if ("error" in resized) throw new Error(resized.error);
  }
  return pipeline.runPass(compositePass, undefined, () => drawBeamWorker(worker, request));
}

/** Native canvas and bitmap identity stay explicit through presentation. */
export async function presentBeamFrame(pipeline: BeamPipeline, target: HTMLCanvasElement, bitmap: ImageBitmap, request: BeamPaintRequest): Promise<void> {
  await pipeline.runPass(presentPass, undefined, () => {
    if (target.width !== bitmap.width) target.width = bitmap.width;
    if (target.height !== bitmap.height) target.height = bitmap.height;
    const context = target.getContext("bitmaprenderer");
    if (!context) { bitmap.close(); throw new Error("ImageBitmap presentation is unavailable in this browser."); }
    context.transferFromImageBitmap(bitmap);
    target.dataset.phase = String(request.phase);
    target.dataset.cycleDuration = String(request.cycleDuration);
    target.dataset.theme = request.settings.theme;
    target.dataset.shape = request.settings.shape;
    target.dataset.motion = request.settings.motion;
    target.dataset.ready = "true";
  });
  pipeline.recordTransfer(presentPass);
}

export function beamRenderError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
