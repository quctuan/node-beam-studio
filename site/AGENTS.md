# Unified Node Motion site

Production domain: https://nodeanimation.vercel.app/.
User explicitly requested one shared menu with two tabs: Node beam; Node motion.
Maintain both tabs and same-origin assets/downloads when publishing future changes. Preserve tab state and browser Back/Forward. Beam child uses root query embedded=beam, motion lives under /motion/.

Build/deploy owner: this folder. Repository src/ and server/ contain beam source; ../motion/ contains motion source. Publishing either original app alone to nodeanimation would overwrite the shared menu and is not an acceptable update.

Current website release2.1.2 reuses the exact prior production beam frontend and preset function (beam-api-original). Do not substitute a newly bundled API without proving public read equality and compatible preset behavior. Do not write production presets as a QA step. The original API uses the existing project Blob environment. Keep credentials out of public builds/source ZIPs.

Build: npm run build:site from repository root. Deploy: use the root Vercel Build Output configuration; bump site/package.json version for a new public release. Each release saves an immutable snapshot. Check deployment.json hashes, preset API equality, tab rendering and state retention, motion Annotation/Back and MD downloads. The unsuccessful2.0.0 API build was superseded by2.0.1.

Visual refresh2.1.0: image-only Fiora mark, centered floating navigation per AccessGrid; Node motion chrome uses a blue-neutral palette informed by MindCloud. refresh-motion-ui.py applies only integration-copy changes before generating the runnable source archive. Preserve node geometry and established motion values.

User camera requirement (2026-10-24): each activation of Node motion resets its camera to Fit after frame/layout readiness. Preserve graph/node state across tabs, but do not preserve an off-content camera when opening Node motion.

Repository packaging: generated site/dist/, site/motion-source/, root dist/ and .vercel/ are ignored. Do not rely on files outside this repository. Local preview uses site/serve.mjs and never writes production presets.

Release2.1.5 / motion1.4.2: Figma5605:73974 governs node states. Neutral2px#E4E4E7, hover#D4D4D8, click-selected#1188FF, locked dashed#D4D4D8/no drag/connect. Connection alone never selects node. Compatible cable target adds blue border +180ms elevation; cleanup restores underlying state. M02 MD/JSON/native Figma board5518:29088 updated; preserve9 existing notes. Generator toolbar appears on hover/selection/target/lock; empty text input shows placeholder.

Release2.1.6 / motion1.4.3: node target feedback is separate M19 MD/spec/native annotation (10notes total). M02 does not contain node elevation. Click-on border#1188FF switches synchronously at pointerdown and beats hover specificity; no border-color transition. Target shadow180ms persists on stable target without per-frame class resets.
