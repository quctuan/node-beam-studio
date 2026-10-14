import { expect, type Locator, type Page } from "@playwright/test";
import { appSchema } from "../src/app/app-schema";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";

export const beamSelector = 'canvas[data-testid="beam-preview"]';
export const viewportSelector = '[role="application"][aria-label="Canvas viewport"]';
export const findBeamControl = (target: string) => appSchema.panels.controls?.sections.flatMap(section => Object.values(section.controls)).find(control => control.target === target);

export async function openBeamProof(page: Page) {
  await page.goto("/");
  await page.locator(beamSelector).waitFor({ state: "visible" });
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(beamSelector)).toBeVisible();
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) await pause.click();
  // Pixel-change fixtures choose native 1× backing; the dedicated fidelity scenario proves 2×.
  await page.getByRole("slider", { name: "Resolution scale", exact: true }).press("Home");
  const extended = page.locator('[data-toolcraft-control-target="panels.timeline.extended"]').getByRole("switch");
  if ((await extended.getAttribute("aria-checked")) !== "true") await extended.click();
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  await scrubber.press("Home");
  await scrubber.press("ArrowRight", { delay: 0 });
  await scrubber.press("ArrowRight", { delay: 0 });
  await scrubber.press("ArrowRight", { delay: 0 });
  return session;
}

export async function selectBeamValue(page: Page, target: string, value: string | number | boolean) {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.scrollIntoViewIfNeeded();
  const schema = findBeamControl(target);
  if (!schema) throw new Error(`Unknown control ${target}`);
  if (schema.type === "switch" || schema.type === "checkbox") {
    const button = field.getByRole(schema.type === "switch" ? "switch" : "checkbox");
    if ((await button.getAttribute("aria-checked")) !== String(value)) await button.click();
    return;
  }
  const option = schema.options?.find(item => item.value === value);
  if (!option) throw new Error(`Unknown option ${target}=${value}`);
  if (schema.type === "segmented") {
    await field.getByRole("button", { name: option.label, exact: true }).click();
  } else if (schema.type === "select") {
    await field.getByRole("combobox").click();
    await page.getByRole("option", { name: option.label, exact: true }).click();
  } else {
    throw new Error(`Not a finite selector: ${target}`);
  }
}

export async function dragBeamSlider(page: Page, target: string, ratio: number) {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.scrollIntoViewIfNeeded();
  const track = field.locator('[data-slot="slider"]').first();
  const box = await track.boundingBox();
  const thumb = field.getByRole("slider").first();
  const thumbBox = await thumb.boundingBox();
  if (!box || !thumbBox) throw new Error(`Missing slider geometry: ${target}`);
  const beforeValue = await thumb.getAttribute("aria-valuenow");
  const beforePixels = await getToolcraftProductObservableSnapshot(page, { selector: beamSelector });
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
  await page.mouse.down();
  try {
    await page.mouse.move(box.x + box.width * ratio, box.y + box.height / 2, { steps: 10 });
    await expect(thumb).not.toHaveAttribute("aria-valuenow", beforeValue ?? "");
    await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: beamSelector })).not.toBe(beforePixels);
  } finally {
    await page.mouse.up();
  }
}

export async function editBeamColor(field: Locator, value: string) {
  const input = field.locator('input').first();
  await input.fill(value);
  await input.press("Enter");
}
