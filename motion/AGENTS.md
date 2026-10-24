# Fiora node motion handoff rule

For every new or changed motion/interaction requested by the designer:

1. Current user-approved annotation scope is ONLY six effects: M01 Connection draw/Disconnect; M02 Target connector/inward ring/particles; M03 Landing impact/split sweep; M07 Finishing border; M08 Image reveal; M12 Wire Disconnect/Insert. Preserve these IDs; do not add annotations outside this scope unless the user changes it.
2. Update motion-spec.json, DEVELOPER-HANDOFF.md, the website annotation panel, and native Figma annotations plus existing handoff board 5518:29088 in file WAU03VCjRzoii657s3A0b5. Do not create redundant product screens.
3. Define trigger, entry/exit/cleanup, duration/delay/repeat, easing, keyframes/formulas, colors/sizes/opacity, coordinate units, reduced motion, code file/function/selector and preview steps. Clearly separate implemented behavior, reference-only studies and production integration requirements.
4. Ship runnable source with MD/spec downloads. Build uses an allowlist; exclude credentials, .vercel, private reference assets, Magnific source bundles, Git, snapshots and nested dist.
5. Bump version, verify extracted ZIP can build and SHA256 manifest matches, publish to the existing authorized prototype URL, then verify production downloads and live interactions. Retain version snapshot.

Current approved baseline: v1.4.0. Fullscreen infinite canvas; blue beam #1188FF/#8FC7FF; blank white loading node; live target one inward ring1300ms/max8dots. Legacy automatic Connect spark is a separate reference sample, not the current live-drag spec. Keep published docs aligned with actual code.

Latest user scope: preserve the original six notes; three wire requirements are separate additional notes M16 success fill, M17 soft routing, M18 node-body drop/invalid retract. Do not merge them into old notes.

User change2026-10-24: M19 is a separate tenth annotation and separate MD for node target blue border/elevation. Do not merge it into M02. Click-on border must switch synchronously on pointerdown (0ms), selected overrides hover. Target class must persist while same target is held; do not remove/readd each RAF as geometry reads restart the shadow transition.
