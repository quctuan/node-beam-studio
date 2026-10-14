import { defineToolcraftCustomControlType } from '@/toolcraft/runtime';
export const sharedDefaultControl = defineToolcraftCustomControlType('beamPresetLibrary');
export const sharedDefaultTarget = 'beam.sharedDefault';
export const sharedDefaultActionsTarget = 'beam.defaultActions';
export const presetNameTarget = 'beam.presetName';
export const sharedDefaultSection = {
  id: 'beam-shared-default', title: 'Saved Presets',
  description: 'Public presets shared by everyone. Select a set to load its settings. Save preset creates a named copy. Set as default saves the current settings into the selected set (or a new set) and loads it for future visits.',
  controls: {
    library: { type: sharedDefaultControl, target: sharedDefaultTarget, defaultValue: '', label: false, applicability: { mode: 'always' as const }, keyframeable: false, orderRole: 'detail' as const },
    name: { type: 'text' as const, target: presetNameTarget, label: 'Preset name', defaultValue: '', textValueKind: 'single-line' as const, commitMode: 'content' as const, applicability: { mode: 'always' as const }, keyframeable: false, orderRole: 'detail' as const,
      performanceRole: 'responsiveness' as const, performanceReason: 'Names a server-saved preset; typing does not invalidate the node renderer.' },
    publish: { type: 'actions' as const, target: sharedDefaultActionsTarget, label: false, applicability: { mode: 'always' as const }, orderRole: 'primary' as const,
      actions: [{ label: 'Save preset', value: 'beam.savePreset' }, { label: 'Set as default', value: 'beam.setDefault' }, { label: 'Rename', value: 'beam.renamePreset' }, { label: 'Delete', value: 'beam.deletePreset' }] },
  },
};
