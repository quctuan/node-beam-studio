import { expect, type Locator, type Page } from "@playwright/test";

import { getToolcraftControlOwnerByTarget } from "./browser-control-target-helpers";
import type { ToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

import { beamPaletteGradientTargets } from "../src/app/beam-types";

async function choosePalette(page: Page, gradientTarget: string): Promise<void> {
  const key = Object.entries(beamPaletteGradientTargets).find(([, target]) => target === gradientTarget)![0];
  const label = key[0].toUpperCase() + key.slice(1);
  const palette = page.locator('[data-toolcraft-control-target="beam.palette"]');
  const trigger = palette.getByRole("combobox");
  if ((await trigger.textContent())?.trim().startsWith(label)) return;
  await trigger.click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

async function chooseGradientType(gradient: Locator, page: Page, label: string): Promise<void> {
  await gradient.getByRole("combobox").click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

async function setGradientField(gradient: Locator, label: string, value: string): Promise<void> {
  const input = gradient.getByRole("textbox", { name: label, exact: true });
  await input.fill(value);
  await input.press("Enter");
}

async function canvasPixels(page: Page, selector: string): Promise<string> {
  return page.locator(selector).evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const readback = new OffscreenCanvas(canvas.width, canvas.height);
    const context = readback.getContext("2d")!; context.drawImage(canvas, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
    return `${canvas.width}:${canvas.height}:${hash >>> 0}`;
  });
}

/**
 * Observe a real rendered result, undo through the toolbar, then reproduce it
 * through the same visible field. The protected recipe verifies exact live
 * pixels and a stable transition, rather than trusting the control value.
 */
async function provePart(
  page: Page,
  session: ToolcraftBrowserProofSession,
  requirementId: string,
  selector: string,
  part: string,
  edit: (control: Locator, page: Page) => Promise<void>,
  gradientTarget: string,
): Promise<void> {
  const before = await canvasPixels(page, selector);
  // This preliminary edit discovers the exact expected pixels. The canonical
  // compound recipe below owns stable semantic proof, so avoid running its
  // entire raster-probe setup a second time for every preliminary edit.
  await edit(page.locator(`[data-toolcraft-control-target="${gradientTarget}"]`), page);
  await expect.poll(() => canvasPixels(page, selector)).not.toBe(before);
  const expectedPixels = await canvasPixels(page, selector);
  expect(expectedPixels).not.toBe(before);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(() => canvasPixels(page, selector)).toBe(before);

  const actualPixels = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]');
    if (!canvas) throw new Error("The visible node output canvas is required for gradient proof.");
    const readback = new OffscreenCanvas(canvas.width, canvas.height);
    const context = readback.getContext("2d")!; context.drawImage(canvas, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
    return `${canvas.width}:${canvas.height}:${hash >>> 0}`;
  });
  await expectToolcraftCompoundControlPartOutcome(
    actualPixels,
    session.controlAction(gradientTarget, edit),
    expectedPixels,
    { part: requirementId.includes("#applicability:") ? part + requirementId.slice(requirementId.indexOf("#applicability:")) : part, requirementId: requirementId.split("#applicability:")[0], stabilitySamples: 2 },
  );
}

/** All five canonical gradient parts affect the actual paused node pixels. */
export async function proveBeamGradient(
  page: Page,
  session: ToolcraftBrowserProofSession,
  requirementId = "beam.gradient",
  selector = 'canvas[data-testid="beam-preview"]',
): Promise<void> {
  if (selector !== 'canvas[data-testid="beam-preview"]') {
    throw new Error("Gradient semantic observations require the product's canonical beam-preview canvas.");
  }
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.isVisible()) await pause.click();
  const gradientTarget = requirementId.split("#")[0];
  await choosePalette(page, gradientTarget);

  const gradient = page.locator(`[data-toolcraft-control-target="${gradientTarget}"]`);
  const currentType = (await gradient.getByRole("combobox").textContent())?.trim();
  await provePart(page, session, requirementId, selector, "gradient.gradientType", async (control, currentPage) => chooseGradientType(control, currentPage, currentType?.startsWith("Linear") ? "Angular" : "Linear"), gradientTarget);
  for (const [part, label, firstValue, alternate] of [
    ["gradient.angle", "Gradient angle", "72", "134"],
    ["gradient.stops.position", "Stop 2 position", "17", "29"],
    ["gradient.stops.color", "Stop 1 hex", "FF9900", "00A3FF"],
    ["gradient.stops.opacity", "Stop 1 opacity", "35", "65"],
  ]) {
    const current = await gradient.getByRole("textbox", { name: label, exact: true }).inputValue();
    const next = current.replace(/^#/, "").toUpperCase() === firstValue ? alternate : firstValue;
    await provePart(page, session, requirementId, selector, part, async (control) => setGradientField(control, label, next), gradientTarget);
  }

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(gradientTarget, async (control) => setGradientField(control, "Gradient angle", "123")),
    { requirementId, selector },
  );
}
