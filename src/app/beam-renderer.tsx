import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  getToolcraftTimelineLoopProgress,
  type ToolcraftProductSceneBoundsProvider,
} from "@/toolcraft/runtime";
import { useToolcraftEvaluatedValues, useToolcraftPipeline, useToolcraftProductSceneFrame, useToolcraftSelector, useToolcraftViewportInteractionActive } from "@/toolcraft/runtime/react";
import { getBeamPhase, getBeamSceneRect } from "./beam-paint";
import { referenceHue } from "./beam-reference";
import { resolveBeamSettings } from "./beam-types";
import { BeamRenderQueue } from "./beam-render-queue";
import styles from "./beam-renderer.module.css";

export const beamSceneBoundsProvider: ToolcraftProductSceneBoundsProvider = ({ state }) => [getBeamSceneRect(resolveBeamSettings(state.values))];

/** One retained worker; latest request wins without changing native playback state. */
export function BeamCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useToolcraftProductSceneFrame();
  const values = useToolcraftEvaluatedValues();
  const timeline = useToolcraftSelector((state) => state.timeline);
  const zoom = useToolcraftSelector((state) => state.canvas.zoom);
  const renderScale = typeof values["canvas.renderScale"] === "number" ? values["canvas.renderScale"] : 2;
  const pipeline = useToolcraftPipeline();
  const viewportActive = useToolcraftViewportInteractionActive();
  const reducedMotion = useReducedMotion();
  const [error, setError] = useState<string | null>(null);
  const dpr = window.devicePixelRatio || 1;
  const settings = resolveBeamSettings(values);
  const progress = getToolcraftTimelineLoopProgress(timeline);
  const phase = reducedMotion ? 0.18 : getBeamPhase(progress, settings, timeline.durationSeconds);
  const hue = reducedMotion || settings.motion === "static" ? 0 : referenceHue(progress, timeline.durationSeconds);
  const queue = useMemo(() => pipeline ? new BeamRenderQueue(pipeline, canvas, setError) : null, [pipeline]);
  const sequence = useRef(0);
  const heldViewportBacking = useRef("");
  const queuedRenderKey = useRef("");

  useEffect(() => {
    queue?.resume();
    queuedRenderKey.current = "";
    return () => queue?.stop();
  }, [queue]);

  useEffect(() => {
    if (frame.kind !== "ready" || !queue || !canvas.current) return;
    const scale = (zoom / 100) * renderScale * dpr;
    const pixelWidth = Math.max(1, Math.round(frame.rect.width * scale));
    const pixelHeight = Math.max(1, Math.round(frame.rect.height * scale));
    const backingKey = `${pixelWidth}:${pixelHeight}`;
    if (viewportActive && heldViewportBacking.current === backingKey) return;
    heldViewportBacking.current = backingKey;
    const renderKey = JSON.stringify([settings, phase, hue, timeline.durationSeconds, frame.rect, pixelWidth, pixelHeight]);
    if (renderKey === queuedRenderKey.current) return;
    queuedRenderKey.current = renderKey;
    queue.enqueue({ id: ++sequence.current, settings, phase, hue, cycleDuration: timeline.durationSeconds, rect: frame.rect, pixelWidth, pixelHeight });
  }, [values, timeline, frame, phase, hue, zoom, renderScale, dpr, queue, viewportActive]);

  if (frame.kind !== "ready") return null;
  if (error) return <span className={styles.failure} role="status">{error}</span>;
  return <canvas ref={canvas} className={styles.output} data-testid="beam-preview" data-toolcraft-product-output aria-label="Generating node with gradient border and inward light" />;
}
