import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Page } from '@playwright/test';
import { expect, test } from './toolcraft-product-test';
import { openBeamProof, selectBeamValue, beamSelector } from './beam-ui-helpers';
import { expectToolcraftAcceptanceOutcome } from './browser-acceptance-outcome-helpers';
import { readToolcraftBrowserObservation } from './browser-proof-session';
import { getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { createToolcraftState } from '../src/toolcraft/runtime';
import { appSchema } from '../src/app/app-schema';
import { captureSharedSettings } from '../src/app/beam-shared-default';
import { createSharedDefaultHandler } from '../server/shared-default-handler';
import { PresetConflictError, type PresetLibrary } from '../server/preset-library';
import { validateSharedSettings } from '../server/shared-default-validation';

function service() {
  const slow = createToolcraftState(appSchema); slow.values['beam.speed'] = 0.5; slow.values['beam.theme'] = 'light';
  const fast = createToolcraftState(appSchema); fast.values['beam.speed'] = 2; fast.values['beam.theme'] = 'dark'; fast.values['beam.aspect'] = 'wide';
  const timestamp = new Date().toISOString();
  let library: PresetLibrary = { version: 2, revision: 'initial', defaultPresetId: 'slow', presets: [
    { id: 'slow', name: 'Slow', settings: captureSharedSettings(slow), playing: false, createdAt: timestamp, updatedAt: timestamp },
    { id: 'fast', name: 'Fast', settings: captureSharedSettings(fast), playing: false, createdAt: timestamp, updatedAt: timestamp },
  ] };
  let revision = 1, fail = false;
  const handler = createSharedDefaultHandler({ validate: validateSharedSettings, storage: {
    read: async () => ({ value: structuredClone(library), etag: String(revision) }),
    write: async (next, etag) => { if (fail) throw new Error('storage down'); if (etag !== String(revision)) throw new PresetConflictError('concurrent write'); library = structuredClone(next); revision++; },
  } });
  return {
    get library() { return library; }, set fail(value: boolean) { fail = value; },
    async attach(page: Page) {
      await page.route('**/api/shared-default*', async route => {
        const request = route.request();
        const req = Object.assign(Readable.from(request.postData() ? [Buffer.from(request.postData()!)] : []), {
          method: request.method(), url: '/api/shared-default', headers: { host: 'nodeanimation.vercel.app', origin: 'https://nodeanimation.vercel.app', 'content-type': 'application/json' },
        });
        const headers: Record<string, string> = {}; let body = '';
        const res = { statusCode: 200, setHeader: (key: string, value: string) => { headers[key] = value; }, end: (value: string) => { body = value; } };
        await handler(req as IncomingMessage, res as unknown as ServerResponse);
        await route.fulfill({ status: res.statusCode, headers, body });
      });
    },
  };
}
const nameField = (page: Page) => page.locator('[data-toolcraft-control-target="beam.presetName"]').getByRole('textbox');

test('browser: public presets load saved parameters and support management', async ({ page }) => {
  const api = service(); await api.attach(page);
  const session = await openBeamProof(page);
  await expect(page.getByLabel('Admin key')).toHaveCount(0);
  const before = await getToolcraftProductObservableSnapshot(page, { selector: beamSelector });
  const status = session.observe(root => root.ownerDocument.querySelector('[data-testid="beam-preset-library"]')?.textContent ?? '');
  await expectToolcraftAcceptanceOutcome(() => readToolcraftBrowserObservation(status), session.controlAction('beam.sharedDefault', () => page.getByRole('button', { name: 'Fast', exact: true }).click()), { requirementId: 'beam.sharedDefault', evidenceType: 'command-side-effect' });
  await expect(page.getByRole('slider', { name: 'Speed', exact: true })).toHaveAttribute('aria-valuenow', '2');
  await expect(page.locator('[data-toolcraft-control-target="beam.theme"]').getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => getToolcraftProductObservableSnapshot(page, { selector: beamSelector })).not.toBe(before);
  await nameField(page).fill('Fast renamed');
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fast renamed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fast renamed', exact: true })).toHaveCount(0);
  expect(api.library.presets.find(preset => preset.id === 'fast')?.deletedAt).toBeTruthy();
  await page.getByRole('button', { name: 'Deleted (1)', exact: true }).click();
  await page.getByRole('button', { name: 'Restore Fast renamed', exact: true }).click();
  await page.getByRole('button', { name: 'Fast renamed', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Speed', exact: true })).toHaveAttribute('aria-valuenow', '2');
  await page.getByRole('button', { name: 'Refresh list', exact: true }).click();
  expect(api.library.presets.find(preset => preset.id === 'fast')?.deletedAt).toBeUndefined();
});

test('browser: public preset names save named settings snapshots', async ({ page }) => {
  const api = service(); await api.attach(page);
  const session = await openBeamProof(page);
  await nameField(page).fill('');
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByText('Enter a preset name first.', { exact: false })).toBeVisible();
  await page.getByRole('slider', { name: 'Speed', exact: true }).press('ArrowRight');
  const speed = Number(await page.getByRole('slider', { name: 'Speed', exact: true }).getAttribute('aria-valuenow'));
  const feedback = session.observe(root => root.ownerDocument.querySelector('[data-sonner-toast]')?.textContent ?? '');
  await expectToolcraftAcceptanceOutcome(() => readToolcraftBrowserObservation(feedback), session.controlAction('beam.presetName', async () => {
    await nameField(page).fill('Named snapshot');
    await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  }), { requirementId: 'beam.presetName', evidenceType: 'command-side-effect' });
  const saved = api.library.presets.find(preset => preset.name === 'Named snapshot')!;
  expect((saved.settings as { values: Record<string, unknown> }).values['beam.speed']).toBe(speed);
  expect((saved.settings as { values: Record<string, unknown> }).values).not.toHaveProperty('beam.presetName');
  const id = saved.id;
  await page.getByRole('button', { name: 'Edit Speed value', exact: true }).click();
  await page.getByRole('textbox', { name: 'Speed value', exact: true }).fill('1.5');
  await page.getByRole('textbox', { name: 'Speed value', exact: true }).press('Enter');
  await selectBeamValue(page, 'beam.theme', 'dark');
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect.poll(() => (api.library.presets.find(preset => preset.id === id)!.settings as { values: Record<string, unknown> }).values['beam.speed']).toBe(1.5);
  expect(api.library.defaultPresetId).toBe('slow');
  expect(api.library.presets.filter(preset => preset.name === 'Named snapshot')).toHaveLength(1);
  const updated = structuredClone(api.library.presets.find(preset => preset.id === id)!.settings);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Slow · Default', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Named snapshot', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Speed', exact: true })).toHaveAttribute('aria-valuenow', '1.5');
  await expect(page.locator('[data-toolcraft-control-target="beam.theme"]').getByRole('button', { name: 'Dark', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(api.library.presets.find(preset => preset.id === id)!.settings).toEqual(updated);
  await nameField(page).fill('Slow');
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByText('This name is already used. Choose another name.', { exact: false })).toBeVisible();
});

test('browser: public default preset opens for fresh visitors', async ({ page }) => {
  const api = service(); await api.attach(page);
  const session = await openBeamProof(page);
  await page.getByRole('button', { name: 'Fast', exact: true }).click();
  const feedback = session.observe(root => root.ownerDocument.querySelector('[data-sonner-toast]')?.textContent ?? '');
  await expectToolcraftAcceptanceOutcome(() => readToolcraftBrowserObservation(feedback), session.controlAction('beam.defaultActions', () => page.getByRole('button', { name: 'Set as default', exact: true }).click()), { requirementId: 'beam.defaultActions', evidenceType: 'command-side-effect' });
  expect(api.library.defaultPresetId).toBe('fast');
  await expect(page.getByRole('button', { name: 'Fast · Default', exact: true })).toBeVisible();
  const visitorContext = await page.context().browser()!.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const visitor = await visitorContext.newPage(); await api.attach(visitor);
    await visitor.goto('/');
    await expect(visitor.getByRole('slider', { name: 'Speed', exact: true })).toHaveAttribute('aria-valuenow', '2');
    await expect(visitor.getByLabel('Admin key')).toHaveCount(0);
    await visitor.getByRole('slider', { name: 'Speed', exact: true }).press('ArrowRight');
    await visitor.reload();
    await expect(visitor.getByRole('slider', { name: 'Speed', exact: true })).toHaveAttribute('aria-valuenow', '2');
  } finally { await visitorContext.close(); }
  const previous = api.library.revision; api.fail = true;
  await nameField(page).fill('Failed save');
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await expect(page.getByText('Saving failed. Your previous presets are preserved; please retry.', { exact: false })).toBeVisible();
  expect(api.library.revision).toBe(previous);
});
