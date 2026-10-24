# Node Motion Hub

User-requested integration: one menu, two tabs, https://nodeanimation.vercel.app/.

- `?tab=beam` — Chỉnh node beam (default).
- `?tab=motion` — Các motion với node.
- Browser Back/Forward and reload preserve selected tab. Both same-origin panels retain their state when switching tabs. The motion app has its own Annotation/Back navigation.

Build: `node build.mjs`. Beam frontend is captured byte-for-byte from the existing production deployment; runtime modules are not changed. The existing `/api/shared-default` function is preserved on the original Vercel project; no preset writes are performed for QA.

Motion source is copied by manifest allowlist, rebased to `/motion/`, then built with its individual Markdown and source ZIP downloads. Root shell is outside either app runtime. Deployment includes query route `embedded=beam` to the preserved beam HTML, static assets, motion subtree, and preset function.

Focused verification: both tabs render, beam movement/control/pause, motion wire/canvas, Annotation/Back, state retained on tab switch, browser Back/Forward, direct motion URL/reload, Markdown/ZIP downloads, API public snapshot equality, production SHA256.

## Visual refresh2.1.0

References inspected live: accessgrid.com (centered floating white navigation, subtle border/shadow, blue active action) and mindcloud.co (blue/neutral palette, calm typography and spacing). Existing Fiora SVG mark replaces text branding; tabs are Node beam and Node motion. Motion-only chrome is applied by refresh-motion-ui.py to the integration copy before packaging, leaving the dedicated prototype and beam product runtime stable. Canvas node geometry, beam palette and wire timings remain unchanged. Removed decorative nonfunctional credits/asset controls; added a functional Play demo shortcut. Individual MD files and full runnable source remain available under /motion/.

Focused proof: visual screenshots for canvas/annotation, Play demo, Annotation/Back, body-drop commit, beam state across tab changes, extracted source ZIP build. Production deployment.json validates refreshed logo/CSS, app entries, docs/source and unchanged preset API.

## Camera activation fix2.1.2

Node motion now invokes its existing Fit action after the iframe is ready and visible on every tab activation, including first load, browser navigation and return from Node beam. Pending activation waits are cancelled when switching away. This resets only camera framing; graph/node state is preserved. Focused local check zoomed off-fit, switched away/back and verified autoFit plus all three nodes inside viewport.
