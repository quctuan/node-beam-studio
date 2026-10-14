import { useEffect, useMemo, useState } from "react";
import { useToolcraftDispatch, useToolcraftSelector, useToolcraftTheme, useToolcraftValue, type ToolcraftCustomControlRendererProps, type ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";
import { Button, toast, Toaster } from "@/toolcraft/ui";
import { beamHandoffTarget, createBeamHandoff, createPreviewHtml, type BeamHandoff } from "./beam-handoff";
import { resolveBeamSettings } from "./beam-types";
import styles from "./beam-handoff.module.css";

/** Mounted with the scene, so collapsed inspectors cannot make JSON stale. */
export function BeamHandoffSync() {
  const values = useToolcraftSelector(state => state.values);
  const duration = useToolcraftSelector(state => state.timeline.durationSeconds);
  const looping = useToolcraftSelector(state => state.timeline.isLooping);
  const current = useToolcraftValue(beamHandoffTarget);
  const dispatch = useToolcraftDispatch();
  const key = JSON.stringify([resolveBeamSettings(values), duration, looping]);
  const document = useMemo(() => createBeamHandoff(values, duration, looping), [key]);
  useEffect(() => {
    if (current !== document) dispatch({ type: "controls.setValue", target: beamHandoffTarget, value: document, history: "skip" });
  }, [current, document, dispatch]);
  return null;
}

const seconds = (value: number | null) => value === null ? "Off" : `${value.toFixed(3)} s`;

export function BeamHandoffInspector({ state }: ToolcraftCustomControlRendererProps): React.JSX.Element {
  const { resolvedTheme } = useToolcraftTheme();
  const [expanded, setExpanded] = useState(false);
  const settings = resolveBeamSettings(state.values);
  const doc: BeamHandoff = createBeamHandoff(state.values, state.timeline.durationSeconds, state.timeline.isLooping);
  const motion = doc.motion, glow = doc.optics.inwardGlow;
  const restAngle = motion.keyframes.rotation[0]?.unwrappedAngleDegrees ?? 0;
  const points = motion.trail ? motion.keyframes.perimeter.map((frame, index) => `${12 + index * 236 / (motion.keyframes.perimeter.length - 1)},${82 - frame.progress * 64}`).join(" ") : motion.rotationPeriodSeconds === null
    ? `12,${82 - restAngle / 360 * 64} 248,${82 - restAngle / 360 * 64}`
    : motion.keyframes.rotation.map((frame, index) => `${12 + index * 236 / (motion.keyframes.rotation.length - 1)},${82 - frame.unwrappedAngleDegrees / 360 * 64}`).join(" ");
  return (
    <div className={styles.inspector} data-testid="beam-handoff" aria-label="Developer handoff parameters">
      <Toaster theme={resolvedTheme} />
      <p className={styles.note}>Shared border + inward glow clock</p>
      <dl className={styles.parameters}>
        <ParameterRow label={settings.motion === "trail" ? "Cycle period" : "Rotation period"} reading={seconds(motion.rotationPeriodSeconds)} />
        {motion.trail ? <ParameterRow label="Highlights / length" reading={`${motion.trail.count} / ${(motion.trail.length * 100).toFixed(0)}% of perimeter`} /> : null}
        <ParameterRow label="Color cycle" reading={seconds(motion.hue.periodSeconds)} />
        <ParameterRow label="Direction" reading={motion.direction === "split-left-to-right" ? "Split → converge" : motion.direction === "none" ? "Static" : "Clockwise"} />
        {motion.trail ? <ParameterRow label="Converge / disappear" reading={`${seconds(motion.trail.stageTimesSeconds.converge)} / ${seconds(motion.trail.stageTimesSeconds.disappear)}`} /> : null}
        <ParameterRow label="Rhythm" reading={settings.motion === "static" ? "Static" : settings.easing === "ease" ? "Ease · sine phase" : "Linear"} />
        <ParameterRow label="Border" reading={`${doc.geometry.borderWidthPx} px`} />
        <ParameterRow label="Spread / softness" reading={`${glow.spreadPx} / ${glow.softnessPx} px`} />
        <ParameterRow label="Effective glow reach" reading={`${glow.effectiveReachPx.toFixed(1)} px`} />
        <ParameterRow label="Glow strength" reading={glow.enabled ? `${glow.authoredIntensityPercent}% · ×${glow.intensityMultiplier.toFixed(2)}` : "Off"} />
      </dl>
      <div className={styles.plot}>
        <svg viewBox="0 0 260 98" role="img" aria-label={settings.motion === "trail" ? "Time to left-to-right travel progress" : "Time to angle rhythm curve"}>
          <path className={styles.grid} d="M12 18H248 M12 50H248 M12 82H248 M12 18V82 M130 18V82 M248 18V82" />
          <polyline className={styles.curve} points={points} />
        </svg>
        <div className={styles.axis}><span>0 s / {settings.motion === "trail" ? "Left" : `${restAngle}°`}</span><span>{motion.rotationPeriodSeconds === null ? `Static / ${restAngle}°` : `${seconds(motion.rotationPeriodSeconds)} / ${settings.motion === "trail" ? "Right → fade" : "360°"}`}</span></div>
      </div>
      <p className={styles.note}>Export Settings includes motion + the exact renderer.</p>
      <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>All parameters &amp; formulas</Button>
      {expanded ? <pre className={styles.code} aria-label="Resolved developer specification">{JSON.stringify({ geometry: doc.geometry, settings: doc.settings, motion: doc.motion, optics: doc.optics }, null, 2)}</pre> : null}
    </div>
  );
}

function ParameterRow({ label, reading }: { label: string; reading: string }): React.JSX.Element {
  return <div className={styles.row}><dt>{label}</dt><dd>{reading}</dd></div>;
}

export const beamHandoffActionHandler: ToolcraftPanelActionHandler = async ({ action, state, reportProgress }) => {
  if (!["beam.copyHtml", "beam.copySpec"].includes(action.value)) return;
  const doc: BeamHandoff = createBeamHandoff(state.values, state.timeline.durationSeconds, state.timeline.isLooping);
  const html = action.value === "beam.copyHtml";
  reportProgress(0.25);
  await navigator.clipboard.writeText(html
    ? createPreviewHtml(doc.settings, doc.motion.transportDurationSeconds, doc.motion.looping, true, state.timeline.currentTimeSeconds)
    : JSON.stringify(doc, null, 2));
  reportProgress(1);
  toast.dismiss();
  toast.success(html ? "Copied HTML" : "Copied developer spec", { description: html ? "Save as node-beam.html and open in a browser." : "Includes motion data and the exact renderer." });
};
