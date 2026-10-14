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

test("browser: workspace plain and dots change the editor backing", async ({ page }) => {
  const session = await openBeamProof(page);
  await selectBeamValue(page, "export.includeBackground", false);
  const observer = session.observe(root => ({ pattern: root.querySelector('[data-toolcraft-control-target="canvas.workspaceBackground"] [data-slot="select-value"]')?.textContent?.trim() ?? "" }));
  await expectToolcraftAcceptanceOutcome(() => readToolcraftBrowserObservation(observer), session.controlAction("canvas.workspaceBackground", async () => { await selectBeamValue(page, "canvas.workspaceBackground", "blanc"); }), { requirementId: "workspace.pattern", evidenceType: "command-side-effect" });
  const plain = await getToolcraftProductObservableSnapshot(page, { selector: viewportSelector });
  await selectBeamValue(page, "canvas.workspaceBackground", "dots");
  await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: viewportSelector })).not.toBe(plain);

  // Regression: the editor is dark but the independently editable fill is light.
  const darkTheme = page.getByRole("button", { name: "Dark theme", exact: true });
  if (await darkTheme.isVisible()) await darkTheme.click();
  await selectBeamValue(page, "canvas.infinity", true);
  await selectBeamValue(page, "export.includeBackground", true);
  const background = await getToolcraftControlFieldByTarget(page, "beam.background");
  await editBeamColor(background, "#F6F7F8");
  const contrast = page.locator("[data-beam-workspace-contrast]");
  await expect(contrast).toBeVisible();
  const lightPixels = await readWorkspacePixels(page);
  expect(lightPixels.maximum - lightPixels.minimum).toBeGreaterThan(10);
  expect(lightPixels.average).toBeGreaterThan(230);

  await selectBeamValue(page, "canvas.workspaceBackground", "blanc");
  await expect(contrast).toHaveCount(0);
  const plainPixels = await readWorkspacePixels(page);
  expect(plainPixels.maximum - plainPixels.minimum).toBeLessThan(3);
  await selectBeamValue(page, "canvas.workspaceBackground", "dots");
  await panBeam(page);
  // Both native patterns have exactly the same spacing and phase after navigation.
  const patterns = page.locator(`${viewportSelector} [data-slot="canvas-dot-pattern"] pattern`);
  await expect(patterns).toHaveCount(2);
  expect(await patterns.nth(1).getAttribute("patternTransform")).toBe(await patterns.nth(0).getAttribute("patternTransform"));
  expect(await patterns.nth(1).getAttribute("width")).toBe(await patterns.nth(0).getAttribute("width"));
  const oldGap = await patterns.nth(0).getAttribute("width");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(patterns.nth(0)).not.toHaveAttribute("width", oldGap!);
  expect(await patterns.nth(1).getAttribute("width")).toBe(await patterns.nth(0).getAttribute("width"));
  expect(await patterns.nth(1).getAttribute("patternTransform")).toBe(await patterns.nth(0).getAttribute("patternTransform"));

  // Opposite mismatch: light editor plus a dark custom fill.
  await page.getByRole("button", { name: "Light theme", exact: true }).click();
  await editBeamColor(background, "#17191F");
  await expect(contrast).toBeVisible();
  const darkPixels = await readWorkspacePixels(page);
  expect(darkPixels.maximum - darkPixels.minimum).toBeGreaterThan(10);
  expect(darkPixels.average).toBeLessThan(60);
  await selectBeamValue(page, "export.includeBackground", false);
  await expect(contrast).toHaveCount(0);
  await expect(page.locator(`${viewportSelector} [data-slot="canvas-dot-pattern"]`)).toHaveCount(1);
});

async function readWorkspacePixels(page: Page) {
  const box = await page.locator(viewportSelector).boundingBox();
  if (!box) throw new Error("Missing workspace viewport");
  const screenshot = await page.screenshot({ clip: { x: box.x + 16, y: box.y + 80, width: 96, height: 96 }, scale: "css" });
  return page.evaluate(async encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const image = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas");
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0); image.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minimum = 255, maximum = 0, total = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const brightness = (pixels[index]! + pixels[index + 1]! + pixels[index + 2]!) / 3;
      minimum = Math.min(minimum, brightness); maximum = Math.max(maximum, brightness); total += brightness;
    }
    return { minimum, maximum, average: total / (pixels.length / 4) };
  }, screenshot.toString("base64"));
}
