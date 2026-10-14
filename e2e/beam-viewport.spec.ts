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

test("browser: canvas pan zoom and center keep node geometry stable", async ({ page }) => {
  const session = await openBeamProof(page);
  const observer = session.observe(root => {
    const world = root.querySelector<HTMLElement>('[data-toolcraft-canvas-world]')!;
    const scene = root.querySelector<HTMLElement>('[data-toolcraft-product-scene]')!;
    return { offsetX: Number(world.dataset.toolcraftCanvasOffsetX), offsetY: Number(world.dataset.toolcraftCanvasOffsetY), zoom: Number(world.dataset.toolcraftCanvasZoom), outputWidth: parseFloat(scene.style.width), outputHeight: parseFloat(scene.style.height) };
  });
  const before = await readToolcraftBrowserObservation(observer);
  await panBeam(page);
  const panned = await readToolcraftBrowserObservation(observer);
  expect(panned.offsetX).not.toBe(before.offsetX);
  await page.getByRole("button", { name: "Center canvas", exact: true }).click();
  await expectToolcraftViewportSideEffect(observer, session.targetAction("canvas.viewport", async () => panBeam(page)), panned, { requirementId: "viewport.navigation" });
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const zoomed = await readToolcraftBrowserObservation(observer);
  expect(zoomed.zoom).toBeGreaterThan(before.zoom);
  expect(zoomed.outputWidth).toBe(before.outputWidth);
});

