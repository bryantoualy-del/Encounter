# Fiabilisation après test MJ — rapport de travail

État : branche dédiée `feature/mj-session-reliability`, livraison en cours de vérification. Aucun changement de main. Les huit références de départ figurent dans `main-baseline.json`.

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

**Kentaro.** Le sceau d'Éclipse exige les touches Solinar et Sélhane sur la même cible. Il ne faut pas lui inventer un JdS supplémentaire. Le rider de Solinar contre les types éligibles (CON DD15) et celui de Sélhane (SAG DD15) sont des effets séparés, envoyés à Encounter par le moteur natif. Aucune CA adverse n'est requise côté Kentaro.

**Samoth.** Le dragon avait déjà un descripteur et une réconciliation connectée : ce pipeline est réutilisé. Ses dégâts de Déchirement sont maintenant une composante perforante propre, sans réemploi d'une ancienne composante de sort. Son tour réinitialise ses compteurs, jamais la réaction de Samoth. L'undo de ses PV et de son élimination inclut l'état canonique, les tombstones, l'initiative et le miroir natif. Le Spectre est vérifié également.

**Tentation du Grand Saccageur.** La définition native impose SAG +0, DD13 Dormant/DD15 Éveillé après un effet du Cor qui blesse. Fracas transporte une propriété mécanique explicite ; Encounter déclenche un seul JdS après des dégâts effectifs, puis une demande durable en cas d'échec. Refuser produit 2d6 psychiques appliqués par Encounter sans réaction. Céder crée une obligation visible, synchronisée et annulable ; le MJ désigne la créature la plus proche et confirme déplacement/attaque. Le projet ne contient ni distances canoniques ni coût explicite d'une attaque forcée : ils ne sont pas inventés. Appel des ancêtres ne fournit pas de pipeline de dégâts périodiques ni de valeurs complètes dans le code actuel ; son éventuel déclenchement de Tentation ne peut pas être automatisé à partir du seul nom du pouvoir.

## Vérification

Les scripts reproductibles sont dans `audit/`. Les scénarios utilisent le serveur WebSocket réel et Chromium avec les moteurs natifs. Les dés 3D sont conservés et leurs animations sont réellement fermées par le scénario. Les bonus circonstanciels ±100 servent uniquement à rendre les branches succès/échec reproductibles dans les fixtures.

Les preuves déjà obtenues couvrent : sauvegarde vide/préparée, Sauvegarder sous, modèle figé, reload, fermeture/réouverture avec profil navigateur persistant, lancement d'une préparation sauvegardée, sauvegarde active, backups et restauration, JSON ancien/actuel/incompatible ; Groupe à six, partage sélectif et messages ; AdO et cinq manœuvres Brack, Instruction critique/Sournoise et undo ; Rufus défense, replays et reprise ; dragon et Spectre avec restitution après élimination ; combat de dix rounds avec 69 attaques natives, dragon, mort d'une cible, JdS multicible, slot ennemi et reload pendant le combat.

Les contrôles tactiles/viewport couvrent 1280×800, 1180×820, 820×1180 et 390×844. Il s'agit d'une émulation Chromium, pas d'une validation sur un iPad physique/Safari.

Les résultats finaux et la liste exhaustive des fichiers seront ajoutés après la dernière passe. Les scénarios de Contresort/slots et la reprise d'undo après reload restent en cours de revalidation à ce checkpoint.
