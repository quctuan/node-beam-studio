import { expect, type Locator, type Page } from "@playwright/test";

import { getToolcraftControlOwnerByTarget } from "./browser-control-target-helpers";
import type { ToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const gradientTarget = "beam.gradient";

async function choosePaletteCustom(page: Page): Promise<void> {
  const palette = await getToolcraftControlOwnerByTarget(page, "beam.palette");
  const trigger = palette.getByRole("combobox");
  if ((await trigger.textContent())?.trim().startsWith("Custom")) return;
  await trigger.click();
  await page.getByRole("option", { name: "Custom", exact: true }).click();
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
  return page.locator(selector).evaluate((element) => (element as HTMLCanvasElement).toDataURL("image/png"));
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
): Promise<void> {
  const before = await canvasPixels(page, selector);
  // This preliminary edit discovers the exact expected pixels. The canonical
  // compound recipe below owns stable semantic proof, so avoid running its
  // entire raster-probe setup a second time for every preliminary edit.
  await edit(await getToolcraftControlOwnerByTarget(page, gradientTarget), page);
  await expect.poll(() => canvasPixels(page, selector)).not.toBe(before);
  const expectedPixels = await canvasPixels(page, selector);
  expect(expectedPixels).not.toBe(before);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(() => canvasPixels(page, selector)).toBe(before);

  const actualPixels = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-testid="beam-preview"]');
    if (!canvas) throw new Error("The visible node output canvas is required for gradient proof.");
    return canvas.toDataURL("image/png");
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
  await choosePaletteCustom(page);

  const gradient = await getToolcraftControlOwnerByTarget(page, gradientTarget);
  const currentType = (await gradient.getByRole("combobox").textContent())?.trim();
  await provePart(page, session, requirementId, selector, "gradient.gradientType", async (control, currentPage) => chooseGradientType(control, currentPage, currentType?.startsWith("Linear") ? "Angular" : "Linear"));
  for (const [part, label, firstValue, alternate] of [
    ["gradient.angle", "Gradient angle", "72", "134"],
    ["gradient.stops.position", "Stop 2 position", "17", "29"],
    ["gradient.stops.color", "Stop 1 hex", "FF9900", "00A3FF"],
    ["gradient.stops.opacity", "Stop 1 opacity", "35", "65"],
  ]) {
    const current = await gradient.getByRole("textbox", { name: label, exact: true }).inputValue();
    const next = current.replace(/^#/, "").toUpperCase() === firstValue ? alternate : firstValue;
    await provePart(page, session, requirementId, selector, part, async (control) => setGradientField(control, label, next));
  }

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(gradientTarget, async (control) => setGradientField(control, "Gradient angle", "123")),
    { requirementId, selector },
  );
}
