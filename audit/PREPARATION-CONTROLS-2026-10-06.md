# Preparation controls — 6 October 2026

Reproduced: edit an initiative field, then immediately click Retirer. The field change handler rebuilt the participant list during focus loss, before the pressed button received its click. Nothing was removed. A fresh click with no pending initiative change worked, which initially hid the bug.

The handler now persists the initiative and refreshes the initiative ribbon and preview without replacing the participant rows. Structural changes and explicit sorting still perform the full render. No character rules or combat lock checks change. Cache and script versions are advanced.

Browser regression: removal after initiative edit; preservation of other participants; Undo restores the removed instance and edited initiative; touch removal on another row; initiative persistence; first-click instance editing. Six checks pass. The separate duplicate-target Chromium scenario checks multi-target save resolution, death, stable labels, undo and a single-target attack popup.
