import type {
  ToolcraftPerformanceCanvasBacking,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";
import { expect, type Page } from "@playwright/test";
import { compileToolcraftPerformanceFixturePlan } from "@/toolcraft/runtime";
import { appPerformance, beamPerformancePaths } from "../src/app/app-performance";
import { beamSelector, viewportSelector, selectBeamValue, findBeamControl, editBeamColor } from "./beam-ui-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { panBeam } from "./beam-runtime-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import type { ToolcraftCompiledFixtureApplications } from "./performance-compiled-fixture-runtime";

export const appPerformanceCanvasBacking = {
  canvasSelector: beamSelector,
} satisfies ToolcraftPerformanceCanvasBacking;

async function setSlider(page: Page, target: string, value: unknown): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.scrollIntoViewIfNeeded();
  if (Number(await field.getByRole("slider").getAttribute("aria-valuenow")) === Number(value)) return;
  await field.getByRole("button", { name: /^Edit .* value$/ }).click();
  const input = field.getByRole("textbox").first();
  await input.fill(String(value));
  await input.press("Enter");
  await expect(field.getByRole("slider")).toHaveAttribute("aria-valuenow", String(value));
}

async function readZoom(page: Page): Promise<number> {
  return Number(await page.locator("[data-toolcraft-canvas-zoom]").getAttribute("data-toolcraft-canvas-zoom"));
}

async function setZoom(page: Page, value: unknown): Promise<void> {
  const wanted = Number(value);
  for (let attempt = 0; attempt < 25; attempt++) {
    const current = await readZoom(page);
    if (current === wanted) return;
    await page.getByRole("button", { name: current < wanted ? "Zoom in" : "Zoom out", exact: true }).click();
  }
  expect(await readZoom(page)).toBe(wanted);
}

const fixtureTargets: Record<string, string> = {
  "node-width": "beam.width", "preview-scale": "canvas.renderScale", "export-resolution": "export.image.resolution",
};

function fixtureApplications(page: Page, dimensionIds: readonly string[]): ToolcraftCompiledFixtureApplications {
  return Object.fromEntries(dimensionIds.map(id => [id, id === "viewport-zoom" ? {
    applyValue: (value: unknown) => setZoom(page, value), observeValue: () => readZoom(page),
  } : {
    applyValue: (value: unknown) => id === "export-resolution"
      ? selectBeamValue(page, fixtureTargets[id], String(value)) : setSlider(page, fixtureTargets[id], value),
    observeValue: async () => {
      const field = await getToolcraftControlFieldByTarget(page, fixtureTargets[id]);
      return id === "export-resolution"
        ? (await field.getByRole("combobox").textContent())?.trim().toLowerCase()
        : Number(await field.getByRole("slider").getAttribute("aria-valuenow"));
    },
  }]));
}

export const appPerformancePathAdapters: readonly ToolcraftPerformancePathAdapter[] = beamPerformancePaths.map((path): ToolcraftPerformancePathAdapter => {
  const dimensions = compileToolcraftPerformanceFixturePlan(appPerformance, path).dimensionIds;
  const base = {
    pathId: path.id,
    prepare: async (page: Page) => {
      await page.goto("/");
      await expect(page.locator(beamSelector)).toHaveAttribute("data-ready", "true");
      const pause = page.getByRole("button", { name: "Pause playback", exact: true });
      if (await pause.isVisible()) await pause.click();
      await selectBeamValue(page, "beam.palette", "custom");
      await selectBeamValue(page, "panels.timeline.extended", true);
    },
    ...(dimensions.length ? { fixtureApplications: (page: Page) => fixtureApplications(page, dimensions) } : {}),
    ...(path.interaction === "animation-frame" ? { preparePhase: async ({ page }: { page: Page }) => {
      const play = page.getByRole("button", { name: "Play playback", exact: true });
      if (await play.isVisible()) await play.click();
    } } : {}),
    observeOutcome: ({ page }: { page: Page }) => getToolcraftProductObservableSnapshot(page, { selector: path.targets.some(target => ["beam.background", "export.includeBackground", "canvas.workspaceBackground"].includes(target)) ? viewportSelector : beamSelector }),
  };
  if (path.interaction === "export") return {
    ...base, output: { kind: "download" as const, label: "Export PNG", verify: async (download, page) => {
      const actual = await inspectToolcraftImageDownload({ page, download, backgroundRgba: [246, 247, 248, 255] });
      expect(actual.inspection.width).toBeGreaterThan(0);
      expect(actual.inspection.height).toBeGreaterThan(0);
    } },
  };
  return { ...base, action: async ({ page }) => {
    if (path.interaction === "initial-render") { await page.reload(); return; }
    if (path.interaction === "viewport-drag") return panBeam(page);
    if (path.interaction === "viewport-zoom") { await page.getByRole("button", { name: "Zoom out", exact: true }).click(); return; }
    if (["timeline-playback", "animation-frame"].includes(path.interaction)) { await page.getByRole("button", { name: "Play playback", exact: true }).click(); return; }
    if (path.interaction === "timeline-scrub") { await page.getByRole("slider", { name: "Playback position" }).press("ArrowRight"); return; }
    const target = path.targets[0];
    const control = findBeamControl(target);
    if (!control) throw new Error(`No real UI action for performance path ${path.id}.`);
    if (control.type === "slider") return dragToolcraftSliderByTarget(page, target, 0.6, { pathId: path.id });
    const field = await getToolcraftControlFieldByTarget(page, target);
    if (control.type === "switch" || control.type === "checkbox") {
      const current = (await field.getByRole(control.type).getAttribute("aria-checked")) === "true";
      await selectBeamValue(page, target, !current); return;
    }
    if (control.type === "color") return editBeamColor(field, "#C2A8F3");
    if (control.type === "gradient") {
      const angle = field.getByRole("textbox", { name: "Gradient angle", exact: true });
      await angle.fill("72"); await angle.press("Enter"); return;
    }
    const current = control.type === "segmented" ? await field.locator('[aria-pressed="true"]').innerText() : await field.getByRole("combobox").textContent();
    const option = control.options?.find(item => !current?.trim().startsWith(item.label));
    if (option) await selectBeamValue(page, target, option.value);
  } };
});
