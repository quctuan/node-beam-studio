import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { expect, test } from "./toolcraft-product-test";
import { beamSelector, openBeamProof, selectBeamValue } from "./beam-ui-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import type { BeamHandoff } from "../src/app/beam-handoff";

import type { Page } from "@playwright/test";
import { beamRuntimeSource as acceptedOrbitRuntime } from "./fixtures/beam-orbit-v1.3.1";
import { resolveBeamSettings } from "../src/app/beam-types";
import { getBeamPhase } from "../src/app/beam-paint";
import { appSchema } from "../src/app/app-schema";
import { createToolcraftState } from "../src/toolcraft/runtime";
import { createToolcraftSettingsPayload } from "../src/toolcraft/runtime/react";

const capture = (page: Page) => page.locator(beamSelector).evaluate(async (element: HTMLCanvasElement) => {
    const bitmap = await createImageBitmap(element);
    const surface = new OffscreenCanvas(element.width, element.height);
    const context = surface.getContext("2d")!;
    context.drawImage(bitmap, 0, 0); bitmap.close();
    return { width: element.width, height: element.height, pixels: Array.from(context.getImageData(0, 0, surface.width, surface.height).data) };
  });
const seek = async (page: Page, position: "Home" | "End", steps = 0) => {
    const scrubber = page.getByRole("slider", { name: "Playback position", exact: true });
    await scrubber.press(position);
    for (let i = 0; i < steps; i++) await scrubber.press("ArrowRight");
    const time = Number(await scrubber.getAttribute("aria-valuenow"));
    const turns = Math.round(47.04 / 1.96);
    await expect.poll(() => page.locator(beamSelector).getAttribute("data-phase").then(Number)).toBeCloseTo(((time / 47.04 * turns) % 1 + 1) % 1, 8);
  };

for (const theme of ["light", "dark"]) {
  test(`browser: trail splits converges and disappears on ${theme}`, async ({ page }) => {
    const session = await openBeamProof(page);
    await expectToolcraftProductObservableToChange(session, session.controlAction("beam.motion", () => selectBeamValue(page, "beam.motion", "trail")), { selector: beamSelector, ...(theme === "light" ? { requirementId: "beam.trail-convergence" } : {}) });
    const state = createToolcraftState(appSchema);
    Object.assign(state.values, {
      "beam.motion": "trail", "beam.theme": theme, "beam.speed": .25, "beam.width": 380, "beam.aspect": "square", "beam.shape": "rounded", "beam.easing": "linear",
      "beam.palette": "custom", "beam.borderWidth": 3, "beam.radius": 24,
      "beam.spread": 24, "beam.intensity": 80, "canvas.renderScale": 1,
      "beam.gradient": { angle: 0, gradientType: "angular", stops: [{ color: "#FF0088", opacity: 100, position: "0%" }, { color: "#FF0088", opacity: 100, position: "100%" }] },
    });
    state.timeline.durationSeconds = 8; state.timeline.isPlaying = false; state.timeline.currentTimeSeconds = 0;
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Import Settings", exact: true }).click();
    await (await chooser).setFiles({ name: "split-trail.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(createToolcraftSettingsPayload(state))) });
    const scrubber = page.getByRole("slider", { name: "Playback position", exact: true });
    const at = async (step: number) => {
      await scrubber.press(step > 16 ? "End" : "Home");
      const steps = step > 16 ? 32 - step : step;
      for (let i = 0; i < steps; i++) await scrubber.press(step > 16 ? "ArrowLeft" : "ArrowRight");
      await expect.poll(() => page.locator(beamSelector).getAttribute("data-phase").then(Number)).toBeCloseTo(step / 32, 7);
      return page.locator(beamSelector).evaluate(async (element: HTMLCanvasElement) => {
        const bitmap = await createImageBitmap(element);
        const surface = new OffscreenCanvas(element.width, element.height);
        const context = surface.getContext("2d")!; context.drawImage(bitmap, 0, 0); bitmap.close();
        const pixels = context.getImageData(0, 0, surface.width, surface.height).data;
        const margin = 3.5;
        const colorAt = (x: number, y: number) => {
          let signal = 0;
          for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
            const offset = (Math.round(y + dy) * surface.width + Math.round(x + dx)) * 4;
            // Canvas readback is unpremultiplied: a faint transparent stroke
            // keeps its RGB. Visible intensity includes its actual alpha.
            signal = Math.max(signal, (pixels[offset] - pixels[offset + 1]) * pixels[offset + 3] / 255);
          }
          return signal;
        };
        let coloredPixels = 0;
        for (let i = 0; i < pixels.length; i += 4) if ((pixels[i] - pixels[i + 1]) * pixels[i + 3] / 255 > 12) coloredPixels++;
        return { left: colorAt(margin, surface.height / 2), right: colorAt(surface.width - margin, surface.height / 2), top: colorAt(surface.width / 2, margin), bottom: colorAt(surface.width / 2, surface.height - margin), coloredPixels };
      });
    };
    const start = await at(0);
    expect(start.coloredPixels).toBe(0);
    const born = await at(1);
    expect(born.left).toBeGreaterThan(20); expect(born.right).toBeLessThan(5);
    const split = await at(13);
    expect(split.top).toBeGreaterThan(100); expect(split.bottom).toBeGreaterThan(100);
    expect(split.left).toBeLessThan(5); expect(split.right).toBeLessThan(5);
    const converged = await at(25);
    expect(converged.right).toBeGreaterThan(80);
    expect(converged.left).toBeLessThan(5); expect(converged.top).toBeLessThan(5); expect(converged.bottom).toBeLessThan(5);
    const fading = await at(28);
    expect(fading.right).toBeGreaterThan(0); expect(fading.right).toBeLessThan(converged.right * .7);
    const gone = await at(31);
    expect(gone).toEqual(start);
  });
}

test("browser: accepted Orbit remains pixel identical to version 1.3.1", async ({ page }) => {
  await openBeamProof(page);
  await selectBeamValue(page, "beam.motion", "orbit");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  const file = await (await pending).path();
  if (!file) throw new Error("No Orbit settings snapshot");
  const preset = JSON.parse(await readFile(file, "utf8"));
  const settings = resolveBeamSettings(preset.values);
  const seconds = preset.timeline.currentTimeSeconds;
  const duration = preset.timeline.durationSeconds;
  await expect.poll(() => page.locator(beamSelector).getAttribute("data-phase").then(Number)).toBeCloseTo(getBeamPhase(seconds / duration, settings, duration), 10);
  const current = await capture(page);
  const oldPage = await page.context().newPage();
  try {
    await oldPage.setContent(`<canvas></canvas><script>${acceptedOrbitRuntime}</script>`);
    const reference = await oldPage.evaluate(({ settings, seconds, duration }) => {
      const canvas = document.querySelector("canvas")!;
      const runtime = (window as unknown as { NodeBeam: { renderFrame: (...args: unknown[]) => void } }).NodeBeam;
      runtime.renderFrame(canvas, settings, seconds, { durationSeconds: duration, pixelRatio: 1 });
      const surface = new OffscreenCanvas(canvas.width, canvas.height);
      const context = surface.getContext("2d")!; context.drawImage(canvas, 0, 0);
      return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, surface.width, surface.height).data) };
    }, { settings, seconds, duration });
    expect([current.width, current.height]).toEqual([reference.width, reference.height]);
    const digest = (pixels: number[]) => createHash("sha256").update(Buffer.from(pixels)).digest("hex");
    expect(digest(current.pixels)).toBe(digest(reference.pixels));
  } finally { await oldPage.close(); }
});

for (const theme of ["light", "dark"]) {
  test(`browser: trail highlights follow ${theme} node geometry and seam`, async ({ page }) => {
    const session = await openBeamProof(page);
    await expectToolcraftProductObservableToChange(session, session.controlAction("beam.motion", () => selectBeamValue(page, "beam.motion", "trail")), { selector: beamSelector, ...(theme === "light" ? { requirementId: "beam.trail" } : {}) });
    await selectBeamValue(page, "beam.theme", theme);
    for (const shape of ["rounded", "rectangle", "circle"]) {
      await selectBeamValue(page, "beam.shape", shape);
      await expect(page.locator(beamSelector)).toHaveAttribute("data-theme", theme);
      await expect(page.locator(beamSelector)).toHaveAttribute("data-shape", shape);
      await seek(page, "Home");
      const beginning = await capture(page);
      await seek(page, "End");
      expect(await capture(page), `${theme}/${shape} joins the transport seam`).toEqual(beginning);
      await seek(page, "Home", 1);
      const moved = await capture(page);
      expect(moved.pixels).not.toEqual(beginning.pixels);
      // The center stays neutral; the effect belongs to the outline and its inward halo.
      const offset = (Math.floor(moved.height / 2) * moved.width + Math.floor(moved.width / 2)) * 4;
      expect(moved.pixels.slice(offset, offset + 4)).toEqual(theme === "dark" ? [32, 33, 35, 255] : [255, 255, 255, 255]);
    }

  });
}

test("browser: trail export restores identical developer frames", async ({ page }) => {
  const session = await openBeamProof(page);
  await expectToolcraftProductObservableToChange(session, session.controlAction("beam.motion", () => selectBeamValue(page, "beam.motion", "trail")), { selector: beamSelector, requirementId: "beam.trail-handoff" });
  await selectBeamValue(page, "beam.shape", "rounded");
  await selectBeamValue(page, "beam.theme", "light");

  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings", exact: true }).click();
  const file = await (await pending).path();
  if (!file) throw new Error("No Trail JSON download");
  const preset = JSON.parse(await readFile(file, "utf8"));
  const doc = preset.values["beam.developerHandoff"] as BeamHandoff;
  expect(preset.values["beam.motion"]).toBe("trail");
  expect(doc.motion).toMatchObject({ coordinate: "two-half-perimeter-paths", trail: { count: 2, length: .1 }, hue: { active: false } });
  const editor = await capture(page);
  const reproductionPage = await page.context().newPage();
  try {
    await reproductionPage.setContent(`<canvas></canvas><script>${doc.implementation.javascript}</script>`);
    const reproduction = await reproductionPage.evaluate(({ settings, seconds, duration }) => {
      const canvas = document.querySelector("canvas")!;
      const runtime = (window as unknown as { NodeBeam: { renderFrame: (...args: unknown[]) => void } }).NodeBeam;
      runtime.renderFrame(canvas, settings, seconds, { durationSeconds: duration, pixelRatio: 1 });
      // The adapter presents bitmaprenderer, so read through a 2D scratch surface.
      const surface = new OffscreenCanvas(canvas.width, canvas.height);
      const context = surface.getContext("2d")!; context.drawImage(canvas, 0, 0);
      return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, surface.width, surface.height).data) };
    }, { settings: doc.settings, seconds: preset.timeline.currentTimeSeconds, duration: doc.motion.transportDurationSeconds });
    expect(reproduction).toEqual(editor);
  } finally { await reproductionPage.close(); }
  await selectBeamValue(page, "beam.motion", "orbit");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings", exact: true }).click();
  await (await chooser).setFiles({ name: "trail.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(preset)) });
  await expect(page.locator(beamSelector)).toHaveAttribute("data-motion", "trail");
  await expect.poll(() => capture(page)).toEqual(editor);
});
