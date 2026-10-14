import { defineToolcraft, timelineModule } from "@/toolcraft/runtime";

import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";
import { beamSections } from "./beam-schema";
import { referenceTransportSeconds } from "./beam-reference";

export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    canvas: {
      enabled: true,
      upload: false,
      draggable: true,
      renderScale: true,
      size: { width: 800, height: 600, unit: "px" },
      sizing: { mode: "editable-output" },
    },
    identity: appIdentity,
    settingsTransfer: { enabled: true, fileName: "node-beam-preset.json" },
    panels: {
      controls: {
        sections: beamSections,
        title: "Node Beam Studio",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    },
  },
  modules: [timelineModule({ mode: "playback", defaultDurationSeconds: referenceTransportSeconds })],
});
