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
