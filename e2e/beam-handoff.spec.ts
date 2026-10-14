import { readFile } from "node:fs/promises";
import { expect, test } from "./toolcraft-product-test";
import { beamSelector, openBeamProof, selectBeamValue } from "./beam-ui-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { readToolcraftBrowserObservation } from "./browser-proof-session";
import type { BeamHandoff } from "../src/app/beam-handoff";

test("browser: developer handoff exports motion and reproduces preview", async ({ page }) => {
  const session = await openBeamProof(page);
  const inspector = page.getByTestId("beam-handoff");
  await inspector.scrollIntoViewIfNeeded();
  await expect(inspector.getByText("1.960 s", { exact: true })).toBeVisible();
  await expectToolcraftProductObservableToChange(session, session.targetAction("beam.developerHandoff", async () => {
    await selectBeamValue(page, "beam.easing", "ease");
    await inspector.scrollIntoViewIfNeeded();
  }), { selector: '[data-testid="beam-handoff"]', requirementId: "beam.developerHandoff" });
  // Even with the handoff section collapsed, native export must stay fresh.
  await page.getByRole("button", { name: "Collapse Developer Handoff section", exact: true }).click();
  await page.getByRole("slider", { name: "Speed", exact: true }).press("ArrowRight");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  const download = await pending;
  const file = await download.path();
  if (!file) throw new Error("No JSON download");
  const preset = JSON.parse(await readFile(file, "utf8"));
  const doc = preset.values["beam.developerHandoff"] as BeamHandoff;
  expect(doc.schema).toBe("node-beam-developer-handoff");
  expect(doc.settings.speed).toBe(1.25);
  expect(doc.motion.rotationPeriodSeconds).toBeCloseTo(1.568);
  expect(doc.motion.keyframes.rotation).toHaveLength(33);
  expect(doc.motion.hue.periodSeconds).toBeCloseTo(11.76);
  expect(doc.optics.inwardGlow.effectiveReachPx).toBeCloseTo(47.2);
  expect(doc.implementation.javascript).toContain("NodeBeam");

  // Compare the supplied dependency-free implementation against actual worker pixels.
  const rendered = await page.locator(beamSelector).evaluate(async (element: HTMLCanvasElement) => {
    const bitmap = await createImageBitmap(element);
    const surface = new OffscreenCanvas(element.width, element.height);
    const context = surface.getContext("2d")!;
    context.drawImage(bitmap, 0, 0); bitmap.close();
    return { width: element.width, height: element.height, pixels: Array.from(context.getImageData(0, 0, surface.width, surface.height).data) };
  });
  const preview = await page.context().newPage();
  try {
    await preview.setContent(`<canvas id="beam"></canvas><script>${doc.implementation.javascript}</script>`);
    const reproduction = await preview.evaluate(async ({ settings, seconds, duration }) => {
      const canvas = document.querySelector("canvas")!;
      const runtime = (window as unknown as { NodeBeam: { renderFrame: (...args: unknown[]) => void } }).NodeBeam;
      runtime.renderFrame(canvas, settings, seconds, { durationSeconds: duration, pixelRatio: 1 });
      const bitmap = await createImageBitmap(canvas);
      const surface = new OffscreenCanvas(canvas.width, canvas.height);
      const context = surface.getContext("2d")!;
      context.drawImage(bitmap, 0, 0); bitmap.close();
      return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) };
    }, { settings: doc.settings, seconds: preset.timeline.currentTimeSeconds, duration: doc.motion.transportDurationSeconds });
    expect(reproduction.width).toBe(rendered.width);
    expect(reproduction.height).toBe(rendered.height);
    expect(reproduction.pixels).toEqual(rendered.pixels);
  } finally { await preview.close(); }
  await selectBeamValue(page, "beam.motion", "static");
  await page.getByRole("button", { name: "Expand Developer Handoff section", exact: true }).click();
  await inspector.scrollIntoViewIfNeeded();
  await expect(inspector.getByText("Static / 64.8°", { exact: true })).toBeVisible();
  const fixedLine = await inspector.locator("polyline").getAttribute("points");
  const coordinates = fixedLine!.split(" ").map(point => point.split(",").map(Number));
  expect(coordinates[0][1]).toBe(coordinates[1][1]);
  expect(coordinates[1][0]).toBeGreaterThan(coordinates[0][0]);
});

test("browser: developer handoff copies runnable HTML and specification", async ({ page }) => {
  const session = await openBeamProof(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const feedback = session.observe(root => root.ownerDocument.querySelector('[data-sonner-toast]')?.textContent ?? "");
  const copyHtml = page.getByRole("button", { name: "Copy HTML", exact: true });
  await copyHtml.scrollIntoViewIfNeeded();
  await expectToolcraftAcceptanceOutcome(() => readToolcraftBrowserObservation(feedback), session.controlAction("beam.handoffActions", () => copyHtml.click()), { requirementId: "beam.handoffActions", evidenceType: "command-side-effect" });
  const html = await page.evaluate(() => navigator.clipboard.readText());
  expect(html).toContain("<!doctype html>");
  expect(html).toContain("NodeBeam.mount");
  const preview = await page.context().newPage();
  try {
    await preview.setContent(html);
    await expect(preview.locator("canvas")).toBeVisible();
    expect(await preview.locator("canvas").evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBeGreaterThan(300);
  } finally { await preview.close(); }
  await page.getByRole("button", { name: "Copy spec", exact: true }).click();
  const spec = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(spec.schema).toBe("node-beam-developer-handoff");
  expect(spec.motion.keyframes.rotation).toHaveLength(33);
  expect(spec.implementation.javascript).toContain("NodeBeam");
  await expect(page.getByText("Copied developer spec", { exact: true })).toBeVisible();
});
