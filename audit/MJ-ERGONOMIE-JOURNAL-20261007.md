# Encounter — ergonomie MJ, bibliothèque, journal et annulation

Rapport de validation préparé avant intégration, le 7 octobre 2026. La décision ultérieure d’intégration autorisée figure en fin de document. Travail isolé à partir de la tranche Préparation / Invocations / Assistant déjà livrée. Aucun merge, push sur main ou déploiement. Le serveur et les huit applications de test sont servis uniquement sur la boucle locale, avec salles, clés, invitations et stockages de navigateur propres aux tests. La partie réelle n'a pas été contactée.

## Bases et audit

| Dépôt | Commit de départ |
|---|---|
| Encounter | `7fbcb400836a840cbd78f970e3d5673f42513b4f` |
| RPG-Connect | `c117b408816a0f52a08449d6fa5554d94794c0b4` |
| Kentaro | `39aa5074b99e3762ba469eeb2e7944dc9f64e67f` |
| Samoth | `b5bc76d62300d3fa8920b087cdd298f157c830f8` |
| Brackmard | `07da172f56af105b40fabe9f9fa3350b9d4b84e0` |
| Zephyr | `9ef7b8bf62e9f39bb024458f51c4977fe603955a` |
| Rufus | `090d36a77a4a02214030426b2e1f3191b3464108` |
| Nans | `e5e0a55db2abd2a1aa4ab3f0d13966ba1c238be2` |

Les huit refs main ont été contrôlées via GitHub avant livraison : elles correspondent encore à ces bases. Les instructions disponibles et les rapports `audit/`, en particulier `PREPARATION-SUMMONS-ASSISTANT-20261007.md`, constituent la base de travail. Aucun AGENTS.md trouvé dans les checkouts. Un autre checkout Encounter contenant des modifications concurrentes a été identifié et laissé intact. Chaque dépôt a son checkout isolé ; RPG-Connect reste sans modification.

La reproduction initiale a confirmé le parcours répétitif Ajouter/popup, l'absence de brouillon à droite et l'absence de sélection déléguée des articles de préparation. Les mécanismes précédents d'annulation étaient distincts : remplacement local de la rencontre et restauration réseau de certaines cibles, sans preuve de restauration globale des coûts des personnages. Ils ne sont plus utilisés comme deux restaurations concurrentes.

## Responsabilités et flux conservés

| Domaine | Autorité / traitement | Rôle de cette tranche |
|---|---|---|
| Participants, camps, phase, round, initiative, tour | Encounter, continuité déjà livrée | Consultation/reprise inchangées ; renforts au round suivant ; corrections différées |
| Dégâts, défenses, PV temporaires, soins, PV maximum, mort/réanimation | `rpg-health-authority.js`, adaptateur MJ et traitements directs | Les panneaux réutilisent ces traitements ; une correction ponctuelle remplace le calcul de défense |
| JdS PJ, concentration, réactions, Contresort, Agathys | Demandes Encounter ; moteurs propres des Companions ; résultats/acquittements | Pas de déplacement des règles vers Encounter ; événements regroupés dans l'action logique |
| Capacités, recharges, économies et compteurs | Instance Encounter pour entités locales ; bridge du Companion pour PJ connectés | Présentation changée, règles conservées ; restauration locale seulement sur delta capturé |
| Invocations | `rpg-summon-authority.js`, tours de participants distincts | Clôture/commande tardive restent contrôlées ; cycle de vie exclu de l'annulation certifiée |
| Transport | `Encounter/rpg-connect-server.js` | Commandes de correction optionnelles ; protocole v1 conservé ; capability `scoped-undo-v1` |
| Ressources partagées | RPG-Connect | Aucune modification nécessaire |
| Journal et décision d'annulation | Encounter | Un coordinateur pour bouton global, journal et demande réseau ; santé finale Encounter |

Les messages de correction utilisent l'état propre du destinataire et les catalogues publics existants. Aucun journal métier complet n'est envoyé aux joueurs et aucun PV réel ennemi n'est ajouté aux nouveaux messages.

## Changements livrés

- Sélection de préparation par clic, toucher et clavier, sans intercepter initiative, Modifier ou Retirer. Une sélection ne reconstruit pas la liste ni le fight. Le libellé Préparation existant est conservé.
- Bibliothèque avec brouillon visible, quantité volontaire, initiative commune/individuelle, compagnon/repaire, retrait, total, Terminer et Annuler. Une validation ajoute une fois ; double sélection accidentelle sans doublon. Les profils uniques déjà présents sont refusés, y compris le compagnon ajouté via son propriétaire.
- Catégories d'organisation (nom/couleur/affectation) indépendantes des rôles techniques ; suppression sans suppression de fiche. Métadonnées additives normalisées, importées/exportées et conservées par l'éditeur et l'assistant.
- Recherche avancée combinée : rôle, catégorie, classe principale explicite, type, CA/PV, FP fractionnaire, boss, favoris et texte ; compteur et réinitialisation. Les données absentes sont distinguées, pas assimilées à zéro. Les classes connues des six modèles sont déclarées explicitement, sans extraction automatique d'un sous-titre multiclassé.
- 36 icônes PNG issues uniquement des quatre archives rattachées : mini, actions, 13 classes et 15 états. RGBA, mini 40 px et autres 96 px, sans __MACOSX. Origines, dimensions et SHA des archives dans `assets/mj/manifest.json`. Couleurs PJ bleu, compagnons vert, adversaires/boss rouge, PNJ alliés jaune ; animations réduites selon la préférence système.
- Icônes d'économie, compteurs d'attaques, états et concentration réelle. Réactions adverses mises en évidence durant un tour allié seulement si elles restent admissibles. Le crayon d'instance garde une cible tactile de 44 px. L'accès à la fiche via la liste est conservé sur mobile.
- Fiche avec défilement global, position de lecture conservée pour la même instance, statistiques compactes, états édités en place avec identifiant/durée conservés, descriptions résumées par SRD 5.1 (2014) ou 5.2.1 (2024). Édition inconnue explicitement signalée ; effets personnalisés conservés.
- Capacités en cartes selon leur économie réelle ; badge Sort vert avec niveau/économie, sans créer une économie séparée. Ressources et budget de boss conservés. Tests & sauvegardes préservés ; compétences avec confirmation Normal/Avantage/Désavantage/Annuler et combinaison avec états/pénalités.
- Panneaux États et Points de vie avec sélection dédiée, multicible, immunités/récapitulatif, pavé numérique, prévisualisation par cible, correction exclusive et révocable de défense. Les PV temporaires ne sont pas cumulés.
- Concentration locale unique, JdS CON obligatoire après dégâts, suivi de ses effets liés ; personnages connectés pilotés par leur Companion. Une concentration n'est pas une action dépensée.
- Journal visible en combat, entrées structurées par action, détails par cible, résultats/défenses/absorption/soins/états/économie/ressources et conséquences, filtres et dernière action. Les annulations restent visibles ; les diagnostics réseau restent dans le cockpit réseau.
- Guide / Méthode à chaque étape de l'assistant, cinq étapes, trois exemples, documentation et disponibilité hors connexion. L'essai fictif ne touche ni joueurs ni fight ; la validation MJ reste volontaire.

## Annulation : garanties et limites effectives

Voir [protocole détaillé](MJ-UNDO-PROTOCOL-20261007.md). Le delta vérifie les valeurs avant restauration ; il ne réapplique jamais une ancienne sauvegarde globale. Révisions croissantes, identifiants stables, acquittements logiques et tombstones locales protègent les reprises et doublons. Les événements différés ne sont acquittés qu'après traitement.

Vérification → restauration locale préparée → correction Encounter → correction finale acquittée. Un destinataire absent laisse l'opération en attente. La réussite synchronisée exige les confirmations finales ; un refus avant validation globale conserve Encounter et compense les deltas locaux préparés. Serveur ou Companion non compatible : refus avant toute transaction.

**Vérifié positivement** : dégâts locaux/multicibles, santé connectée, soin natif Second souffle et sa ressource, absorption des PV temporaires, concentration après JdS échoué et état lié retiré sur un autre participant, reconnexion du destinataire et rechargement d'Encounter au milieu de la correction.

**Refus sûrs** : ancienne entrée après autre mutation, champ modifié, changement de tour/round, résolution encore en attente, création/retrait d'invocation/participant, attaque/sort originaire d'un Companion sans capture complète des coûts, réaction associée non certifiée, concentration remplacée localement, rupture sans JdS à 0 PV/incapacitation. Une capacité partiellement restaurable n'est pas annoncée annulable. Les familles PV max/réanimation restent fonctionnelles ; leur annulation est explicitement bloquée, comme les mutations d’invocations, jusqu’à certification complète.

La restauration ne couvre pas une progression temporelle indépendante ni le remplacement du combat. Les sauvegardes antérieures n'ont pas d'entrées métier rétroactives et n'obtiennent pas artificiellement une annulation certifiée. Les anciens fichiers d'historique restent lisibles comme trace.

## Validation

| Suite | Résultat |
|---|---|
| `npm test` | 159/159 |
| `npm run test:companions` | 7/7 |
| `npm run test:icons` | 4/4 |
| `audit/e2e.mjs` | 114 contrôles, aucune exception de page |
| `audit/mission-browser.mjs` | 42 contrôles : assistant, préparation, renforts, initiatives, invocations et commandes tardives |
| `audit/architecture-e2e.mjs` | 57 contrôles ; six Companions ; trois combats complets en 4, 3 et 5 rounds |
| `audit/mj-browser.mjs` | 38 contrôles : bibliothèque, catégories, panneaux, journal, annulation, concentration liée, doublons et reprise |
| `audit/mj-panels-browser.mjs` | 12 contrôles : immunité/durée, édition sans mutation, PV temporaires/corrections, compétence annulée et désavantage combiné |
| `audit/mj-touch-browser.mjs` | 6 contrôles : toucher, focus, clavier, filtres ouverts, annulation mobile |
| `audit/mj-offline.mjs` | 4 contrôles : cache, rechargement, guide hors connexion, invariance du fight |
| `audit/health-regression-browser.mjs` | 5 contrôles : Second souffle, Imposition des mains, Soin des blessures, continuité |

Les trois combats utilisent les pages natives des six personnages et le serveur réel isolé : initiatives validées, jets/animations natifs, concentration, Perturbations synaptiques, Agathys à distance/mêlée, attaques d'opportunité, Sentinelle, Contresort réussi/échoué, boss/phases/repaire, éliminations et reconnexions. Les invocations et renforts sont en plus rejoués dans la suite de continuité. Certains jets sont déterministes pour exercer succès/échec ; les moteurs de résolution et les animations restent natifs.

Chromium headless avec WebGL SwiftShader, dimensions 1180 × 820, 1280 × 800 et mobile 390 × 844 ; simulation tactile et clavier. Captures inspectées : fiche, bibliothèque avec filtres, panneau PV et guide. **Safari, GPU matériel, iPad/tablette et téléphone physiques : non testés.** Aucun test bloqué n'est compté validé.

Anomalies corrigées puis rejouées : clic de préparation, boutons masqués par le pied de bibliothèque, débordement de tiroir fermé sur mobile, préchargement hors connexion de deux modules, chemin de dégâts local en concentration, acquittement trop précoce d'événements différés, et effet lié de concentration non regroupé lorsque l'état arrivait après le résultat. Les anciens tests qui attendaient une restauration réseau non certifiée ont été adaptés au refus sûr ; des tests positifs du nouveau coordinateur les complètent.

Les résultats compacts sont archivés dans `MJ-VALIDATION-20261007.json`. Les traces/captures volumineuses restent des preuves locales ignorées par Git, sans données de partie réelle.

Pour reproduire : placer les huit repos comme répertoires frères, installer les dépendances Encounter/Playwright, pointer `CHROMIUM_PATH` vers Chromium. Les scénarios de cette tranche qui interceptent le CDN Three utilisent les fichiers de la dépendance de développement Three 0.186.1, verrouillée dans package-lock.json. Ils ouvrent leurs propres ports et salles de test ; aucun endpoint de partie n'est requis.

## Livraison et fichiers

Branche Encounter : `feature/mj-ergonomie-journal-20261007-delivery`. Branches des six Companions : `feature/mj-ergonomie-journal-20261007-review`. Branches révisables destinées à main, sans merge. Les sept PR en brouillon sont ouvertes. Les erreurs internes temporaires du connecteur GitHub ont été résolues par reprise des opérations après vérification des références. Livraison coordonnée du serveur Encounter et des six modules clients nécessaire. Cache Encounter V4.2 et URL des scripts Companions avancés ; aucune donnée utilisateur effacée. RPG-Connect : aucune modification.

Liste exacte des fichiers ci-dessous. Les sept checkouts locaux sont propres et suivent les branches GitHub publiées, après vérification de l’égalité de leurs arbres et avance rapide. L’indisponibilité temporaire du terminal est résolue ; aucun reset, rollback ni effacement de données n’a été effectué. RPG-Connect reste inchangé. Les répertoires de preuves ignorés, dépendances et archives rattachées ne sont pas une livraison runtime. Le checkout concurrent n'a pas été touché.

Preuves compactes : `audit/MJ-VALIDATION-20261007.json` (résultats, scénarios et trois combats).

### Encounter

- `README.md`
- `app.js`
- `assets/mj/actions/action.png`
- `assets/mj/actions/action_bonus.png`
- `assets/mj/actions/concentration.png`
- `assets/mj/actions/reaction.png`
- `assets/mj/classes/artificier.png`
- `assets/mj/classes/barbare.png`
- `assets/mj/classes/barde.png`
- `assets/mj/classes/clerc.png`
- `assets/mj/classes/druide.png`
- `assets/mj/classes/ensorceleur.png`
- `assets/mj/classes/guerrier.png`
- `assets/mj/classes/magicien.png`
- `assets/mj/classes/moine.png`
- `assets/mj/classes/occultiste.png`
- `assets/mj/classes/paladin.png`
- `assets/mj/classes/rodeur.png`
- `assets/mj/classes/roublard.png`
- `assets/mj/manifest.json`
- `assets/mj/mini/action_bonus_mini.png`
- `assets/mj/mini/action_mini.png`
- `assets/mj/mini/concentration_mini.png`
- `assets/mj/mini/reaction_mini.png`
- `assets/mj/states/A_terre.png`
- `assets/mj/states/Agrippe.png`
- `assets/mj/states/Assourdi.png`
- `assets/mj/states/Aveugle.png`
- `assets/mj/states/Charme.png`
- `assets/mj/states/Effraye.png`
- `assets/mj/states/Empoisonne.png`
- `assets/mj/states/Entrave.png`
- `assets/mj/states/Epuise.png`
- `assets/mj/states/Etourdi.png`
- `assets/mj/states/Incapacite.png`
- `assets/mj/states/Inconscient.png`
- `assets/mj/states/Invisible.png`
- `assets/mj/states/Paralyse.png`
- `assets/mj/states/Petrifie.png`
- `assistant-method.html`
- `assistant-method.js`
- `audit/ASSISTANT-GUIDE-METHODE.md`
- `audit/MJ-ERGONOMIE-JOURNAL-20261007.md`
- `audit/MJ-UNDO-PROTOCOL-20261007.md`
- `audit/MJ-VALIDATION-20261007.json`
- `audit/architecture-e2e.mjs`
- `audit/e2e.mjs`
- `audit/mission-browser.mjs`
- `audit/mj-browser.mjs`
- `audit/mj-offline.mjs`
- `audit/mj-panels-browser.mjs`
- `audit/mj-touch-browser.mjs`
- `audit/staging-manifest.json`
- `builtins.js`
- `index.html`
- `mj-conditions.js`
- `mj-ergonomics.css`
- `mj-icons.js`
- `mj-journal-model.js`
- `mj-journal.js`
- `mj-library-journal.test.js`
- `mj-library-model.js`
- `mj-library-ui.js`
- `mj-local-concentration.js`
- `mj-panels.js`
- `package.json`
- `package-lock.json`
- `rpg-connect-mj.js`
- `rpg-connect-mj.test.js`
- `rpg-connect-server.js`
- `rpg-effective-damage.test.js`
- `rpg-save-authority.js`
- `service-worker.js`

### Kentaro

- `MJ-UNDO-20261007.md`
- `companion-api.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-concentration.js`
- `rpg-connect-client.js`
- `rpg-effective-damage.js`
- `rpg-health.js`
- `rpg-player-saves.js`
- `rpg-triggered-effects.js`
- `rpg-undo.js`

### Samoth

- `MJ-UNDO-20261007.md`
- `companion-api.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-concentration.js`
- `rpg-connect-client.js`
- `rpg-effective-damage.js`
- `rpg-health.js`
- `rpg-player-saves.js`
- `rpg-triggered-effects.js`
- `rpg-undo.js`

### Brackmard

- `MJ-UNDO-20261007.md`
- `companion-api.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-concentration.js`
- `rpg-connect-client.js`
- `rpg-effective-damage.js`
- `rpg-health.js`
- `rpg-player-saves.js`
- `rpg-triggered-effects.js`
- `rpg-undo.js`

### Zephyr

- `MJ-UNDO-20261007.md`
- `companion-api.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-concentration.js`
- `rpg-connect-client.js`
- `rpg-effective-damage.js`
- `rpg-health.js`
- `rpg-player-saves.js`
- `rpg-triggered-effects.js`
- `rpg-undo.js`

### Rufus

- `MJ-UNDO-20261007.md`
- `companion-api.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-concentration.js`
- `rpg-connect-client.js`
- `rpg-effective-damage.js`
- `rpg-health.js`
- `rpg-player-saves.js`
- `rpg-triggered-effects.js`
- `rpg-undo.js`

### Nans

- `MJ-UNDO-20261007.md`
- `companion-api.js`
- `index.html`
- `mj-journal-model.js`
- `rpg-concentration.js`
- `rpg-connect-client.js`
- `rpg-effective-damage.js`
- `rpg-health.js`
- `rpg-player-saves.js`
- `rpg-triggered-effects.js`
- `rpg-undo.js`


Les branches de revue sont créées directement sur les commits validés. Deux branches initiales `feature/mj-ergonomie-journal-20261007` (Encounter et Kentaro), restées sur les commits de départ après l’erreur GitHub d’avancement de référence, ne constituent pas la livraison.

### Publication vérifiée

- Encounter : commit de revue `190c0167f15133cdcc6d82e077f43d00ed75f2b5`
- Kentaro : commit de revue `b2987c56b5d86698f6c36475c3e3093fa3f409ce`
- Samoth : commit de revue `74378cd3afe6f1ccdb6714717ec31056a42cb50e`
- Brackmard : commit de revue `8db601711f51e0372d750ff503b48e6731167e9b`
- Zephyr : commit de revue `6d3ee6e67622fd94292731ef47e140e339fe24cf`
- Rufus : commit de revue `1a8cc3ecfe3aa24d80d2a377e45aa2ca7d83c63e`
- Nans : commit de revue `7d0515e9d17e2294c1b9a0b441e4c897992d2e0c`

Encounter contient ensuite un commit de compte rendu uniquement, sur sa branche `feature/mj-ergonomie-journal-20261007-delivery`. Son code et ses scénarios restent identiques à ceux testés. Les branches `-review` restent accessibles ; la branche Encounter `-delivery` porte le compte rendu final exact. Aucun main avancé.

### PR en brouillon ouvertes

- [Encounter #9](https://github.com/bryantoualy-del/Encounter/pull/9)
- [Kentaro #6](https://github.com/bryantoualy-del/Kentaro/pull/6)
- [Samoth #6](https://github.com/bryantoualy-del/Samoth/pull/6)
- [Brackmard #4](https://github.com/bryantoualy-del/Brackmard/pull/4)
- [Zephyr #5](https://github.com/bryantoualy-del/Zephyr/pull/5)
- [Rufus #13](https://github.com/bryantoualy-del/Rufus/pull/13)
- [Nans #4](https://github.com/bryantoualy-del/Nans/pull/4)

## Vérification avant intégration sur main

Le contrôle GitHub initial utilisait encore le manifest historique multicible : modules de santé/réaction absents dans les six clones CI. Le manifest est maintenant fixé sur les six commits de livraison testés. Les ressources Three du navigateur sont une dépendance npm figée, sans dossier manuel extérieur. Ces corrections concernent les tests et leur reproductibilité, sans modification des règles de combat.

## Intégration autorisée sur main — 7 octobre 2026

Après l’instruction explicite du propriétaire, CI GitHub verte sur `98436459dd985c84c2d34e1fe511abddbd80218a` ([exécution validée](https://github.com/bryantoualy-del/Encounter/actions/runs/37646770098)) et nouveau replay local : 159 tests unitaires, 7 Companions, 4 icônes et 114 contrôles navigateur, sans erreurs. Les six PR Companions ont été mergées, puis Encounter #9. Les arbres intégrés sont identiques aux arbres de revue validés. RPG-Connect reste inchangé ; les sept checkouts livrés sont propres et synchronisés sur main.

- Kentaro : merge `32e7c9436ab900481bf4bb812c759ccfcfabdabd` (PR #6).
- Samoth : merge `186d1ef8583a483ab206b0713c45591ac8642436` (PR #6).
- Brackmard : merge `d73747718b14a0742f7d1b797caf554f4720e8ed` (PR #4).
- Zephyr : merge `8f4bf9aad03528b58eba81437d51f7e7a050756b` (PR #5).
- Rufus : merge `8b497355b2dd9f11bb07e29bcb83c55d2b17085d` (PR #13).
- Nans : merge `7781b3d63b18a13cdf56a7ba884ee80fb97dbfc9` (PR #4).
- Encounter : merge `f98c9c01d7c57a3c59259d6001e8c05c98ce8062` (PR #9).

La publication GitHub Pages d’Encounter sur le merge a réussi. Ce dernier ajout au rapport est uniquement documentaire. Aucun reset ou effacement des données de partie ; aucune commande envoyée à la partie en cours. Les limites d’annulation et de contrôle Safari/matériel décrites plus haut restent applicables.
