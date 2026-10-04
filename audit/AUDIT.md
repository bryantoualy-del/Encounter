# Audit de compatibilité — 4 octobre 2026

État initial figé avant toute correction. La cohérence statique ne constitue pas une validation E2E.

| Dépôt | Ref | Commit | Client SHA256 | Serveur SHA256 |
|---|---|---|---|---|
| Brackmard | origin/main | 1b7fd8d52daa9d77e4b0c30c5e7d5f6ab4b0a51a | cc9e25d92d57 | — |
| Brackmard | origin/baseline-2026-10-03-2330 | d603d049d0d21334fbe553ccf1268632d0d153ee | f87fa1af7a30 | — |
| Brackmard | origin/backup-before-rollback-2026-10-04-2243 | 3e9f90f51d197a3e177abda0d8b3ea3e60c2e9b0 | 298d692449c8 | — |
| Encounter | origin/main | 87867998680785c54a0546f95459c39733cf371f | — | aa4f5473ba20 |
| Encounter | origin/baseline-2026-10-03-2330 | 81d84e8ee45c0c4beb3d06224887762871c83340 | — | aa4f5473ba20 |
| Encounter | origin/backup-before-rollback-2026-10-04-2243 | f53f4b014db5725c4af21040896e3584a70f7025 | — | ab0f8a1805c5 |
| Kentaro | origin/main | cdbe8fae1d7e925fc33300dab03a0f70f7c1867b | 339e0ad4f4a0 | — |
| Kentaro | origin/baseline-2026-10-03-2330 | 63d2cb812ac60706a1ef3d941626cd6cd47d03e3 | 6f6451c49e39 | — |
| Kentaro | origin/backup-before-rollback-2026-10-04-2243 | 70b9c98af0f6b932c64650955020c4d0d29204ee | e7f6a4b7bcc5 | — |
| Nans | origin/main | d05dd0273f4b4dc5e3d33d68437005a8434ea419 | cc9e25d92d57 | — |
| Nans | origin/backup-before-rollback-2026-10-04-2243 | 3ccbd17605a352956179c6e4677faa1a954f60b9 | 298d692449c8 | — |
| Pik | origin/main | 4fd9a6cd53d1efc39d4c4a550170aad85c3a9397 | — | — |
| RPG-Connect | origin/main | ba640794c73df8ee2067375e09d73446f378482a | — | — |
| Rufus | origin/main | e515e1d94bb2624fd2cdf9370860c6247e10cf08 | 54017dc7add2 | — |
| Rufus | origin/baseline-2026-10-03-2330 | a623cce525b505f96a60b91e2b14df3506e0a30b | 6e7e612b5a5b | — |
| Rufus | origin/backup-before-rollback-2026-10-04-2243 | 1465cec1f6bf83304627ac085d849865b4c401e5 | bdc3b423cb8e | — |
| Samoth | origin/main | 6494771c4a294fcba70ff0d3b8be7056a19310d5 | cc9e25d92d57 | — |
| Samoth | origin/baseline-2026-10-03-2330 | 075526e479071ff28e7403d458a707ffd62d59a7 | f87fa1af7a30 | — |
| Samoth | origin/backup-before-rollback-2026-10-04-2243 | 254deea46a558eb2508e31c1747d31e877a0516e | 2367af72a920 | — |
| Silas | origin/main | f33fd9fd08db4ccb74eb3c692df308064d313aa3 | — | — |
| Wonq | origin/main | 2da7a9d32510c9f33fb89a1a7c2bf62bd08774a8 | — | — |
| Zephyr | origin/main | a3a35bd61aa239686859007391982e7810d7fa1c | cc9e25d92d57 | — |
| Zephyr | origin/baseline-2026-10-03-2330 | 6de44d13efcf70d6b74dd800b628738a19ec3259 | f87fa1af7a30 | — |
| Zephyr | origin/backup-before-rollback-2026-10-04-2243 | 13fb3885bf46bca9038caaeb9906ed6071630b60 | 298d692449c8 | — |

## Ensembles candidats

- Baseline temporelle : refs baseline-2026-10-03-2330 ; Nans ec66a6b (même minute). Dernier ensemble réputé fonctionnel par l’utilisateur, à vérifier dans Chromium.
- Main figé : baseline + ordre Prépa, ACK initiative, CSS et suppression HUD ; même API locale dans les six compagnons.
- Sauvegarde : clients et serveur différents ; JdS composés, état/concentration et corrections multiples. À utiliser pour comprendre les intentions, sans cherry-pick massif.
- Wonq, Pik, Silas : références seulement ; aucun client RPG Connect local constaté dans ces trois dépôts.

## Constats statiques initiaux

- Le serveur est dans Encounter ; RPG-Connect contient les assets/registre.
- Contrat transport v:1, sans capabilities ni négociation de version applicative.
- CI Encounter clone main des compagnons au lieu de refs figées : résultat non reproductible.
- CI Kentaro exige blade(sun,bonus) alors que le chemin existant a un troisième argument third.
- Baseline JdS : résolution automatique immédiate, sans choix MJ ; ne satisfait pas le scénario demandé.
- Dédoublonnage des dégâts par event.id, pas par transaction attackId : unicité métier à vérifier.
- prepareFight appelle plusieurs opérations UI/binding avant initiative:request ; risque de blocage subsistant.

Aucune correction applicative ni fusion effectuée à ce stade.
