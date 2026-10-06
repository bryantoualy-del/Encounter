# Multi-target UI — 6 October 2026

## Behavior

The same presentation module is installed on the six Companions. Metadata binds it only to existing multi-target abilities: Kentaro Synaptic Static; Samoth Binding Ice, Ice Vortex, Ice Storm, Cone of Cold and staff powers; Brack Forge Breath; Nans War Crash and Howl; Zephyr Conquering Presence and Fear. Rufus has no new ability or panel: only the common picker is available when multi-target mode is requested.

A modal picker opens directly from the ability card, outside hidden combat tabs. It uses Encounter's existing target catalog, including stable duplicate-name labels and portraits. Selection uses the existing RPGConnect API; it does not generate damage or consume resources.

Kentaro's manual counters become readonly online. Requests capture an immutable target list; each authoritative save result updates that target, the failure counter, shared damage roll and progress summary. Completed display is cleared when selecting the next action, while the recent event history remains persisted. Offline manual values are restored, including after reload. Offline rules and calculations are unchanged.

Pending network actions remain pending across disconnect/reload. A second cast of that ability is guarded; disconnected pending actions cannot silently use the multi-target offline calculations. Existing STATE_SYNC and command transport are reused. Results are deduplicated by action/target identity. Undo cancels the matching action display; a fresh combat clears stale progress. No transport, spell formula, character resource, action economy, Encounter damage authority or main combat UI code was changed.

## Validation

- `npm test`: 27 pass, including 5 presentation regression tests.
- `npm run test:companions`: 7 pass.
- `npm run test:icons`: 4 pass.
- Existing Chromium E2E: 93 checks, no page errors.
- Duplicate-target Chromium regression: 12 checks, including native Samoth undo and correct mono-target attack popup.
- New Kentaro Chromium scenario: 22 checks. Offline counters 4/2; three selections directly from spells; one shared INT DD16 request; first Ogre dies; first failure appears immediately; disconnect blocks another slot; reload, reconnect and confirmed STATE_SYNC; second Ogre succeeds; third target fails; only one request/slot/action; original 4/2 restored offline.
- Native multi-target Chromium scenarios: Samoth spell Vortex (9), Samoth staff Vortex (9), Brack Forge Breath (8), Nans Crash (8), Nans Howl (8), Zephyr Presence (8), Zephyr Fear (8). Two identically named targets, independent failed/successful saves and visible authoritative summaries. Touch-enabled tablet contexts plus 390px phone layout checks. Samoth returns to mono-target without a stale panel.
- 185 browser checkpoints across these runs. No uncaught page errors in successful runs.

The fixtures run the actual server and native Companion interfaces in isolated Chromium contexts. Temporary synthetic adversaries are browser-only; character and bestiary repositories are unchanged. Physical Safari/iPad remains a user check. Concurrent screenshot attempts exceeded the initial 8s capture timeout; screenshot capture was given 30s. The reconnect harness now waits for the new STATE_SYNC and MJ online roster before resolving the remaining saves, rather than treating the persisted UI as proof of completed reconnection.

## Published Companion versions

The exact commit and tree identifiers are recorded in `audit/staging-manifest.json`. Each published tree is compared to its tested local tree. Publication uses expected-head leases and fast-forward updates. No branch is force-pushed.
