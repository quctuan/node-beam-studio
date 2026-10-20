import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { beamPaletteGradientTargets } from "../src/app/beam-types";
import { beamSelector, openBeamProof, selectBeamValue } from "./beam-ui-helpers";

async function pixels(page: Page) {
  return page.locator(beamSelector).evaluate(node => {
    const canvas = node as HTMLCanvasElement;
    const readback = new OffscreenCanvas(canvas.width, canvas.height);
    const context = readback.getContext("2d")!; context.drawImage(canvas, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (const byte of data) hash = Math.imul(hash ^ byte, 16777619);
    return hash >>> 0;
  });
}
for (const [palette, target] of Object.entries(beamPaletteGradientTargets)) {
  test(`browser: ${palette} edits every gradient part in actual node pixels`, async ({ page }) => {
    await openBeamProof(page);
    await selectBeamValue(page, "beam.palette", palette);
    const editor = page.locator(`[data-toolcraft-control-target="${target}"]`);
    let before = await pixels(page);
    const current = await editor.getByRole("combobox").innerText();
    await editor.getByRole("combobox").click();
    await page.getByRole("option", {name:current.startsWith("Linear") ? "Angular" : "Linear",exact:true}).click();
    await expect.poll(() => pixels(page)).not.toBe(before);
    for (const [label, value] of [["Gradient angle","72"],["Stop 2 position","17"],["Stop 1 hex","#FF9900"],["Stop 1 opacity","35"]]) {
      before = await pixels(page);
      const input = editor.getByRole("textbox",{name:label,exact:true});
      await input.fill(value); await input.press("Enter");
      await expect.poll(() => pixels(page)).not.toBe(before);
    }
  });
  test(`browser: ${palette} retains its stops through palette switching and JSON`, async ({ page }) => {
    await openBeamProof(page);
    await selectBeamValue(page,"beam.palette",palette);
    const editor = page.locator(`[data-toolcraft-control-target="${target}"]`);
    const color = editor.getByRole("textbox",{name:"Stop 1 hex",exact:true});
    const before = await pixels(page);
    await color.fill("#10CC77"); await color.press("Enter");
    await expect.poll(() => pixels(page)).not.toBe(before);
    const authoredPixels = await pixels(page);
    const other = palette === "cyan" ? "spectrum" : "cyan";
    await selectBeamValue(page,"beam.palette",other);
    await selectBeamValue(page,"beam.palette",palette);
    await expect(color).toHaveValue("#10CC77");
    await expect.poll(() => pixels(page)).toBe(authoredPixels);
    const download = page.waitForEvent("download");
    await page.getByRole("button",{name:"Export Settings",exact:true}).click();
    const file = await (await download).path();
    if (!file) throw new Error("Settings download missing");
    const payload = JSON.parse(await readFile(file,"utf8"));
    expect(payload.values[target].stops[0].color).toBe("#10CC77");
    expect(payload.values["beam.developerHandoff"].settings.gradient.stops[0].color).toBe("#10CC77");
  });
}
