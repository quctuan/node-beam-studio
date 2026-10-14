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

test("browser: beam workspace restores every resolved slice after reload", async ({ page }) => {
  const session = await openBeamProof(page);
  await page.getByRole("slider", { name: "Resolution scale", exact: true }).press("End");
  await expect.poll(() => page.locator(beamSelector).evaluate(node => { const canvas = node as HTMLCanvasElement; return canvas.width - Math.round(canvas.getBoundingClientRect().width * window.devicePixelRatio * 2); })).toBe(0);
  const observer = session.observe(root => {
    const world = root.querySelector<HTMLElement>('[data-toolcraft-canvas-world]')!;
    const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]')!;
    const slider = root.querySelector('[aria-label="Playback position"]')!;
    return { theme: canvas.dataset.theme, shape: canvas.dataset.shape, frame: canvas.toDataURL(), zoom: Number(world.dataset.toolcraftCanvasZoom), offsetX: Number(world.dataset.toolcraftCanvasOffsetX), offsetY: Number(world.dataset.toolcraftCanvasOffsetY), extended: root.querySelector('[data-toolcraft-control-target="panels.timeline.extended"] [role="switch"]')?.getAttribute("aria-checked"), time: Number(slider.getAttribute("aria-valuenow")), duration: Number(slider.getAttribute("aria-valuemax")) };
  });
  const initial = await readToolcraftBrowserObservation(observer);
  const mutate = async () => { await selectBeamValue(page, "beam.theme", "dark"); await selectBeamValue(page, "beam.shape", "circle"); await page.getByRole("button", { name: "Zoom in", exact: true }).click(); await panBeam(page); await page.getByRole("slider", { name: "Playback position" }).press("End"); };
  await mutate();
  await expect(page.locator(beamSelector)).toHaveAttribute("data-phase", "0");
  const expected = await readToolcraftBrowserObservation(observer);
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await page.getByRole("button", { name: "Center canvas", exact: true }).click();
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expectToolcraftPersistenceState(observer, session.targetAction("canvas.size.width", async () => {
    await selectBeamValue(page, "beam.theme", "dark"); await selectBeamValue(page, "beam.shape", "circle");
    await panBeam(page); await page.getByRole("slider", { name: "Playback position" }).press("End");
  }), session.reload(), expected, { requirementId: "persistence.reload", assertRestoredOutput: async () => {
    await expect(page.locator(beamSelector)).toHaveAttribute("data-theme", "dark");
    expect((await readToolcraftBrowserObservation(observer)).frame).not.toBe(initial.frame);
  } });
});

