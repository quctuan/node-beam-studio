import { defineToolcraftCustomControlType } from "@/toolcraft/runtime";
import { beamHandoffActionsTarget, beamHandoffTarget } from "./beam-handoff";

export const beamHandoffControl = defineToolcraftCustomControlType("beamHandoffInspector");
export const beamHandoffSection = {
  id: "beam-handoff", title: "Developer Handoff",
  description: "Export Settings includes motion data and the exact renderer. Copy HTML creates a standalone preview; Copy spec copies the developer JSON.",
  controls: {
    inspector: { type: beamHandoffControl, target: beamHandoffTarget, defaultValue: {}, label: false, applicability: { mode: "always" as const }, keyframeable: false, orderRole: "detail" as const },
    copy: { type: "actions" as const, target: beamHandoffActionsTarget, label: false, applicability: { mode: "always" as const }, orderRole: "primary" as const, actions: [{ label: "Copy HTML", value: "beam.copyHtml" }, { label: "Copy spec", value: "beam.copySpec" }] },
  },
};
