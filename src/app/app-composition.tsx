import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { beamPipelineRegistration } from "./app-performance";
import { BeamCanvas, beamSceneBoundsProvider } from "./beam-renderer";
import { withSettingsFooter } from "./beam-panel-presentation";
import { BeamWorkspaceContrast } from "./beam-workspace";
import { BeamHandoffSync, BeamHandoffInspector, beamHandoffActionHandler } from "./beam-handoff-inspector";
import { beamHandoffControl } from "./beam-handoff-schema";
import { BeamPresetLibrary, BeamSharedDefaultBootstrap, sharedDefaultActionHandler } from "./beam-shared-default-ui";
import { sharedDefaultControl } from "./beam-shared-default-schema";

export const appComposition = composeToolcraftApp(withSettingsFooter(appSchema), {
  scene: {
    canvasContent: <><BeamCanvas /><BeamHandoffSync /><BeamSharedDefaultBootstrap /></>,
    infiniteCanvasContent: <BeamWorkspaceContrast />,
    sceneBoundsProvider: beamSceneBoundsProvider,
    renderDefaultCanvasMedia: false,
  },
  renderer: { pipelineRegistration: beamPipelineRegistration },
  controls: { renderers: { [beamHandoffControl]: BeamHandoffInspector, [sharedDefaultControl]: BeamPresetLibrary } },
  actions: { onPanelAction: async context => {
    await sharedDefaultActionHandler(context);
    await beamHandoffActionHandler(context);
  } },
});
