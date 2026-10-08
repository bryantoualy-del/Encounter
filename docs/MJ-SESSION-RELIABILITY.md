# Fiabilisation après test MJ — rapport de livraison

État : branche dédiée `feature/mj-session-reliability`, implémentation prête à revoir, vérifications locales terminées ; statut CI distant consultable dans la PR. Aucun changement de main. Les huit références de départ figurent dans `main-baseline.json`.

## Audit de main

La suite Encounter initiale passe : 169 tests. Le bus, les ACK, les ledgers de réactions/JdS/soins/invocations et l'undo synchronisé existent déjà. Ils ont été conservés.

| Nature | État constaté | Intervention |
| --- | --- | --- |
| Persistance | Le chargement normalise les anciennes données ; la reprise d'une sauvegarde doit conserver son contexte connecté et ses modèles préparés. | Commit local vérifié, copie de récupération, migration déterministe, modèles figés par préparation, contexte connecté exporté/restauré. |
| Persistance | Les erreurs de stockage ou de parsing peuvent compromettre la récupération. | Erreurs visibles, interdiction d'écraser une sauvegarde illisible, validation avant restauration, reprise d'une restauration interrompue. |
| UX | La composition est locale et temporaire ; filtres et organisation occupent trop d'espace. | Composition persistée, barre compacte, filtres repliés, collections secondaires et modale Encounter. |
| UX | Une primitive d'édition d'instance existe déjà. | Réutilisée ; pas de deuxième éditeur et pas de modification silencieuse de la fiche source. |
| UX | Le wizard crée une contrainte supplémentaire. | Retiré de l'interface ; éditeur libre et analyse de compatibilité conservés. |
| Synchronisation | Les cibles hostiles contiennent la CA, également mise en cache par les clients. | CA retirée du transport hostile et des caches sur les six Companions. La CA des alliés demeure publique dans Groupe. |
| Règle / synchronisation | Le reset natif en fin de tour peut restaurer trop tôt une réaction ; le propriétaire et son invocation ont des tours distincts. | Reset sur le début canonique de participant, token persistant incluant combat/round/participant/révision. Replays sans second reset. |
| Règle / transactions | Les ressources de sorts adverses nécessitent un coût par lancement et non par cible. | Niveau structuré, coût unique par transaction, garde à zéro et restitution par undo. |
| Transactions | Un JdS natif après touche peut partager l’identifiant des dégâts et être rejeté comme collision. | Le ledger accepte le JdS enfant uniquement pour une attaque déjà confirmée, son auteur et sa cible verrouillée ; conserve le snapshot initial, les identifiants de sauvegarde et l’undo commun. |
| Tours | La disparition de la dernière invocation active peut revenir au participant précédent. | Passage au premier participant vivant du round suivant et reset par `processStartTurn`. |
| Règle | Les capacités défensives de Rufus sont natives mais leur déclenchement doit être canonique. | Esquive instinctive dans le ledger de réactions ; Esquive totale sur DEX + `halfOnSuccess`, sans réaction. |
| Dette historique | L'undo refuse les invocations ; des patches parent/enfant peuvent se contredire après plusieurs phases. | Capture du cycle de vie, tombstones et position d'initiative ; correction du propriétaire ; fusion normalisée des patches imbriqués. |

## Architecture préservée

Encounter décide des cibles, du Touché/Raté, des JdS ennemis, des dégâts finaux, des défenses, des PV, des états, des tours et du journal. Les Companions gardent leurs ressources et leurs moteurs natifs. Le bus relaie les événements et leurs ACK ; aucun deuxième moteur d'attaque, de réaction ou de soin n'a été créé.

Les nouveaux helpers ont des responsabilités limitées : `encounter-persistence.js` valide/migre/restaure ; `mj-spell-slots.js` consomme dans la transaction existante ; `rpg-turn-start.js` délègue les resets aux moteurs natifs ; `mj-connected-feedback.js` présente les événements reçus.

## Ce que voit le MJ

- Préparation conservée après reload et fermeture/réouverture du navigateur ; Sauvegarder et Sauvegarder sous restent distincts.
- Recherche compacte, favoris uniques, recherche avancée fermée par défaut et composition avec quantité, initiative, options, total et validation visible.
- Modification de l'instance depuis la rencontre ; fiche source explicitement identifiée.
- Bouton global Réinitialiser retiré ; wizard retiré ; éditeur libre avec champs manquants et compatibilité.
- Bouton Fight cadré, icônes d'économie accessibles, cibles connectées surlignées, rubans rouges/verts/bleus/neutres.
- Journal présentant des noms et actions compréhensibles, bouton Annuler cette action et motif de refus/attente.
- Partage des PV pour une sélection explicite, une ou plusieurs personnes, ou tout le groupe.
- Demande d'AdO depuis la cible ; le Companion choisit et exécute son attaque native.
- Un bouton principal AdO Rufus et ses deux armes ; manœuvres compatibles de Brack sur AdO ; Instruction demeure distincte de Sentinelle/Riposte.

## Sauvegarde et JSON

Schéma courant : `schemaVersion: 1`. Les migrations ajoutent des identifiants déterministes et les propriétés structurées reconnues sans supprimer les extensions inconnues. Les fiches comportant des champs obsolètes/manquants ou des capacités inconnues produisent des avertissements. Les versions futures, identifiants dupliqués, structures invalides ou nombres illisibles produisent des erreurs avant mutation.

Les deux bibliothèques présentes dans le dépôt sont migrables : `monsters.json` (19 fiches) et `bibliotheque-integree.json` (27 fiches). Le détail des 11 avertissements de champs obsolètes est dans `legacy-json-audit.json`. Aucun ancien fichier fourni dans ces bibliothèques n'est déclaré non migrable. Cela ne constitue pas un audit de fichiers personnels absents du dépôt.

Un JSON ne contenant pas les données nécessaires ne peut pas reconstruire une règle : la propriété est conservée et signalée. Une sauvegarde corrompue et sa copie de récupération corrompue bloquent les écritures ; elles ne sont pas remplacées par une rencontre vide.

## Règles natives auditées

**Rufus.** Esquive instinctive : touche confirmée et attaque éligible, Rufus conscient et réaction disponible ; accepter consomme une réaction, passer n'en consomme aucune. Ordre : dégâts bruts → Esquive instinctive, division avec arrondi inférieur → immunité/résistance/vulnérabilité du moteur existant → PV temporaires → PV → conséquences/concentration. Esquive totale : DEX et demi-dégâts en réussite explicites ; réussite zéro, échec moitié. La Sournoise reste limitée par tour et calculée par Rufus.

**Brack.** Précision, Croc-en-jambe, Menace, Poussée et Diversion réutilisent la résolution native PyroMerlin sur AdO. Un critique hors tour n'accorde pas l'attaque bonus du tour propre. Menace utilise l'échéance native du prochain tour de Brack. AdO/Sentinelle protéger/Riposte/Instruction demeurent des déclencheurs distincts.

**Kentaro.** Le sceau d'Éclipse exige les touches Solinar et Sélhane sur la même cible. Il ne faut pas lui inventer un JdS supplémentaire. Le rider de Solinar exige un 20 naturel contre les types éligibles (CON DD15) et celui de Sélhane (SAG DD15) sont des effets séparés, envoyés à Encounter par le moteur natif. Aucune CA adverse n'est requise côté Kentaro.

**Samoth.** Le dragon avait déjà un descripteur et une réconciliation connectée : ce pipeline est réutilisé. Ses dégâts de Déchirement sont maintenant une composante perforante propre, sans réemploi d'une ancienne composante de sort. Son tour réinitialise ses compteurs, jamais la réaction de Samoth. L'undo de ses PV et de son élimination inclut l'état canonique, les tombstones, l'initiative et le miroir natif. Le Spectre est vérifié également.

**Tentation du Grand Saccageur.** La définition native impose SAG +0, DD13 Dormant/DD15 Éveillé après un effet du Cor qui blesse. Fracas transporte une propriété mécanique explicite ; Encounter déclenche un seul JdS après des dégâts effectifs, puis une demande durable en cas d'échec. Refuser produit 2d6 psychiques appliqués par Encounter sans réaction. Céder crée une obligation visible, synchronisée et annulable ; le MJ désigne la créature la plus proche et confirme déplacement/attaque. Le projet ne contient ni distances canoniques ni coût explicite d'une attaque forcée : ils ne sont pas inventés. Appel des ancêtres ne fournit pas de pipeline de dégâts périodiques ni de valeurs complètes dans le code actuel ; son éventuel déclenchement de Tentation ne peut pas être automatisé à partir du seul nom du pouvoir.

## Vérification

**Bilan local : 202 tests automatiques et 395 contrôles navigateur réussis, aucune erreur JavaScript dans les scénarios livrés.**

Les scripts reproductibles sont dans `audit/`. Les scénarios utilisent le serveur WebSocket réel et Chromium avec les moteurs natifs. Les dés 3D sont conservés et leurs animations sont réellement fermées par le scénario. Les bonus circonstanciels ±100 servent uniquement à rendre les branches succès/échec reproductibles dans les fixtures.

Les preuves déjà obtenues couvrent : sauvegarde vide/préparée, Sauvegarder sous, modèle figé, reload, fermeture/réouverture avec profil navigateur persistant, lancement d'une préparation sauvegardée, sauvegarde active, backups et restauration, JSON ancien/actuel/incompatible ; Groupe à six, partage sélectif et messages ; AdO et cinq manœuvres Brack, Instruction critique/Sournoise et undo ; Rufus défense, replays et reprise ; dragon et Spectre avec restitution après élimination ; trois exécutions de dix rounds avec 69, 70 puis 70 attaques natives, dragon, mort d'une cible, JdS multicible, slot ennemi et reload pendant le combat.

| Suite exécutée | Résultat |
| --- | --- |
| Protocole, combat, persistance, transactions | 191/191 |
| Bridges des Companions | 7/7 |
| Icônes des créatures | 4/4 |
| UX MJ, journal, concentration, undo et reload | 38/38 |
| Sauvegardes et profil navigateur fermé/réouvert | 17/17 |
| Rufus : défenses, R/I/V, réaction, reload et undo | 28/28 |
| Tentation et choix durable | 14/14 |
| Emplacements ennemis et Contresort | 9/9 |
| Éclipse, JdS enfants, composants et undo | 21/21 |
| Dragon/Spectre : dégâts, élimination, undo et tours | 13/13 |
| Groupe à six, Instruction, AdO et manœuvres | 63/63 |
| Combat long : 10 rounds, 70 attaques et 10 tours du dragon | 14/14 |
| Tactile/clavier, iPad paysage/portrait et téléphone | 16/16 |
| Reload hors ligne avec service worker | 4/4 |
| Suite E2E CI : six Companions, cinq rounds, repos, états et reprise | 115/115 |
| Suite historique multicible et refus d'undo non certifié | 43/43 |

La suite CI ferme les dés par un tap après leur animation native, attend la Tentation de Nans avant de poursuivre les tours et vérifie les modales et rubans des six Companions.

La suite historique vérifie désormais la confirmation MJ d'un undo natif et le refus d'un undo provenant d'un client de protocole sans capture native. Les refus pendant un JdS en attente sont testés sans restauration partielle. Le reset technique est appelé uniquement par l'API de test.

Les dépendances CI sont fixées dans `audit/staging-manifest.json` aux sept commits distants effectivement testés. Encounter utilise le commit courant de la PR. Les scripts acceptent le Chromium installé par Playwright ou l'exécutable explicite `CHROMIUM_PATH`.

Les contrôles tactiles/viewport couvrent 1280×800, 1180×820, 820×1180 et 390×844. Il s'agit d'une émulation Chromium, pas d'une validation sur un iPad physique/Safari.

Les résultats détaillés figurent dans `verification.json` et la liste exhaustive des fichiers par dépôt dans `modified-files.json`. Les scénarios dédiés vérifient également Éclipse (touche, critique Solinar CON DD15, Sélhane SAG DD15, cible identique/différente, composants natifs, reload des deux côtés et undo), Contresort avec coût des deux casteurs et restitution des deux emplacements, et disparition d'une invocation active en fin d'initiative.

## Limites explicites

- L'undo conserve les garde-fous existants : dernière action complète, même combat/tour/round, aucune dépendance ou correction en attente, snapshots compatibles et captures natives présentes. Une action ancienne ou une économie modifiée après changement de tour est refusée avec un motif, sans restauration partielle.
- Une rupture automatique de concentration à 0 PV reste non annulable lorsque les effets liés ne disposent pas d'une capture complète certifiée. Le scénario de non-régression vérifie le refus explicite. Un JdS de concentration échoué avec ses effets liés dispose, lui, d'une restauration atomique vérifiée.
- Tentation : le choix, le coût, le JdS, les 2d6 psychiques, l'état et l'undo sont automatisés. Distance à la créature la plus proche, trajet et coût d'une attaque forcée ne sont pas définis canoniquement ; ils restent validés par le MJ. Les dégâts périodiques d'Appel des ancêtres ne sont pas suffisamment définis pour être inventés.
- Samoth ne possède pas de définition native d'attaque de mêlée d'opportunité : son interface le signale. Cette tranche ne crée pas d'arme ni d'attaque fictive.
- Les validations de mise en page/tactile sont réalisées sous Chromium aux quatre tailles indiquées ; un essai physique Safari/iPad reste à faire.
- Les migrations ont été exécutées sur les JSON présents dans les dépôts. Les anciens fichiers personnels non fournis ne peuvent pas être déclarés compatibles sans être importés/validés. Les erreurs structurelles et versions futures sont refusées avant toute mutation.

## Rejouer les vérifications

Placer les huit dépôts, tous sur `feature/mj-session-reliability`, dans le même dossier parent. Dans Encounter : installer avec `npm ci`, installer Chromium avec `npx playwright install chromium`, puis définir `CHROMIUM_PATH` vers son exécutable Playwright. Les scénarios démarrent leur serveur HTTP et WebSocket isolé ; aucun serveur de production n'est utilisé. Les lancer successivement afin de conserver les animations 3D sans saturer les contextes WebGL.

Commandes : `npm test`, `npm run test:companions`, `npm run test:icons`, `npm run test:mj`, `npm run test:group`, `npm run test:mj:touch`, `npm run test:mj:offline`, puis les sept commandes `test:session:persistence`, `test:session:defenses`, `test:session:summons`, `test:session:horn`, `test:session:slots`, `test:session:eclipse` et `test:session:long`. La suite historique `node audit/multi-target-browser.mjs` vérifie également multicible, ciblage et primitive technique de reset ; aucun reset n'est exposé dans les contrôles MJ ordinaires.

## Fichiers modifiés par dépôt

### Encounter (47)

- `app.js`
- `audit/combats-e2e.mjs`
- `audit/e2e.mjs`
- `audit/five-round-browser.mjs`
- `audit/group-browser.mjs`
- `audit/mj-browser.mjs`
- `audit/mj-offline.mjs`
- `audit/mj-panels-browser.mjs`
- `audit/mj-touch-browser.mjs`
- `audit/multi-target-browser.mjs`
- `audit/reset-pending-e2e.mjs`
- `audit/session-defenses-browser.mjs`
- `audit/session-eclipse-browser.mjs`
- `audit/session-horn-browser.mjs`
- `audit/session-long-combat.mjs`
- `audit/session-persistence-browser.mjs`
- `audit/session-spell-slots-browser.mjs`
- `audit/session-summon-undo-browser.mjs`
- `audit/staging-manifest.json`
- `docs/MJ-SESSION-RELIABILITY.md`
- `docs/legacy-json-audit.json`
- `docs/main-baseline.json`
- `docs/modified-files.json`
- `docs/verification.json`
- `encounter-persistence.js`
- `fight-continuity.test.js`
- `index.html`
- `mj-connected-feedback.js`
- `mj-ergonomics.css`
- `mj-icons.js`
- `mj-journal-model.js`
- `mj-journal.js`
- `mj-library-journal.test.js`
- `mj-library-ui.js`
- `mj-spell-slots.js`
- `mj-spell-slots.test.js`
- `package.json`
- `rpg-connect-mj.js`
- `rpg-connect-mj.test.js`
- `rpg-monster-spells.test.js`
- `rpg-player-save-authority.js`
- `rpg-player-save-authority.test.js`
- `rpg-save-authority.js`
- `rpg-triggered-effects.test.js`
- `rpg-turn-start.test.js`
- `service-worker.js`
- `session-reliability.test.js`

### RPG-Connect (2)

- `rpg-instruction.js`
- `rpg-turn-start.js`

### Rufus (11)

- `companion-v3.css`
- `companion-v3.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-connect-client.js`
- `rpg-instruction.js`
- `rpg-opportunities.js`
- `rpg-reactions.js`
- `rpg-rufus-defenses.js`
- `rpg-turn-start.js`
- `rpg-undo.js`

### Brackmard (8)

- `index.html`
- `mj-journal-model.js`
- `rpg-connect-client.js`
- `rpg-instruction.js`
- `rpg-opportunities.js`
- `rpg-reactions.js`
- `rpg-turn-start.js`
- `rpg-undo.js`

### Kentaro (8)

- `index.html`
- `mj-journal-model.js`
- `rpg-connect-client.js`
- `rpg-instruction.js`
- `rpg-opportunities.js`
- `rpg-reactions.js`
- `rpg-turn-start.js`
- `rpg-undo.js`

### Samoth (9)

- `companion.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-connect-client.js`
- `rpg-instruction.js`
- `rpg-opportunities.js`
- `rpg-reactions.js`
- `rpg-turn-start.js`
- `rpg-undo.js`

### Zephyr (8)

- `index.html`
- `mj-journal-model.js`
- `rpg-connect-client.js`
- `rpg-instruction.js`
- `rpg-opportunities.js`
- `rpg-reactions.js`
- `rpg-turn-start.js`
- `rpg-undo.js`

### Nans (10)

- `index.html`
- `mj-journal-model.js`
- `rpg-connect-client.js`
- `rpg-horn-effects.js`
- `rpg-instruction.js`
- `rpg-opportunities.js`
- `rpg-reactions.js`
- `rpg-triggered-effects.js`
- `rpg-turn-start.js`
- `rpg-undo.js`

## Livraison coordonnée

| Dépôt | PR |
| --- | --- |
| Encounter | [#10](https://github.com/bryantoualy-del/Encounter/pull/10) |
| RPG-Connect | [#2](https://github.com/bryantoualy-del/RPG-Connect/pull/2) |
| Rufus | [#14](https://github.com/bryantoualy-del/Rufus/pull/14) |
| Brackmard | [#5](https://github.com/bryantoualy-del/Brackmard/pull/5) |
| Kentaro | [#7](https://github.com/bryantoualy-del/Kentaro/pull/7) |
| Samoth | [#7](https://github.com/bryantoualy-del/Samoth/pull/7) |
| Zephyr | [#6](https://github.com/bryantoualy-del/Zephyr/pull/6) |
| Nans | [#5](https://github.com/bryantoualy-del/Nans/pull/5) |

Ces PR sont destinées à être revues ensemble. Aucun merge ou push sur main n'a été effectué.
