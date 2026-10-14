## Trail split and convergence correction — 2026-10-14

Active change: 62b62325-ab85-4af5-94fe-dabbb507b24b
Request: “Chưa đúng effect rồi, 2 vệt sáng sẽ xuất phát tại điểm giữa của cạnh trái node, toả đi 2 hướng khác nhau, sau đó hội tụ và kết thúc ở điểm giữa cạnh phải node. Vệt sáng mờ dần và biến mất”.
Root cause: The first implementation used two clockwise heads half a perimeter apart. Their origin/direction/lifetime do not express the requested common left midpoint, opposite upper/lower routes, right-midpoint convergence, or disappearance. This is a topology/opacity correction, not a performance complaint.
Plan: Correct the existing Trail value, no additional mode. Derive exact left/right midpoint fractions from each rounded/rectangular/circular perimeter. Two fronts start at the left midpoint, take upper clockwise and lower counterclockwise half-paths, stop together at the right midpoint, fade completely and leave a short empty interval before restart. Smooth spatial tails and one shared opacity/phase feed border and inward light. Remove Trail's persistent colored track so no colored light survives the fade. Preserve all other motion branches.
Timing: Product-owned staged cycle on existing runtime phase; head travel uses phase .04→.76, smooth appearance 0→.06, gentle 25% dimming during travel, terminal fade .72→.94, then dark interval. Existing Speed/Rhythm retime it. These are implementation choices under the explicit request, not measured reference timings. Export phase samples, endpoints/directions/opacity and actual stage times for dev; inspector presents split travel instead of clockwise rotation.
Contract/skills: Reuse this conversation's complete signed workflow, decision/runtime, renderer/performance, controls/layout/schema/component, timeline and acceptance preflight. UI/UX retain native Movement; systematic-debugging is unavailable and the signed local equivalent is the explicit root-cause reproduction above. No external clip as a timing source.
Renderer: Same assessed worker pipeline, sample/kernel bounds, backing, intrinsic node domain and viewport coalescing. Geometry origin adds constant bounded arithmetic. No resources, workload controls, host/runtime modifications or export capabilities added.
Verification tier: Tier 3 later visual/motion fix. Focused midpoint/two-direction/convergence/fade/legacy/native handoff units; real pixel stages Light/Dark, geometry, loop seam, exact standalone JSON and old Orbit; production build/deploy and live preview. No aggregate or measured performance.
Verification: Nine focused Trail/handoff units passed. Six unique directly selected production-browser scenarios passed: precise pixel stages on Light/Dark, every node shape and seam on both themes, native JSON and standalone renderer RGBA parity, and exact accepted Orbit pixels from 1.3.1. Stage probes use actual supported 0.25s arrow increments and alpha-weighted visible color, not unpremultiplied RGB. Orbit comparison waits for the committed phase and uses the real native settings snapshot; a previous unsynchronized read was a test race. Source boundary initially rejected nested inspector serialization; explicit typed DTO/JSX and displaying the complete plain motion record fixed it. Canonical source boundary now has no violations. Final TypeScript/Vite build passed, entry /assets/index-CnUcJDDm.js, worker beam-worker-DMwRu18E.js. Protected retry 1cb899bf-eddd-4b60-8be0-c8e78a4fa0ae stalled over two minutes at load-feature-plan/Node ESM resolution and was terminated; no protected feature receipt claimed. files:check passed. Measured performance was not run. Version 1.4.1 deployed as dpl_9SqjXAbffXkhkoxSNGFU3jExaVPv; anonymous stable alias serves /assets/index-CnUcJDDm.js. Live Trail inspected and left playing on the stable URL; screenshot .toolcraft/browser-artifacts/nodeanimation-trail-converge.jpg. Shared Loading node startup default was preserved, no cloud mutations performed.

## Perimeter Trail movement — 2026-10-14

Active change: c72e0911-2b4c-43ec-9693-6f75a6f26fe7
Request: Add a Movement option from the Magnific node border. Clarification: “Chỉ vệt sáng chạy quanh viền node”.
Task: Later feature, Tier 3; one new movement branch in the existing painter and developer handoff, no renderer replacement or new transport.
Plan: Add Trail to the native Movement segmented control (four compact options). Two separated highlights travel clockwise by uniform perimeter distance with smoothly feathered heads/tails; the shared optical sample feeds border and inward glow. Keep existing Orbit/Breathe/Static output byte-for-byte unchanged. Use existing Speed/Rhythm, geometry, palette/gradient, spread, softness, border width and style. Save/import/cloud presets retain the new canonical motion value. Handoff describes the perimeter algorithm and bundles the identical painter.
Reference: User-supplied Magnific still shows two separate blue-violet edge highlights. Threads clip was opened and shows energized connector wires; the user explicitly excludes connectors. It is not used as a motion/timing source, so no video parity or reference timing claim is made and referenceInputs stays empty. Asset acquisition was unavailable; no guessed video timing. Ego CLI is absent; Codex host-embedded browser owns visual inspection.
Controls/view: Existing panel is primary global property owner; canvas is product pixels only. No spatial scene, new UI chrome, handles, keyframes or duplicated transport. Four labels Orbit/Trail/Breathe/Static fit the existing segmented budget. Static continues to hide timing controls. Trail uses fixed two highlights (each 10% of perimeter), not a new workload count.
Renderer: Existing assessed four-pass worker Canvas2D pipeline, backing dimensions, lifecycle, coalescing and paint invalidation stay unchanged. Same bounded 512 edge samples and <=256 inward kernels; an optional wider feather stroke is clipped inward to node silhouette and does not expand scene bounds. No new resources or providers. Pre-code structural assessment passed (beam-trail.test.ts).
Animation: Existing runtime playback and seamless forward-only phase clock; Trail samples normalized clockwise perimeter rather than center angle. Default full lap follows existing 1.96s cadence, not a timing claim about Magnific. Linear is uniform distance; Ease keeps the existing monotonic sine rhythm.
Checks: Focused Trail profile/seam/arc-distance/legacy Orbit units, handoff exact-source/native JSON; movement/speed/rhythm applicability browser checks, dedicated moving-pixel geometry and JSON/renderer parity; build for live deployment and manual light/dark preview. No aggregate, measured performance, PNG/video export or connector workflow.
Verification: Focused proof passed. Nine Trail/handoff units and one focused schema coverage case passed. Seven unique directly selected production-browser scenarios passed: native Movement/Speed/Rhythm, Trail Light/Dark geometry and loop seam, native JSON import/export with exact standalone renderer RGBA parity, and accepted Orbit pixel-identical to frozen 1.3.1. Initial combined Trail matrix exceeded the unchanged standard 30s budget; split geometry by theme and export into individual cases, all now pass. Final Orbit/Trail-export checks passed (9.9s / 16.4s), after preserving legacy alpha operation order. Final TypeScript/Vite build passed, entry /assets/index-Dv6lgY27.js and worker beam-worker-B-LxVVhD.js. Canonical product source boundary passed, no filesystem or source violations. Manual production preview Light/Dark inspected; native four-option Movement fits. files:check passed. Protected feature retry e0d849a0-1fb9-4b98-8112-d2539a53102b timed out at its fixed 20s load-feature-plan deadline before browser execution; no protected feature receipt claimed. Measured performance was not run. Version 1.4.0 deployed as dpl_2TEmsJQZqU8wgHaHrBuXcavLYc6o; anonymous stable alias verified HTTP 200 and current /assets/index-Dv6lgY27.js. Initial CLI Not authorized was transient; same staged upload succeeded on retry after whoami verified the existing account. Shared API returned 200 and retains the user-updated Loading node default plus archived sets; no cloud mutations performed. Live Light/Dark Trail inspected, final output .toolcraft/browser-artifacts/nodeanimation-trail-light.jpg and nodeanimation-trail-dark.jpg. New Movement is selected in the retained live preview, shared startup defaults are preserved.

## Public preset library — 2026-10-13

Active change: d4a60a22-e945-4e7a-8704-25e2d5f685b4
Request: User explicitly removes keys/admin restrictions, permits all visitors to save named sets, retains Set as default and requests selecting/managing saved settings.
Plan: Replace the authenticated single record with a version-2 shared preset library on the same private Blob path. Migrate the existing version-1 default in memory without losing its settings. Add named save, select/apply, rename, recoverable delete/restore and default publication with no login or key. Use conditional Blob writes and bounded conflict retries so concurrent visitors do not silently discard each other's sets. Preserve canonical settings codec and accepted renderer. Removing authentication is explicitly user-authorized, not inferred.
Controls fit: native text owns the name draft; native actions own save/default/rename/delete. Custom server-backed preset browser uses public Buttons and ScrollFade: sourceCollection/collectionActions edit runtime-authored record fields/cardinality rather than load named full settings snapshots from a remote collection; fixed schema select options cannot reflect newly saved remote sets. Selection is runtime-owned at beam.sharedDefault; remote record cache is only query state. Name and selection are excluded from saved effect snapshots. Canvas has no duplicate preset UI.
Visual map: public Button and ScrollFade own interactive chrome/focus; local status text uses muted foreground. Default has a literal label, selection uses public outline variant/aria-pressed, not color alone. No renderer/color/animation changes.
Contract context reused from preceding feature: active AGENTS.md, workflow, control-selection/layout, schema-reference/component-rules, custom-controls/custom-control-visuals, native settings codec and focused acceptance lifecycle.
Verification tier: Tier 2, later feature. Focused migration/concurrency/CRUD/default/error units, UI saved selection/management/new visitor and codec checks, source boundary, deployment build and actual public API/browser inspection. No aggregate or performance run.
Verification: Complete with focused proof. Six migration/public mutation/concurrency/failure unit tests passed; three production-browser preset management/save/fresh-visitor scenarios passed (16.3s); focused schema coverage passed; canonical source boundary has no violations. Final TypeScript/Vite build passed. Protected feature retry a1e15bc3-6776-4c2e-8229-682e28d96884 could not resolve the Node ESM authority; no protected feature pass is claimed. Version 1.3.1 deployed as dpl_5Xh4NPmDm8KJqQLuxyeung7on1Gm; stable alias serves /assets/index-CTWy-4zy.js. Actual anonymous online rename and Set as default writes succeeded, and fresh GET preserves the identical previous effect snapshot. Default is Fiora Light (legacy-default). Both editor themes inspected; final screenshot .toolcraft/browser-artifacts/nodeanimation-public-presets.jpg. NODE_BEAM_ADMIN_KEY removed from production environment. Accepted beam worker remains beam-worker-BrJu9TpR.js.
Storage correction: Initial 1.3.0 writes encountered conditional conflicts without data loss. Final adapter reads head() version ETag before uncached get() body, then performs conditional put(); actual online writes prove the correction. Stored library is v2 array; wire payload is metadata dictionary with canonical settingsJson. Query loading is one-shot, without memoized pending promises. No authentication remains.

## Shared default — 2026-10-13

Active change: 6b572cd2-16a3-4428-9ff6-e9e5ae21c3ef
Request: “thêm tính năng set as default, dể ai truy cập vào link cũng thấy được setting đã lưu”; author confirms “Chỉ anh — có quyền quản trị”.
Task: Later feature, Tier 2; shared persistence and authenticated server commands. This is substantial because a static deployment needs durable storage and write authorization.
Plan: Add a private Vercel Blob record and a same-origin server endpoint with admin sign-in via an HttpOnly session cookie. Compose a small authentication/status surface from public primitives, keep Set as default as a native schema action, and capture/validate settings using the public runtime codec. Apply the shared preset once on opening a link, before user interaction can overwrite it; preserve runtime-owned local persistence without writing browser storage. New default does not interrupt already-open editing sessions. Save captures a fixed snapshot; failed authentication/save leaves the previous published record intact. Guest visitors can edit but cannot publish defaults. No renderer changes.
Built-in fit: actions owns Set as default. text/code cannot own a password because those schema values enter persistence/settings export; public Input password plus public Button owns transient credential entry, separate from runtime values. Existing Developer Handoff custom visualization will host transient admin sign-in/status; server session and published config remain server-owned. No custom button/input chrome.
Visual map: public Input/Button own all form chrome and focus; local status text uses normal foreground and muted text only. No new geometry or accent. Panel remains primary owner; canvas has no auth chrome.
Contracts read: workflow, control-selection, layout, schema-reference, component-rules, setup-export, custom-controls, custom-control-visuals. Exact renderer/native import/export/footer unchanged.
Verification: Complete with focused proof, 2026-10-13. Three unit checks passed (canonical settings capture, native action declaration, server authentication/origin/session expiration/storage failure). Current production build passed. Both directly selected production-browser scenarios passed (9.2s): invalid/valid admin sign-in, no credential in native export, publish/fresh visitor/reload, failed save, sign-out and guest denial. Source boundary passed with no violations; focused schema acceptance coverage passed. Protected feature planner timed out twice at its 20s load deadline; another attempt invalidated package authority while version metadata changed. These failures remain recorded; no protected feature pass or new aggregate receipt is claimed. Version 1.2.0 deployed as dpl_6CFXyVCxhgUNXHhPJxm8MRTrnToa; stable alias verified assets/index-BzxsSiQT.js. Actual live API GET/login/PUT verified, guest PUT returns 401, public read contains no admin key. Native-exported current Light/Dots preset published as revision 3e499771-c3d2-4d99-ab77-1426850f21d1. Online UI inspected and captured in .toolcraft/browser-artifacts/nodeanimation-shared-default.jpg. Private admin key is ignored local .env.nodebeam-admin-key (mode 0600), never snapshot/static content. Private Blob store store_sgqM8hgiq9rhkVLa is linked only to this project production. Accepted worker remains beam-worker-BrJu9TpR.js. No aggregate/performance batch.

## Developer handoff — 2026-10-12

Active change: node-beam-developer-handoff
Change ID: b2af177e-c936-433b-9461-9659543fff5d
Request: hiện tại file json export ra đang gặp các vấn đề trên, hãy fix cho tôi, hoặc có giải cách hiển thị nào trên tool để t nắm rõ được các thông số
Task type: Later product feature; no measured performance or optional media export authority.
Root cause: Settings JSON v3 serializes parameters and transport but does not describe the procedural angular window, sine phase rhythm, hue sway, field composition or inward-light kernels. Developer reproduction therefore requires guessing.
Plan: (1) derive motion/optical specifications from canonical settings and existing phase/hue functions, (2) compile a dependency-free browser adapter against the existing painter, (3) synchronize a schema-owned handoff value for native JSON transfer, (4) show a read-only timing graph and effective parameters in a Developer Handoff section, with native Copy spec/Copy HTML actions, (5) prove actual export bytes, import compatibility and frame pixels against live output, then update the same production URL.
Built-in fit: actions owns clipboard commands. code, curves and sourceCollection were inspected for the read-only visualization; code owns editable strings, curves edits user-authored points and collections own items, whereas this surface shows a derived time-to-angle graph and renderer-effective units. Register a product-specific custom-visualization, not duplicate input controls or runtime chrome. Editor remains the primary property-edit surface; handoff inspection is panel-only.
Visual map: local graph surface uses custom-viz-surface/border; grid uses custom-viz-grid; curve uses custom-viz-line-strong; actual palette swatches use product colors; names use muted-foreground and values foreground. No local buttons/inputs, no accent or primary geometry. Native section header and native actions own all interactive chrome.
Contracts: Existing workflow, runtime boundary, schema, setup/export, renderer and acceptance contracts retained; custom-controls and custom-control-visuals read for the new surface. Skills ui-designer and ux-designer apply to existing-system handoff clarity; prototype-vercel-deploy applies to established hosting authorization.
Focused verification tier: Tier 3 later feature. Units for timing/algorithm/static/schema and exact compiled-source parity; focused browser JSON, clipboard, theme/readable visualization and dependency-free rendered frame parity. Build required for export bundle and deployment. Skip aggregate delivery, benchmarks, PNG/video/GIF modules and unrelated feature matrices.
Verification: Complete (2026-10-13). Four handoff unit checks and the focused schema/acceptance check passed. Three production browser scenarios passed, including exact RGBA parity between native preview and exported renderer, clipboard HTML/spec and legacy settings round-trip. Protected feature run 6e83005e-3f74-4d98-8434-a2de8f1043f8 passed both selected browser checks and source boundaries. Final 1.1.1 build passed; Custom metadata correction covered by units. Production alias serves assets/index-DQXc_wDn.js, deployment dpl_BCwkYJhgv9xg7w9N5p1BZJVj5ZCK. Final live handoff panel and Dots inspected; screenshot: .toolcraft/browser-artifacts/nodeanimation-developer-handoff.jpg. Accepted beam worker remains beam-worker-BrJu9TpR.js. No new aggregate certification claimed.
Risks: Reference samples are explicitly labeled procedural samples; exact behavior is owned by the supplied renderer. Native Settings codec is unchanged, legacy presets remain readable, imported handoff code is never executed by the tool.

## Workspace Dots contrast regression — 2026-10-09

Active change: node-beam-workspace-dots
Change ID: f3f36cc2-81c8-4b9d-a850-769602439d42
Request: Với đang bug, khi chọn workspace là Dots thì Background không hiện dots
Task type: Later focused visual bug fix, no measured performance authority.
Decision: The native pattern inherits editor foreground, which disappears against an independently editable fill. Reuse the public CanvasDotPattern primitive in the typed Infinity preview port only when fill luminance conflicts with editor theme. The runtime retains native fill and pattern ownership; compensation shares native spacing, pan phase and zoom and disappears for Blanc or Background off. No protected runtime, beam painter, presets or JSON codec changes.
Docs/contracts read: workflow.md, decision-contract.md, core/runtime-boundary.md and acceptance-testing.md; component/renderer rules retained from the preceding feature preflight.
Focused checks selected: luminance/color cases; the existing workspace.pattern browser scenario extended with actual workspace pixels for light/dark fill, Blanc, Background off and aligned pan geometry. Production build is required for current-bundle browser proof and Vercel deployment.
Verification: Luminance unit passed. Current production browser workspace.pattern scenario passed with signed evidence reporter and actual light/dark fill pixels, Blanc, Background off, aligned pan and zoom. Local and Vercel production builds passed; files:check passed. The existing live URL was reopened with Background on, #F6F7F8, Infinity on, Dots and dark editor. Screenshot: .toolcraft/browser-artifacts/nodeanimation-workspace-dots.jpg. Deployment: dpl_6SpBVQwAqdKXFGuQqUK98nCh4Xa1. The test:feature wrapper stalled at load-feature-plan for over seven minutes and was stopped; run 3d2bedbf-54fb-4e34-b35f-469cf38b7256 is incomplete and no protected feature receipt is claimed.
Risks: Compensation is an editor-only Infinity preview decoration; finite artboard background keeps native semantics and native workspace dots outside the artboard.

# Node Beam Studio Agent Worklog

## Status

Mode: product

Active change: node-beam-json-footer

## Decision Trail

### Fixed settings footer and image export removal

- Change ID: node-beam-json-footer
- Request: Vậy cho cụm 2 button này xuống bên dưới, fixed position. Bỏ tính năng export PNG đi, ko cần thiết
- Changed owner: Product composition/panel presentation, artifact module selection, product acceptance and preview pipeline metadata.
- Decision: Reuse the same native settingsTransfer control and native Panel sticky footer. A presentation projection of the resolved panel sections places runtime.defaults last with the public actionGroup field; canonical state targets, settings codec, persistence and signed framework files stay unchanged. The explicit user placement overrides the template's usual header placement.
- Result: Import Settings / Export Settings remain fixed at the panel bottom while properties scroll. Image export, its settings, raster renderer port and export-only pipeline are removed. Native version-3 JSON retains the complete effect; presets containing old image-export options still import correctly.
- Focused checks: Three selected product unit checks passed, including canonical acceptance coverage and preview-only pipeline assessment. Both production browser scenarios passed: footer geometry/native JSON/legacy presets and Background/Infinity. The JSON scenario was rerun after correcting its evidence target and passed with the signed evidence reporter. Local production build and Vercel production build passed. files:check passed. No aggregate delivery or measured performance.
- Hosting: Updated the existing renamed project quoctuan161299-3982s-projects/node-animation. Deployment dpl_DtVCbGHhNyV1BdG4uFp5UtMkHJKQ is READY at https://nodeanimation.vercel.app/. The live page was reopened and scrolled: the two buttons stayed at the same bottom position and Image Export is absent. Screenshot: .toolcraft/browser-artifacts/nodeanimation-json-footer.jpg.
- Verification limitation: test:feature reached load-feature-plan but twice exceeded its protected 20000ms Node deadline, including an unsandboxed retry. The deadline and signed framework were preserved. Direct feature browser checks used the current production build and signed runtime-evidence reporter; no new protected feature receipt is claimed.
- Risks: The runtime has no settingsTransfer placement flag, so footer presentation is app-owned and explicitly tested without modifying the signed native control. The focused wrapper limitation above remains a verification-tool issue.

### Rename the hosted domain

- Change ID: node-beam-domain-nodeanimation
- Request: Change the domain name to nodeanimation.
- Changed owner: Vercel project domain settings and the local hosting documentation.
- Result: https://nodeanimation.vercel.app/ is the production alias. Both prompt-squall-4lbx4tk.vercel.app and temporary-prompt-squall-4lbx4tk.vercel.app redirect directly to it with HTTP 308. The temporary alias had to be retargeted first because Vercel rejects redirect chains.
- Focused checks: The new alias opened Node Beam Studio. Navigating to the former production URL ended at nodeanimation.vercel.app with the app rendered. Vercel shows Valid Configuration for all three aliases. Screenshot retained in .toolcraft/browser-artifacts/nodeanimation-domain.jpg. No product behavior changed and no aggregate delivery gate was repeated.

### Restore accepted motion, JSON export and Vercel delivery

- Change ID: node-beam-json-and-vercel
- Request: Restore the previously accepted border movement; finish the editor, include JSON export and deploy it to Vercel.
- Task type: Finish the first product delivery, with a focused settings-transfer addition and authorized hosting.
- User-visible result: Original angular conic-window motion at 1.96 seconds per revolution for speed 1 and default transport. Native Export Settings downloads node-beam-preset.json; native Import Settings restores the editable preset.
- Source/reference checked: Accepted local node-border-beam/synchronized-beam.ts, user reference screenshot, and current Vercel CLI documentation.
- Reference inputs: None. The static screenshot and inspected local source establish the accepted effect.
- Docs/contracts read: workflow.md; core/setup-export.md; schema-reference.md; existing implementation/verification routes from the first delivery.
- Contract rules applied: runtime-shell-required; output-export-required; persistence-policy-explicit; timeline-enabled-behavior; controls-product-coverage.
- View interaction intent: non-spatial, with runtime pan/zoom for the 2D preview.
- Interaction ownership: Native panel actions own preset files; the inspector owns effect parameters and the runtime canvas owns navigation.
- Decision: Reuse the native version-3 settings codec and file actions. JSON is an editable preset, so the native settings action remains separate from PNG/JPG image encoding. Preserve the runtime shell and existing controls.
- Alternatives rejected: An app-specific JSON download handler would duplicate the existing native codec and could lose hidden values. A rotating rainbow head changes the accepted optical field and cadence.
- State/output mapping: Export includes all control values, including hidden custom-gradient values, canvas sizing and native timeline frame/duration. Import restores parameters and pauses at the saved frame. Both preview and raster output use one shared optical field and phase.
- Verification: Protected verify:delivery completed successfully with one worker: 752 tests passed (one unrelated framework fixture skipped), production build, code health and docs passed, and all 26 required browser tests passed. verify:receipt reports current and valid delivery authority. Additional native JSON export/import passed in 3.3 seconds: the downloaded version-3 preset restored every value, canvas setting and timeline setting in a clean browser context. The real native cover export also passed.
- Hosting: The authorized retry on 2026-10-09 completed the production build and Vercel upload. The initially temporary deployment was transferred through the authenticated Vercel browser session into quoctuan161299-3982's projects. The saved project is https://vercel.com/quoctuan161299-3982s-projects/prompt-squall-4lbx4tk and its current production alias is https://nodeanimation.vercel.app/.
- Focused hosting verification: The claimed alias opens Node Beam Studio with Import Settings, Export Settings and native image export. Light and Dark node output were inspected on the live site; screenshots are retained under .toolcraft/browser-artifacts/vercel-live-light.jpg and vercel-live-dark.jpg. No source behavior changed and no aggregate delivery gate was repeated.
- Risks: No measured performance is claimed. Default transport fits the original 12-second hue cycle to 11.76 seconds; the angular rotation remains 1.96 seconds.

### Node Beam Studio

- Change ID: node-beam-studio-first-delivery
- Request: Build a tool for tuning Light/Dark mode, plain or design canvas background, node ratio and shape, movement and speed, colors, inward light spread, gradient border thickness and effect style. Inspect Toolcraft and Prism Flow as references.
- Task type: Fresh standalone product assembly.
- User-visible result: A local Toolcraft editor with a live generating-node composition, inspector controls and shared runtime playback, workspace and export actions.
- Source/reference checked: Toolcraft starter source and MIT license; https://github.com/pixel-point/toolcraft ; https://toolcraft.sh/demos/prism-flow ; prior local node-beam demo from https://libraries.dev/beam . Prism Flow informs editor capabilities rather than supplying its unrelated graphics renderer.
- Reference inputs: None. URLs, inspected source and static screenshots guide product appearance.
- Docs/contracts read: AGENTS.md; workflow.md; core/control-selection.md; core/layout.md; core/setup-export.md; core/timeline-animation.md; schema-reference.md; component-rules.md; acceptance-testing.md. Renderer owner separately reads its performance and technique routes.
- Contract rules applied: runtime-shell-required; canvas-no-app-ui; canvas-surface-preserved; controls-product-coverage; controls-section-inventory-required; interaction-surface-ownership; timeline-mode-choice; layers-enable-only-when-needed; output-export-required; persistence-policy-explicit.
- View interaction intent: non-spatial. A flat 2D node has no model, camera or orientation target.
- Interaction ownership: Panel property edits are global and precise; runtime canvas owns navigation. Canvas property handles would duplicate the inspector operation and clutter the node.
- Decision: Keep the signed Toolcraft runtime and control kit intact, implement one deterministic Canvas2D node painter for both preview and PNG/JPG output, and use runtime workspace/settings/persistence.
- Alternatives rejected: Copying Prism Flow's renderer would not produce the requested node effect. Hand-built controls would duplicate Toolcraft value models. Additional Layers, SVG and video are outside this request.
- State/output mapping: beam.theme and geometry determine node surface and path; beam.gradient/palette determine shared border and inward glow colors; spread/intensity/blur/borderWidth/style modify that shared paint; native timeline determines phase; native Workspace decorates only the editor; Background controls runtime fill and PNG alpha.
- Verification: Tier 4 selected before implementation. Protected verify:delivery now passed with production build and complete functional acceptance. No measured performance execution is authorized or planned.
- Risks: Visual parity is limited by the new painter and editable geometry; no claim of pixel-exact Prism Flow or Libraries.dev source cloning. The cover is captured from real final output.

## Decisions

Use the native Toolcraft shell, state and settings-transfer codec with one deterministic node painter. The decisions below describe the product's current owners and capability scope.

## Renderer

- Decision: One Canvas2D painter with the accepted rotating conic window and nine stationary radial color fields, shared by border and inward light. Perimeter sampling supplies geometry, rather than defining a constant-speed traveling head.
- Reason: The border and inward light share deterministic geometry and phase in the retained preview worker.
- Evidence: Beam renderer and paint modules, current production preview and native JSON round-trip checks. Historical raster proof is retained in the initial delivery entry.

## View Interaction

- Decision: non-spatial.
- Reason: This is a flat node component rather than a three-dimensional scene.
- Evidence: Product readiness declares no orientation targets; pan/zoom remain runtime-owned.

## Interaction Ownership

- Decision: Inspector owns global property edits; canvas owns view navigation.
- Reason: Exact parameter entry and free preview navigation are complementary tasks.
- Evidence: Schema controls and typed product readiness. No duplicate canvas handles.

## Timeline

- Decision: Runtime playback timeline, one forward seamless product cycle.
- Reason: Users need to tune movement and inspect its timing while border and inner glow share one phase.
- Evidence: Animation intent and runtime timeline module. Duration, scrub, pause/resume and seam checks use protected recipes.

## Layers

- Decision: Absent.
- Reason: The user requests one node effect editor and has not requested a layer workflow.
- Evidence: No layers module or selectedLayer targets.

## Controls

- Decision: Built-in selectors and sliders with canonical Gradient for custom stops.
- Reason: The values fit native Toolcraft controls. Light/Dark is the first product section; all geometry/effect values persist across it.
- Evidence: beam-schema.ts and appControlSectionInventory; applicability hides only inapplicable radius, motion settings and custom gradient branches.

## Export

- Decision: Native Settings JSON import/export in a fixed inspector footer; image, SVG and video export are absent.
- Reason: The user explicitly removed PNG export. Settings JSON preserves the editable effect and stays reachable while properties scroll.
- Evidence: The image-export module is removed; exportIntent records the exact primary removal request. The existing runtime settingsTransfer control owns the version-3 codec, file selection, validation and download.

## Performance

- Decision: Plan reachable parameter workload and preview lifecycle; first delivery collects functional evidence only.
- Reason: A fresh product needs complete correctness proof before any complaint-specific measured optimization.
- Evidence: App-specific renderer pipeline and performance assessment written by renderer owner. No authored timing evidence or forged protected receipt.
- Workload: One node within schema width, spread, blur and border limits; fixed palette stop count or canonical gradient stops.
- Lifecycle: Reuse preview backing, repaint on relevant values/timeline, coalesce during navigation, release on teardown.
- Assessment: Renderer owner supplies the canonical compiled pipeline and derived paths.
- Paths: Derived from renderer pipeline and public controls; no measured path authority inferred.

## Evidence

- Source reviewed: src/app/app-schema.ts; src/app/beam-reference.ts; src/app/beam-paint.ts; src/app/beam-renderer.tsx; e2e/beam-settings.spec.ts; e2e/beam-timeline.spec.ts; e2e/beam-cover.spec.ts; README.md.
- Contract applied: runtime-shell-required; controls-product-coverage; timeline-enabled-behavior; output-export-required; persistence-policy-explicit.
- Evidence: Native PNG cover in public/toolcraft/cover.png, reproduced from app-cover-state.json. JSON round-trip and Light/Dark/timeline browser assertions passed against the production preview.

## Verification

Verification tier: Tier 3, later feature edit
Reason: Native footer presentation and removal of the artifact module, raster port and export-only pipeline.
Run: Selected product unit checks, focused production browser scenarios, production build for deployment, and live footer inspection.
Skip: Repeated aggregate delivery, measured performance, optional SVG/video and Layers.

Results: The immutable initial receipt retains its historical 752 unit/contract tests and 26 required browser tests. The latest footer/image-removal change has passed the focused unit checks, production browser behavior and builds recorded in the newest entry. The test:feature planner timeout is recorded separately; no new protected feature receipt or full certification is claimed.

## Risks

- Hosting resolved: The live deployment is retained in the user's renamed node-animation Vercel project and its stable alias was reopened and verified. The official CLI is now signed in and linked to that existing project.
- Risk: The cover has been reproduced through actual native PNG export and inspected at 2048 × 1152. The initial protected delivery receipt has passed and is retained unchanged.
- Risk: Native editor theme and the exported node's Light/Dark appearance are independent settings.
