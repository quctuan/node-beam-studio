import { expectToolcraftInfinityCanvasBackgroundEvidence, observeInfinityCanvasBackground } from "./browser-infinity-canvas-evidence";
import type { Page } from "@playwright/test";
import { appSchema } from "../src/app/app-schema";
import { appAcceptance, appControlSectionInventory, getToolcraftControlApplicabilityCases, getToolcraftApplicabilityRequirementId } from "../src/app/app-acceptance";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { proveBeamGradient } from "./beam-gradient-helpers";
import { beamSelector, viewportSelector, openBeamProof, selectBeamValue, dragBeamSlider, editBeamColor, findBeamControl } from "./beam-ui-helpers";
import { expect, test } from "./toolcraft-product-test";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";

const productRows = appAcceptance.filter(row => row.target?.startsWith("beam.") && row.id !== "beam.background-output");
async function activateControl(page: Page, target: string) {
  if (target === "beam.background") await selectBeamValue(page, "export.includeBackground", true);
  if (target === "beam.gradient") await selectBeamValue(page, "beam.palette", "custom");
  if (target === "beam.radius" || target === "beam.aspect") await selectBeamValue(page, "beam.shape", "rounded");
  if (target === "beam.speed" || target === "beam.easing") await selectBeamValue(page, "beam.motion", "orbit");
}
async function changeControl(page: Page, target: string, alternate = false) {
  const schema = findBeamControl(target);
  if (!schema) throw new Error(`Unknown product target ${target}`);
  if (schema.type === "slider") return dragBeamSlider(page, target, alternate ? .25 : .8);
  if (schema.type === "color") {
    const field = await getToolcraftControlFieldByTarget(page, target);
    return editBeamColor(field, alternate ? "#DBEEF8" : "#C2A8F3");
  }
  const options = schema.options ?? [];
  const field = await getToolcraftControlFieldByTarget(page, target);
  const current = schema.type === "segmented" ? await field.locator("[aria-pressed=\"true\"]").innerText() : await field.locator("[data-slot=\"select-value\"]").innerText();
  const option = options.find(item => current.trim() !== item.label) ?? options[options.length - 1];
  if (!option) throw new Error(`No alternative ${target}`);
  return selectBeamValue(page, target, option.value);
}

for (const row of productRows) {
  const target = row.target!;
  test(`browser: ${target} changes actual node output`, async ({ page }) => {
    const session = await openBeamProof(page);
    await activateControl(page, target);
    const selector = target === "beam.background" ? viewportSelector : beamSelector;
    if (target === "beam.gradient") {
      await proveBeamGradient(page, session, row.id, selector);
    } else {
      const schema = findBeamControl(target)!;
      if (schema.options) {
        await selectBeamValue(page, target, schema.options[schema.options.length - 1]!.value);
        for (const [index, option] of schema.options.entries()) {
          await expectToolcraftProductObservableToChange(session, session.controlAction(target, async () => { await selectBeamValue(page, target, option.value); }), {
            selector, ...(index === 0 ? { requirementId: row.id } : {}),
          });
        }
      } else {
        await expectToolcraftProductObservableToChange(session, session.controlAction(target, async () => { await changeControl(page, target); }), { selector, requirementId: row.id });
      }
    }
    if (findBeamControl(target)?.type === "segmented") await expectToolcraftSegmentedControlCellsPreservePadding(page, String(findBeamControl(target)?.label), { target, requirementId: row.id });
    const cases = getToolcraftControlApplicabilityCases({ schema: appSchema, sectionInventory: appControlSectionInventory, target });
    for (const [index, applicabilityCase] of cases.entries()) {
      await expectToolcraftControlApplicabilityState(session, session.controlAction(applicabilityCase.selectorTarget, async () => {
        await selectBeamValue(page, applicabilityCase.selectorTarget, applicabilityCase.selectorValue);
      }), applicabilityCase, { baseRequirementId: row.id });
      if (applicabilityCase.expectation === "visible") {
        const requirementId = getToolcraftApplicabilityRequirementId(row.id, applicabilityCase);
        if (target === "beam.gradient") await proveBeamGradient(page, session, requirementId, selector);
        else await expectToolcraftProductObservableToChange(session, session.controlAction(target, async () => { await changeControl(page, target, index % 2 === 0); }), { selector, requirementId });
        if (findBeamControl(target)?.type === "segmented") await expectToolcraftSegmentedControlCellsPreservePadding(page, String(findBeamControl(target)?.label), { target, requirementId });
      }
    }
  });
}

test("browser: background fill preserves Infinity without image export", async ({ page }) => {
  const session = await openBeamProof(page);
  await selectBeamValue(page, "canvas.infinity", true);
  await selectBeamValue(page, "export.includeBackground", true);
  const infinite = await observeInfinityCanvasBackground(page);
  await expectToolcraftProductObservableToChange(session,
    session.controlAction("export.includeBackground", async () => { await selectBeamValue(page, "export.includeBackground", false); }),
    { selector: viewportSelector, requirementId: "beam.background-output" });
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await selectBeamValue(page, "export.includeBackground", true);
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence({ infinite, backgroundExcluded, backgroundRestored }, { expectedBackgroundColor: "#F6F7F8", requirementId: "beam.background-output", target: "export.includeBackground" });
});
