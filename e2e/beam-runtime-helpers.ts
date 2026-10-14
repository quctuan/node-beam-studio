import type { Page } from "@playwright/test";
import { expect } from "./toolcraft-product-test";
import { beamSelector, viewportSelector } from "./beam-ui-helpers";

export async function downloadImage(page: Page) {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export PNG|Export JPG/, exact: true }).click();
  return download;
}

export async function panBeam(page: Page) {
  const viewport = await page.locator(beamSelector).boundingBox();
  if (!viewport) throw new Error("Missing product scene");
  await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  await page.mouse.click(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2);
  await page.keyboard.down("Space");
  await expect(page.locator(viewportSelector)).toHaveAttribute("data-canvas-pan-state", "ready");
  await page.mouse.down();
  await expect(page.locator(viewportSelector)).toHaveAttribute("data-canvas-pan-state", "dragging");
  await page.mouse.move(viewport.x + viewport.width / 2 + 50, viewport.y + viewport.height / 2 + 35, { steps: 8 });
  await page.mouse.up(); await page.keyboard.up("Space");
}

export const darkCenter = [{ xRatio: .5, yRatio: .5, rgba: [32, 33, 35, 255] as const }];
export const paleBackground = [246, 247, 248, 255] as const;
export const finiteBounds = { x: .2625, y: .183333, width: .475, height: .633333 };

