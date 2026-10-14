import { expect, test } from "./toolcraft-product-test";

test("browser: Node Beam Studio opens with a real node and native editor controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(page.locator('canvas[data-testid="beam-preview"]')).toBeVisible();
  await expect(page.locator('[data-toolcraft-control-target="beam.theme"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /Play playback|Pause playback/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PNG", exact: true })).toBeVisible();
  await expect(page.locator('[data-panel-type="layers"]')).toHaveCount(0);
});
