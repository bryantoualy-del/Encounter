# Duplicate target labels — 6 October 2026

Reproduced in Chromium 153 with Samoth connected through the real isolated WebSocket server: two Ogre des ruines targets had #1/#2 in Samoth, but no numbers in the Encounter save dialog or table. IDs and damage routing remained distinct.

A shared display label now identifies the same participant in preparation, table, initiative, details, save and hit dialogs, result summaries and the Companion target catalog. Defeated participants stay in the numbering group, so #2 does not become #1 when the first target dies. IDs, character rules and damage formulas are unchanged. The service worker cache and script versions were advanced.

The browser regression also reproduced a separate issue: Samoth's native Undo button bypassed CompanionAPI and emitted no undo:performed event, so Encounter did not roll back the multi-target action. The button now calls CompanionAPI.undo, with its original standalone fallback. A bridge regression checks the actual button event.

Validation: 22 protocol/MJ/multi-target tests, 7 Companion tests, 4 icon tests; 93 existing browser E2E checks; 12 dedicated Chromium checks. All pass, without uncaught page errors. The dedicated scenario casts native Vortex on identical-name enemies, resolves them independently, kills #1, checks that #2 stays numbered on both sides, clicks native Undo and verifies restoration, then checks an attack popup aimed at #2.

Numbering uses roster order and includes defeated participants; removing an instance or rebuilding the roster can renumber remaining instances. This changes display labels only, never target IDs.
