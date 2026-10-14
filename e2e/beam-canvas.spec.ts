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
import { expectToolcraftSegmentedControlCellsPreservePadding, expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";

import { downloadImage, panBeam, darkCenter, paleBackground, finiteBounds } from "./beam-runtime-helpers";

test("browser: finite canvas size and Infinity preserve the node", async ({ page }) => {
  const session = await openBeamProof(page);
  const before = await observeInfinityCanvas(page);
  const host = await page.locator('[data-toolcraft-product-scene]').elementHandle();
  const output = await page.locator(beamSelector).elementHandle();
  const continuity = async () => ({
    productHostPreserved: await host!.evaluate(node => node === document.querySelector('[data-toolcraft-product-scene]')),
    productOutputPreserved: await output!.evaluate(node => node === document.querySelector('canvas[data-testid="beam-preview"]')),
  });
  await selectBeamValue(page, "canvas.infinity", true);
  const enabled = await observeInfinityCanvas(page), beforeToEnabled = await continuity();
  await panBeam(page);
  const afterPan = await observeInfinityCanvas(page);
  await runToolcraftBrowserAction(session.reload(), "reload");
  await expect(page.locator(beamSelector)).toHaveAttribute("data-ready", "true");
  const afterReload = await observeInfinityCanvas(page);
  const reloadedHost = await page.locator('[data-toolcraft-product-scene]').elementHandle();
  const reloadedOutput = await page.locator(beamSelector).elementHandle();
  const reloadedContinuity = async () => ({
    productHostPreserved: await reloadedHost!.evaluate(node => node === document.querySelector('[data-toolcraft-product-scene]')),
    productOutputPreserved: await reloadedOutput!.evaluate(node => node === document.querySelector('canvas[data-testid="beam-preview"]')),
  });
  await selectBeamValue(page, "canvas.infinity", false);
  const restored = await observeInfinityCanvas(page), afterReloadToRestored = await reloadedContinuity();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const undone = await observeInfinityCanvas(page), restoredToUndone = await reloadedContinuity();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  const redone = await observeInfinityCanvas(page), undoneToRedone = await reloadedContinuity();
  await expectToolcraftInfinityCanvasModeEvidence({ before, enabled, afterPan, afterReload, restored, undone, redone }, { beforeToEnabled, afterReloadToRestored, restoredToUndone, undoneToRedone }, { requirementId: "canvas.sizing", target: "canvas.infinity", expectedSceneRect: before.productScene.worldRect! });
});

test("browser: render scale selects real backing pixels in every state", async ({ page }) => {
  const session = await openBeamProof(page);
  await selectBeamValue(page, "canvas.infinity", false);
  const slider = page.getByRole("slider", { name: "Resolution scale", exact: true });
  await slider.press("End");
  await expectToolcraftDiscreteSliderMarkers(page, "canvas.renderScale");
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    requirementId: "canvas.renderScale", target: "canvas.renderScale", selectedScale: 2, canvasSelector: beamSelector,
    stateTransitions: [
      { state: "steady", run: async () => {} },
      { state: "playback", run: async () => { await page.getByRole("button", { name: "Play playback" }).click(); } },
      { state: "interaction", run: async () => panBeam(page) },
    ],
  });
});

