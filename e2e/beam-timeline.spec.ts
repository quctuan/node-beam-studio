import { createHash } from "node:crypto";
import { expectToolcraftInfinityCanvasBackgroundEvidence, expectToolcraftInfinityCanvasModeEvidence, observeInfinityCanvas, observeInfinityCanvasBackground } from "./browser-infinity-canvas-evidence";
import { expectToolcraftInfinityCanvasImageBoundsEvidence } from "./browser-infinity-image-bounds-evidence";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import type { Page } from "@playwright/test";
import { appSchema } from "../src/app/app-schema";
import { appAcceptance, appControlSectionInventory, getToolcraftControlApplicabilityCases, getToolcraftApplicabilityRequirementId } from "../src/app/app-acceptance";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftAcceptanceOutcome, expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { createToolcraftBrowserProofSession, readToolcraftBrowserObservation, runToolcraftBrowserAction, type ToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftPersistenceState, expectToolcraftViewportSideEffect } from "./browser-state-evidence-helpers";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftTimelinePauseResume, expectToolcraftTimelineRenderedFrame, expectToolcraftTimelineDuration, expectToolcraftTimelineScrub, expectToolcraftTimelineLoop } from "./browser-timeline-evidence-helpers";
import { proveBeamGradient } from "./beam-gradient-helpers";
import { beamSelector, viewportSelector, openBeamProof, selectBeamValue, dragBeamSlider, editBeamColor, findBeamControl } from "./beam-ui-helpers";
import { expect, test } from "./toolcraft-product-test";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";

import { downloadImage, panBeam, darkCenter, paleBackground, finiteBounds } from "./beam-runtime-helpers";

test("browser: timeline controls the actual shared beam cycle", async ({ page }) => {
  const session = await openBeamProof(page);
  const scrubber = page.getByRole("slider", { name: "Playback position", exact: true });
  const frameObserver = session.observe(root => {
    const slider = root.querySelector('[aria-label="Playback position"]')!;
    return { currentTimeSeconds: Number(slider.getAttribute("aria-valuenow")), outputSignature: root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]')!.toDataURL() };
  });
  await scrubber.press("Home"); await scrubber.press("ArrowRight");
  const expectedFrame = await readToolcraftBrowserObservation(frameObserver);
  await scrubber.press("Home");
  await expectToolcraftTimelineScrub(frameObserver, session.targetAction("timeline.playback", async () => { await scrubber.press("ArrowRight"); }), expectedFrame, { requirementId: "timeline.playback" });
  await scrubber.press("Home");
  await expectToolcraftTimelineRenderedFrame(frameObserver, session.targetAction("timeline.playback", async () => { await scrubber.press("ArrowRight"); }), expectedFrame, { requirementId: "timeline.playback" });
  const durationObserver = session.observe(root => ({
    timelineDurationSeconds: Number(root.querySelector('[aria-label="Playback position"]')?.getAttribute("aria-valuemax")),
    renderedCycleDurationSeconds: Number(root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]')?.dataset.cycleDuration),
  }));
  const editDuration = async (value: string) => {
    await page.getByRole("button", { name: "Edit timeline duration", exact: true }).click();
    await page.getByRole("textbox", { name: "timeline duration", exact: true }).fill(value);
    await page.getByRole("textbox", { name: "timeline duration", exact: true }).press("Enter");
  };
  await expectToolcraftTimelineDuration(durationObserver, session.targetAction("timeline.playback", async () => editDuration("2")), 2, { requirementId: "timeline.playback" });
  const playbackObserver = session.observe(root => {
    const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]')!;
    return { currentTimeSeconds: Number(root.querySelector('[aria-label="Playback position"]')?.getAttribute("aria-valuenow")), outputSignature: canvas.toDataURL(), playing: Boolean(root.querySelector('[aria-label="Pause playback"]')) };
  });
  await page.getByRole("button", { name: "Play playback", exact: true }).click(); await page.mouse.move(20, 20);
  await expectToolcraftTimelinePauseResume(playbackObserver,
    session.targetAction("timeline.playback", async () => { await page.getByRole("button", { name: "Pause playback", exact: true }).click(); }),
    session.targetAction("timeline.playback", async () => { await page.getByRole("button", { name: "Play playback", exact: true }).click(); await page.mouse.move(20, 20); }), { requirementId: "timeline.playback" });
  await page.getByRole("button", { name: "Pause playback", exact: true }).click();
  await scrubber.press("End");
  await expect(page.locator(beamSelector)).toHaveAttribute("data-phase", "0");
  const collect = session.observe(async root => {
    const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]')!;
    const slider = root.querySelector('[aria-label="Playback position"]')!;
    const tick = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const read = () => Number(slider.getAttribute("aria-valuenow"));
    const cycle = async () => {
      const durationSeconds = Number(slider.getAttribute("aria-valuemax"));
      const seamEndSignature = canvas.toDataURL();
      while (read() !== 0) await tick();
      while (Number(canvas.dataset.phase) !== 0) await tick();
      const seamStartSignature = canvas.toDataURL();
      const normalizedPhases = [0];
      let previous = 0, lastRecorded = 0;
      for (;;) {
        await tick();
        const phase = read() / durationSeconds;
        if (previous >= .75 && phase <= .25) { normalizedPhases.push(phase); break; }
        if (phase - lastRecorded >= .18) { normalizedPhases.push(phase); lastRecorded = phase; }
        previous = phase;
      }
      return { durationSeconds, seamEndSignature, seamStartSignature, normalizedPhases };
    };
    const initial = await cycle();
    while (Number(slider.getAttribute("aria-valuemax")) === initial.durationSeconds) await tick();
    while (read() !== Number(slider.getAttribute("aria-valuemax")) || Number(canvas.dataset.phase) !== 0) await tick();
    const resized = await cycle();
    return { initial, resized };
  });
  const loopProof = expectToolcraftTimelineLoop(collect, { requirementId: "timeline.playback" });
  await page.waitForTimeout(150);
  await scrubber.press("Home");
  await page.getByRole("button", { name: "Play playback", exact: true }).click(); await page.mouse.move(20, 20);
  await expect.poll(() => scrubber.getAttribute("aria-valuenow").then(Number), { timeout: 4000, intervals: [50] }).toBeGreaterThan(1.9);
  await expect.poll(() => scrubber.getAttribute("aria-valuenow").then(Number), { timeout: 1000, intervals: [20] }).toBeLessThan(.25);
  await page.getByRole("button", { name: "Pause playback", exact: true }).click();
  await editDuration("3"); await scrubber.press("End");
  await expect(page.locator(beamSelector)).toHaveAttribute("data-phase", "0");
  await page.waitForTimeout(150); await scrubber.press("Home");
  await page.getByRole("button", { name: "Play playback", exact: true }).click(); await page.mouse.move(20, 20);
  await loopProof;
});
