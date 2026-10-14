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

test("browser: reset restores all product values and node output", async ({ page }) => {
  const session = await openBeamProof(page);
  await page.getByRole("slider", { name: "Resolution scale", exact: true }).press("End");
  await expect.poll(() => page.locator(beamSelector).evaluate(node => { const canvas = node as HTMLCanvasElement; return canvas.width - Math.round(canvas.getBoundingClientRect().width * window.devicePixelRatio * 2); })).toBe(0);
  const original = await getToolcraftProductObservableSnapshot(page, { selector: beamSelector });
  await selectBeamValue(page, "beam.theme", "dark");
  await dragBeamSlider(page, "beam.width", .8);
  const observer = session.observe(root => ({ mode: root.querySelector<HTMLButtonElement>('[data-toolcraft-control-target="beam.theme"] [aria-pressed="true"]')?.textContent?.trim(), width: root.querySelector('[data-toolcraft-control-target="beam.width"] [role="slider"]')?.getAttribute("aria-valuenow") }));
  await expectToolcraftAcceptanceOutcome(() => readToolcraftBrowserObservation(observer), session.targetAction("controls.reset", async () => { await page.getByRole("button", { name: "Reset controls", exact: true }).click(); }), { requirementId: "controls.reset", evidenceType: "command-side-effect" });
  await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: beamSelector })).toBe(original);
});

