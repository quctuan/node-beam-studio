import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";
import type { ToolcraftControlSectionInventoryEntry } from "./acceptance/types";

import { beamDefaults, beamTargets } from "./beam-types";
import { beamHandoffSection } from "./beam-handoff-schema";
import { beamHandoffTarget, beamHandoffActionsTarget } from "./beam-handoff";
import { sharedDefaultSection, sharedDefaultTarget, sharedDefaultActionsTarget, presetNameTarget } from "./beam-shared-default-schema";

const responsive = {
  performanceRole: "responsiveness" as const,
  performanceReason: "Changes the next shared border and inward-light frame without creating renderer resources.",
};
const always = { mode: "always" as const };

export const beamModeRequestEvidence = {
  source: "user-message" as const,
  messageRef: "01a1194a-4dd2-7a20-b9b5-4108a7ebd1fe/msg_01a11a54-4778-71f1-949f-d3f175e646f3",
  messageText: "[https://github.com/pixel-point/toolcraft](https://github.com/pixel-point/toolcraft)\n\n\n\nAnh đang muốn build 1 tool để tự custom hiệu ứng này. Check source này xem nhé.\n\n\n\nGoal:\n\n- Dễ dàng edit, tinh chỉnh các thông số để tạo hiệu ứng và giao diện như ý\n\n\n\nYêu cầu:\n\n- Chuyển đổi mode: Light & Dark\n- Background: Nền trơn hoặc canvas như các tool design\n- Tỉ lệ khung node, shape node\n- Tốc độ chuyển động\n- Các loại chuyển động khác nhau để chọn\n- Bảng màu sắc để tự pick\n- Độ hắt sáng màu sắc vào phía trong node (Spread)\n- Độ dày border gradient\n- Effect style...\n\n\n\n[https://toolcraft.sh/demos/prism-flow](https://toolcraft.sh/demos/prism-flow)\n\nTham khảo\n\n",
  quote: "- Chuyển đổi mode: Light & Dark",
};

export const appControlSectionInventory = [
  {
    id: "beam-background", title: "Background", entityId: "workspace-background", entity: "Workspace background",
    targets: [beamTargets.includeBackground, beamTargets.background],
    groupingReason: "The runtime moves this source pair into Settings beside its native Blanc/Dots workspace preference.",
    finiteSelectors: [{ target: beamTargets.includeBackground, role: "parameter", reason: "Controls preview fill; the native background color picker remains editable in both states." }],
  },
  {
    id: "beam-appearance", title: "Node Appearance", entityId: "node-theme", entity: "Node appearance",
    targets: [beamTargets.theme],
    groupingReason: "The requested Light/Dark node mode is always reachable before editing node geometry or light.",
    finiteSelectors: [{
      target: beamTargets.theme, role: "branch", affectedTargets: [beamTargets.style],
      reason: "Light and Dark select the node surface and color response while sharing the same effect-editing operations.",
      productMode: {
        request: beamModeRequestEvidence,
        sharedTargets: [beamTargets.aspect, beamTargets.shape, beamTargets.width, beamTargets.radius,
          beamTargets.motion, beamTargets.speed, beamTargets.easing, beamTargets.palette, beamTargets.gradient,
          beamTargets.spread, beamTargets.intensity, beamTargets.blur, beamTargets.borderWidth, beamTargets.style, beamHandoffTarget, beamHandoffActionsTarget, sharedDefaultTarget, sharedDefaultActionsTarget, presetNameTarget],
      },
    }],
  },
  {
    id: "beam-node", title: "Node Frame", entityId: "node-frame", entity: "Node frame",
    targets: [beamTargets.shape, beamTargets.aspect, beamTargets.width, beamTargets.radius],
    groupingReason: "Shape, ratio, width, and corner radius define one node outline and reset together. Circle owns a square diameter; ratio is retained while hidden.",
    finiteSelectors: [
      { target: beamTargets.shape, role: "branch", affectedTargets: [beamTargets.width], reason: "Circle uses diameter and hides ratio; only rounded shapes expose corner radius." },
      { target: beamTargets.aspect, role: "parameter", reason: "Changes node height relative to its authored width." },
    ],
  },
  {
    id: "beam-motion", title: "Motion", entityId: "beam-motion", entity: "Beam motion",
    targets: [beamTargets.motion, beamTargets.speed, beamTargets.easing],
    groupingReason: "Choose the movement and its rhythm together; Static preserves but hides timing parameters.",
    finiteSelectors: [
      { target: beamTargets.motion, role: "branch", affectedTargets: [], reason: "Static has no timing parameters; Orbit, Trail and Breathe share speed and easing." },
      { target: beamTargets.easing, role: "parameter", reason: "Changes the continuous temporal phase response without changing other available controls." },
    ],
  },
  {
    id: "beam-spectrum", title: "Beam Spectrum", entityId: "beam-spectrum", entity: "Beam spectrum",
    targets: [beamTargets.palette, beamTargets.gradient],
    groupingReason: "Presets and the atomic built-in gradient editor author one palette shared by border and inward light. Custom preserves all gradient stops and opacity.",
    finiteSelectors: [{ target: beamTargets.palette, role: "branch", affectedTargets: [], reason: "Custom exposes the complete gradient editor; preset palettes preserve the hidden custom gradient." }],
  },
  {
    id: "beam-light", title: "Light & Border", entityId: "beam-light", entity: "Beam light and border",
    targets: [beamTargets.style, beamTargets.borderWidth, beamTargets.spread, beamTargets.intensity, beamTargets.blur],
    groupingReason: "Style, outline width and inward light falloff tune the same optical effect and share a useful section reset boundary.",
    finiteSelectors: [{ target: beamTargets.style, role: "parameter", reason: "Selects soft, luminous, or sharply outlined rendering while preserving the authored light parameters." }],
  },
  {
    id: "beam-handoff", title: "Developer Handoff", entityId: "developer-handoff", entity: "Developer handoff",
    targets: [beamHandoffTarget, beamHandoffActionsTarget],
    groupingReason: "Read effective timing and optical parameters, inspect the procedural phase curve, and copy the same renderer or specification for developer reproduction.", finiteSelectors: [],
  },
  {
    id: "beam-shared-default", title: "Saved Presets", entityId: "shared-default", entity: "Shared presets",
    targets: [sharedDefaultTarget, sharedDefaultActionsTarget, presetNameTarget], finiteSelectors: [],
    groupingReason: "Save, select, rename and remove named settings snapshots in the shared library; publish the startup preset without login.",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];

/** Product sections only; the host composes timeline and artifact modules. */
export const beamControlSections = [
  {
    id: "beam-background", title: "Background",
    controls: {
      includeBackground: { type: "switch", target: beamTargets.includeBackground, label: "Background", defaultValue: beamDefaults.includeBackground, applicability: always, orderRole: "primary", keyframeable: false, ...responsive },
      background: {
        type: "color", target: beamTargets.background, label: "Background color", defaultValue: beamDefaults.background,
        applicability: always,
        orderRole: "color", ...responsive,
      },
    },
  },
  {
    id: "beam-appearance", title: "Node Appearance",
    controls: {
      theme: {
        type: "segmented", target: beamTargets.theme, label: "Mode", defaultValue: beamDefaults.theme,
        options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }],
        applicability: always, keyframeable: false, orderRole: "mode", ...responsive,
      },
    },
  },
  {
    id: "beam-node", title: "Node Frame",
    controls: {
      shape: {
        type: "select", target: beamTargets.shape, label: "Shape", defaultValue: beamDefaults.shape,
        options: [{ value: "rounded", label: "Rounded" }, { value: "rectangle", label: "Rectangle" }, { value: "circle", label: "Circle" }],
        applicability: always, orderRole: "mode", ...responsive,
      },
      aspect: {
        type: "segmented", target: beamTargets.aspect, label: "Ratio", defaultValue: beamDefaults.aspect,
        options: [{ value: "square", label: "1:1" }, { value: "wide", label: "16:9" }, { value: "portrait", label: "3:4" }],
        applicability: { mode: "conditional", all: [{ target: beamTargets.shape, notEquals: "circle" }] }, orderRole: "detail", ...responsive,
      },
      width: {
        type: "slider", target: beamTargets.width, label: "Width / Diameter", defaultValue: beamDefaults.width,
        min: 300, max: 640, step: 10, unit: "px", sliderValueKind: "continuous", editableRange: { hardMin: 300, hardMax: 640 },
        applicability: always, orderRole: "detail", performanceRole: "workload",
        performanceReason: "Node edge length bounds the live Canvas2D backing and the optical perimeter sampling envelope.",
      },
      radius: {
        type: "slider", target: beamTargets.radius, label: "Corner radius", defaultValue: beamDefaults.radius,
        min: 0, max: 64, step: 1, unit: "px", sliderValueKind: "continuous", editableRange: { hardMin: 0, hardMax: 64 },
        applicability: { mode: "conditional", all: [{ target: beamTargets.shape, equals: "rounded" }] }, orderRole: "detail", ...responsive,
      },
    },
  },
  {
    id: "beam-motion", title: "Motion",
    controls: {
      motion: {
        type: "segmented", target: beamTargets.motion, label: "Movement", defaultValue: beamDefaults.motion,
        options: [{ value: "orbit", label: "Orbit" }, { value: "trail", label: "Trail" }, { value: "breathing", label: "Breathe" }, { value: "static", label: "Static" }],
        description: "Orbit rotates the original broad light field. Trail splits from the left midpoint into upper and lower paths, converges at the right midpoint, then fades out. Breathe pulses the whole border; Static holds one frame.",
        applicability: always, orderRole: "mode", ...responsive,
      },
      speed: {
        type: "slider", target: beamTargets.speed, label: "Speed", defaultValue: beamDefaults.speed,
        min: 0.25, max: 3, step: 0.25, sliderValueKind: "continuous", editableRange: { hardMin: 0.25, hardMax: 3 },
        description: "1 completes a cycle in 1.96 seconds at the default duration. Orbit uses angular rotation; Trail splits, travels along both half-perimeters, then converges and fades. Border and inward light share the same phase. Changing transport duration retimes complete cycles.",
        applicability: { mode: "conditional", all: [{ target: beamTargets.motion, notEquals: "static" }] }, orderRole: "detail", ...responsive,
      },
      easing: {
        type: "segmented", target: beamTargets.easing, label: "Rhythm", defaultValue: beamDefaults.easing,
        options: [{ value: "linear", label: "Linear" }, { value: "ease", label: "Ease" }],
        applicability: { mode: "conditional", all: [{ target: beamTargets.motion, notEquals: "static" }] }, orderRole: "detail", ...responsive,
      },
    },
  },
  {
    id: "beam-spectrum", title: "Beam Spectrum",
    controls: {
      palette: {
        type: "select", target: beamTargets.palette, label: "Palette", defaultValue: beamDefaults.palette,
        options: [{ value: "fiora", label: "Fiora" }, { value: "spectrum", label: "Spectrum" }, { value: "cyan", label: "Cyan" }, { value: "custom", label: "Custom" }],
        applicability: always, orderRole: "mode", ...responsive,
      },
      gradient: {
        type: "gradient", target: beamTargets.gradient, label: "Gradient", defaultValue: beamDefaults.gradient,
        description: "Edit the four initial colors, stop positions and opacity. The same gradient drives the sharp border and its inward light.",
        applicability: { mode: "conditional", all: [{ target: beamTargets.palette, equals: "custom" }] }, orderRole: "color", ...responsive,
      },
    },
  },
  {
    id: "beam-light", title: "Light & Border",
    controls: {
      style: {
        type: "segmented", target: beamTargets.style, label: "Style", defaultValue: beamDefaults.style,
        options: [{ value: "soft", label: "Soft" }, { value: "neon", label: "Neon" }, { value: "crisp", label: "Crisp" }],
        applicability: always, orderRole: "mode", ...responsive,
      },
      borderWidth: {
        type: "slider", target: beamTargets.borderWidth, label: "Border width", defaultValue: beamDefaults.borderWidth,
        min: 1, max: 8, step: 0.5, unit: "px", sliderValueKind: "continuous", editableRange: { hardMin: 1, hardMax: 8 },
        applicability: always, orderRole: "detail", ...responsive,
      },
      spread: {
        type: "slider", target: beamTargets.spread, label: "Inward spread", defaultValue: beamDefaults.spread,
        min: 0, max: 100, step: 1, unit: "px", sliderValueKind: "continuous",
        description: "How far colored light reaches into the node; zero keeps the animated border without inward light.",
        applicability: always, orderRole: "detail", ...responsive,
      },
      intensity: {
        type: "slider", target: beamTargets.intensity, label: "Glow strength", defaultValue: beamDefaults.intensity,
        min: 0, max: 100, step: 1, unit: "%", sliderValueKind: "continuous",
        applicability: always, orderRole: "strength", ...responsive,
      },
      blur: {
        type: "slider", target: beamTargets.blur, label: "Softness", defaultValue: beamDefaults.blur,
        min: 2, max: 24, step: 1, unit: "px", sliderValueKind: "continuous", editableRange: { hardMin: 2, hardMax: 24 },
        applicability: always, orderRole: "detail", ...responsive,
      },
    },
  },
] as const satisfies readonly ToolcraftControlSectionSchema[];

export const beamSections = [...beamControlSections, sharedDefaultSection, beamHandoffSection];
