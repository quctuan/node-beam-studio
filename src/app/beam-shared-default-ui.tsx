import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { applyToolcraftSettingsPayload, parseToolcraftSettingsPayload, useToolcraftDispatch, useToolcraftSelector, type ToolcraftCustomControlRendererProps, type ToolcraftPanelActionHandler } from '@/toolcraft/runtime/react';
import { Button, ScrollFade, toast } from '@/toolcraft/ui';
import { captureSharedSettings, getSharedDefaultStatus, loadSharedPresets, sharedDefaultRequest, sharedSettingsFingerprint, subscribeSharedDefault, updateSharedDefault, type SavedPreset } from './beam-shared-default';
import { presetNameTarget, sharedDefaultTarget } from './beam-shared-default-schema';
import styles from './beam-shared-default.module.css';

function applyPreset(state: ToolcraftCustomControlRendererProps['state'], dispatch: ToolcraftCustomControlRendererProps['dispatch'], preset: SavedPreset) {
  const settings = parseToolcraftSettingsPayload(state.schema, JSON.parse(preset.settingsJson));
  if (!settings) throw new Error('This preset is incompatible with this version.');
  applyToolcraftSettingsPayload({ state, dispatch }, settings, [], true);
  dispatch({ type: 'timeline.setPlaying', isPlaying: preset.playing });
  dispatch({ type: 'controls.setValue', target: sharedDefaultTarget, value: preset.id, history: 'skip' });
  dispatch({ type: 'controls.setValue', target: presetNameTarget, value: preset.name, history: 'skip' });
}
export function BeamSharedDefaultBootstrap() {
  const state = useToolcraftSelector(state => state);
  const latest = useRef(state); latest.current = state;
  const dispatch = useToolcraftDispatch();
  useEffect(() => {
    let active = true;
    const initial = JSON.stringify([sharedSettingsFingerprint(latest.current), latest.current.values[sharedDefaultTarget], latest.current.values[presetNameTarget]]);
    void loadSharedPresets().then(({ library }) => {
      if (!active || initial !== JSON.stringify([sharedSettingsFingerprint(latest.current), latest.current.values[sharedDefaultTarget], latest.current.values[presetNameTarget]])) return;
      const preset = Object.values(library.presets).find(item => item.id === library.defaultPresetId && !item.deletedAt);
      if (preset) applyPreset(latest.current, dispatch, preset);
    }).catch(() => { if (active) updateSharedDefault({ loading: false, error: 'Could not load saved presets. Your current settings are preserved.' }); });
    return () => { active = false; };
  }, [dispatch]);
  return null;
}

export function BeamPresetLibrary({ state, value, dispatch }: ToolcraftCustomControlRendererProps) {
  const status = useSyncExternalStore(subscribeSharedDefault, getSharedDefaultStatus, getSharedDefaultStatus);
  const [showTrash, setShowTrash] = useState(false);
  const [busy, setBusy] = useState(false);
  const presets = Object.values(status.library?.presets ?? {}).filter(item => !item.deletedAt);
  const trash = Object.values(status.library?.presets ?? {}).filter(item => item.deletedAt);
  const chosen = presets.find(item => item.id === value);
  function open(preset: SavedPreset) {
    try { applyPreset(state, dispatch, preset); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not open preset.'); }
  }
  async function refresh() {
    setBusy(true);
    try { await loadSharedPresets(); }
    catch (err) { updateSharedDefault({ loading: false, error: err instanceof Error ? err.message : 'Please retry.' }); }
    finally { setBusy(false); }
  }
  async function restore(preset: SavedPreset) {
    setBusy(true);
    try { await sharedDefaultRequest({ operation: 'restore', id: preset.id }); toast.success('Preset restored'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not restore preset.'); }
    finally { setBusy(false); }
  }
  return <div className={styles.library} aria-label="Shared preset library" data-testid="beam-preset-library">
    <p className={styles.status}>{status.loading ? 'Loading presets…' : 'Shared with everyone. Select a preset to open it.'}</p>
    {status.error ? <p role="status" className={styles.status}>{status.error}</p> : null}
    <ScrollFade className={styles.list} scrollBoundaryBehavior="chain">
      {presets.map(preset => <PresetOption key={preset.id} preset={preset} selected={value === preset.id} isDefault={status.library?.defaultPresetId === preset.id} onOpen={() => open(preset)} />)}
    </ScrollFade>
    {!status.loading && !presets.length ? <p className={styles.status}>No saved presets yet. Name your settings and save the first set.</p> : null}
    {chosen ? <p className={styles.status}>Opened: {chosen.name}</p> : null}
    <div className={styles.utilities}>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => void refresh()}>Refresh list</Button>
      {trash.length ? <Button size="sm" variant="ghost" aria-expanded={showTrash} onClick={() => setShowTrash(!showTrash)}>Deleted ({trash.length})</Button> : null}
    </div>
    {showTrash ? <div className={styles.trash} aria-label="Deleted presets">
      {trash.map(preset => <DeletedPreset key={preset.id} preset={preset} busy={busy} onRestore={() => void restore(preset)} />)}
    </div> : null}
  </div>;
}
function PresetOption({ preset, selected, isDefault, onOpen }: { preset: SavedPreset; selected: boolean; isDefault: boolean; onOpen: () => void }): React.JSX.Element {
  return <Button className={styles.option} size="sm" variant={selected ? 'outline' : 'ghost'} aria-pressed={selected} onClick={onOpen}>{preset.name}{isDefault ? ' · Default' : ''}</Button>;
}
function DeletedPreset({ preset, busy, onRestore }: { preset: SavedPreset; busy: boolean; onRestore: () => void }): React.JSX.Element {
  return <div className={styles.deletedRow}><span>{preset.name}</span><Button size="sm" variant="ghost" disabled={busy} aria-label={`Restore ${preset.name}`} onClick={onRestore}>Restore</Button></div>;
}
export const sharedDefaultActionHandler: ToolcraftPanelActionHandler = async ({ action, state, dispatch, reportProgress, reportFeedback }) => {
  const operations: Record<string, string> = { 'beam.savePreset': 'save', 'beam.setDefault': 'set-default', 'beam.renamePreset': 'rename', 'beam.deletePreset': 'delete' };
  const operation = operations[action.value];
  if (!operation) return;
  try {
    const selectedId = typeof state.values[sharedDefaultTarget] === 'string' && state.values[sharedDefaultTarget] ? state.values[sharedDefaultTarget] : null;
    const name = typeof state.values[presetNameTarget] === 'string' ? state.values[presetNameTarget].trim() : '';
    if (['save', 'rename'].includes(operation) && !name) throw new Error('Enter a preset name first.');
    if (['rename', 'delete'].includes(operation) && !selectedId) throw new Error('Choose a saved preset first.');
    const settings = captureSharedSettings(state);
    reportProgress(0.2);
    const result = await sharedDefaultRequest({ operation, id: operation === 'save' ? crypto.randomUUID() : selectedId, name, ...(['save', 'set-default'].includes(operation) ? { settingsJson: JSON.stringify(settings), playing: state.timeline.isPlaying } : {}) });
    if (result.selectedId) {
      dispatch({ type: 'controls.setValue', target: sharedDefaultTarget, value: result.selectedId, history: 'skip' });
      const preset = Object.values(result.library.presets).find(item => item.id === result.selectedId);
      if (preset) dispatch({ type: 'controls.setValue', target: presetNameTarget, value: preset.name, history: 'skip' });
    } else if (operation === 'delete') {
      dispatch({ type: 'controls.setValue', target: sharedDefaultTarget, value: '', history: 'skip' });
      dispatch({ type: 'controls.setValue', target: presetNameTarget, value: '', history: 'skip' });
    }
    reportProgress(1);
    toast.dismiss();
    toast.success(operation === 'save' ? 'Preset saved' : operation === 'set-default' ? 'Default saved for everyone' : operation === 'rename' ? 'Preset renamed' : 'Preset deleted', { description: operation === 'delete' ? 'You can restore it from Deleted.' : operation === 'set-default' ? 'New visits will load these settings.' : undefined });
  } catch (err) { reportFeedback({ code: 'preset-action-failed', message: err instanceof Error ? err.message : 'Could not save preset. Please retry.' }); }
};
