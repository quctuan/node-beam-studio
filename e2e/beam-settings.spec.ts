import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Download, Page } from "@playwright/test";
import { expect, test } from "./toolcraft-product-test";
import { beamSelector, openBeamProof, selectBeamValue } from "./beam-ui-helpers";
import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";

async function exportPreset(page: Page): Promise<Download> {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  return download;
}

async function readPreset(download: Download) {
  const file = await download.path();
  if (!file) throw new Error("The JSON preset was not downloaded");
  return JSON.parse(await readFile(file, "utf8"));
}

test("browser: fixed settings footer restores JSON without image export", async ({ page }) => {
  const session = await openBeamProof(page);
  const footer = page.locator('[data-slot="toolcraft-panel-sticky-actions"]');
  const panel = page.locator('[data-panel-id="properties"]');
  await expect(footer.getByRole("button", { name: "Import Settings", exact: true })).toBeInViewport();
  await expect(footer.getByRole("button", { name: "Export Settings", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Import Settings", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Export Settings", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Export (PNG|JPG)$/ })).toHaveCount(0);
  await expect(page.locator('[data-toolcraft-control-target^="export.image."]')).toHaveCount(0);
  await expect(page.getByText("Image Export", { exact: true })).toHaveCount(0);
  const beforeScroll = await footer.boundingBox();
  await page.getByRole("slider", { name: "Softness", exact: true }).scrollIntoViewIfNeeded();
  const afterScroll = await footer.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(beforeScroll).not.toBeNull();
  expect(afterScroll).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(Math.abs(afterScroll!.y - beforeScroll!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(afterScroll!.y + afterScroll!.height - panelBox!.y - panelBox!.height)).toBeLessThanOrEqual(2);
  await expect(footer.getByRole("button", { name: "Import Settings", exact: true })).toBeInViewport();
  await expect(footer.getByRole("button", { name: "Export Settings", exact: true })).toBeInViewport();
  await selectBeamValue(page, "beam.theme", "dark");
  await selectBeamValue(page, "beam.shape", "circle");
  await selectBeamValue(page, "beam.palette", "cyan");
  await selectBeamValue(page, "beam.style", "neon");
  await page.getByRole("slider", { name: "Speed", exact: true }).press("ArrowRight");
  await page.getByRole("slider", { name: "Inward spread", exact: true }).press("ArrowRight");
  await page.getByRole("slider", { name: "Border width", exact: true }).press("ArrowRight");

  const download = await expectToolcraftExportedArtifact(session.targetAction("runtime.settingsTransfer", () => exportPreset(page)), async artifact => {
    const file = await artifact.path();
    if (!file) throw new Error("The JSON preset was not downloaded");
    const bytes = await readFile(file);
    const payload = JSON.parse(bytes.toString("utf8"));
    expect(payload).toMatchObject({ appId: "node-beam-studio", source: "toolcraft-settings", version: 3 });
    expect(payload.values).toMatchObject({ "beam.theme": "dark", "beam.shape": "circle", "beam.palette": "cyan" });
    expect(payload.values).not.toHaveProperty("export.image.format");
    expect(payload.values).not.toHaveProperty("export.image.resolution");
    return { byteLength: bytes.length, mediaType: "application/json", contentHash: createHash("sha256").update(bytes).digest("hex") };
  }, { requirementId: "settings.transfer" });
  const preset = await readPreset(download);
  expect(download.suggestedFilename()).toBe("node-beam-preset.json");
  expect(preset).toMatchObject({ appId: "node-beam-studio", source: "toolcraft-settings", version: 3 });
  expect(preset.values).toMatchObject({
    "beam.theme": "dark", "beam.shape": "circle", "beam.palette": "cyan", "beam.style": "neon",
    "beam.speed": 1.25, "beam.spread": 29, "beam.borderWidth": 2.5, "beam.radius": 16,
  });
  expect(preset.values["beam.gradient"].stops).toHaveLength(2);
  expect(preset.values["beam.cyanGradient"].stops).toHaveLength(4);
  expect(preset.timeline.isPlaying).toBe(false);
  expect(preset.timeline.durationSeconds).toBeCloseTo(47.04);

  // A different browser context has no prior workspace or shared local storage.
  const browser = page.context().browser();
  if (!browser) throw new Error("The test browser is unavailable");
  const cleanContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  try {
    const restoredPage = await cleanContext.newPage();
    await restoredPage.goto(page.url());
    await expect(restoredPage.locator(beamSelector)).toHaveAttribute("data-theme", "light");
    const chooser = restoredPage.waitForEvent("filechooser");
    await restoredPage.getByRole("button", { name: "Import Settings", exact: true }).click();
    // Previously exported presets may still contain the now-removed image options.
    const legacyPreset = { ...preset, values: { ...preset.values, "export.image.format": "png", "export.image.resolution": "4k" } };
    await (await chooser).setFiles({ name: "legacy-node-beam.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(legacyPreset)) });
    await expect(restoredPage.locator(beamSelector)).toHaveAttribute("data-theme", "dark");
    await expect(restoredPage.locator(beamSelector)).toHaveAttribute("data-shape", "circle");
    await expect(restoredPage.getByRole("button", { name: "Play playback", exact: true })).toBeVisible();
    const roundTrip = await readPreset(await exportPreset(restoredPage));
    expect(roundTrip.values).toEqual(preset.values);
    expect(roundTrip.canvas).toEqual(preset.canvas);
    expect(roundTrip.timeline).toEqual(preset.timeline);
    await expect(restoredPage.locator('[data-slot="toolcraft-panel-sticky-actions"]').getByRole("button", { name: "Export Settings", exact: true })).toBeInViewport();
  } finally {
    await cleanContext.close();
  }
});
