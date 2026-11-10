# Encounter V1.3 — avancement

## Lot 1/4 : résultats de jets et capacités ennemies

Branche : `feat/encounter-v13-lot1-results-20261109` (base `main`, commit initial `e0a25174`).

### Audit de reprise
- PR ouvertes avant travaux : #5, #13, #15 (aucune modifiée).
- Chaîne de rendu : `app.js` définit `showActionPopup` à plusieurs reprises ; `table.js` la remplace et impose une fermeture automatique après cinq secondes. `index.html` expose `#actionPopup`. Moteur de dés 3D distinct : `assistant-dice-engine.js`.
- Mode Préparation, ratio Initiative/Cible et zoom préservés ; aucune modification du moteur de dés ni des mutations PV.
- Scripts de test existants : `npm test`, `npm run test:mj`, `npm run test:lot4`.

### Changements
- Nouveau module de présentation `encounter-v13-results.js` chargé après tous les scripts existants.
- Résultat centré, en haut, dimensionné pour paysage ; chiffres agrandis ; fermeture volontaire dédiée ; file FIFO des résultats successifs.
- Les dégâts annoncés ne sont pas assimilés à des PV réellement retirés. La carte rappelle la nécessité de vérifier l'application sans modifier l'autorité santé.
- Style séparé `encounter-v13-results.css`. Aucun changement de règles, dés, Mode Libre, Mode Préparation ou synchronisation.

### Stabilisation complémentaire
- Cache PWA versionné et nouveaux fichiers JS/CSS ajoutés à la liste des ressources hors ligne.
- Ancien pseudo-élément « Cliquer pour fermer » neutralisé.
- Tests unitaires ajoutés dans `encounter-v13-results.test.js`, accessibles par `npm run test:v13` : dégâts annoncés, soins, états, file FIFO, persistance et textes des jets complexes.

### Vérification et limites
- Inspection statique de la hiérarchie des scripts, des anciens temporisateurs et des fichiers PWA ; nouveaux tests écrits mais non exécutés.
- **Tests et compilation non exécutés** : le connecteur GitHub permet la lecture/écriture de fichiers mais pas l'exécution du projet ; le clonage réseau depuis l'environnement d'exécution a échoué (résolution DNS).
- **Recette navigateur Samsung S7 FE paysage non réalisée**. Vérifier manuellement jets simples, avantage/désavantage, critique, sauvegarde, soins, dégâts mixtes, états, résultats successifs, fermeture, non-débordement, Mode Libre et Préparation avant fusion.
- Lot 2 non commencé. Aucune fusion ni aucun déploiement.

## Lot 2/4 — Actions ennemies sans ciblage, autorité des Companions

Branche : `feat/encounter-v13-lot2-free-enemy-actions-20261109` ; départ : `main` au commit `062fbb8b`.

### Reprise
- Le Lot 1 et le correctif V1.3.1 sont fusionnés (PR #28 et #29). Fenêtres persistantes et file FIFO préservées.
- Le parcours ciblé existant `app.js : useAbility → startTargeting → resolveTargetSelection` pouvait résoudre automatiquement un jet contre CA/JdS, modifier les PV et appliquer des effets. Ce chemin reste réservé au fonctionnement antérieur/Guidé.
- Les wrappers `mj-journal.js` et `mj-spell-slots.js` assurent les transactions, les corrections et les emplacements de sorts. Le moteur de dés reste inchangé.

### Mode Libre
- `encounter-v13-free-actions.js` intervient **seulement sur les capacités des adversaires en Table libre**. Aucune sélection de cible n'est demandée pour les attaques physiques, magiques, sauvegardes, zones, multiattaques, soins ou recharges.
- L'interface affiche D20 brut + bonus/pénalité, total, composantes de dégâts **potentiels**, DD et effets/états proposés. Ni touche/raté contre la CA ni réussite/échec d'un JdS de joueur ne sont déterminés. Le MJ annonce le résultat et les joueurs utilisent eux-mêmes leurs Companions.
- Dépenses d'économie de tour, réactions, charges légendaires, recharges et emplacements de sorts conservées **côté adversaire**. La multiattaque déroule plusieurs jets pour une seule action.
- La fenêtre persistante du Lot 1 reçoit une présentation structurée sans étiquette mensongère « TOUCHÉ/RATÉ ». Le journal conserve le détail et les corrections/annulations MJ restent possibles.
- Mode Guidé, autres personnages et outils de gestion manuelle conservés.

### RPG Connect : audit des frontières d'autorité
- `rpg-connect-mj.js` : `tableMode()` filtre les messages entrants d'action et seuls l'initiative/fin de tour sont traités ; `send()` limite les commandes sortantes en Table libre et `stateSyncPayload()` transmet la projection tactique.
- Le parcours ajouté ne crée **aucune** requête de dégâts, soins, état ou sauvegarde de joueur ; il n'appelle pas `applyDamageDirect`, `applyHealDirect`, `resolveTargetSelection` ni `command()`.
- Les éventuelles commandes de correction explicitement manuelles et leur autorisation préexistante sont distinctes d'un jet ennemi.
- Contrats WebSocket inchangés ; dépôts RPG Connect / Brackmard / Kobe / autres Companions inchangés.

### Tests, limites et livraison
- Tests ciblés : attaques simples, JdS direct/zone, multiattaque, soins et états conditionnels, recharges, emplacements épuisés, non-modification des Companions et maintien du mode Guidé.
- Test unitaire de popup pour résultat indicatif et contrôle de cache PWA/ressource hors ligne. `npm run test:v13` inclut les tests du Lot 1 et du Lot 2.
- Validation locale du module isolé : **8/8 tests passés** (Node). Suite complète, E2E WebSocket, CI et recette tactile Samsung S7 FE paysage restent à confirmer.
- Aucun changement de protocole, aucune fusion ni aucun déploiement. Lot 3 non commencé.

### Recette approfondie (PR #30, en cours)
- GitHub Actions du commit initial `c2b9e043` : job `test` vert (tests unitaires, Lot 1+2, contrôle PWA, passerelles Companions et icônes) et workflow RPG Connect V5 Chromium/WebKit vert.
- Audit du code : correction du nom du dialogue légendaire `legendaryDiallog → legendaryDialog` et précision pour les dégâts à moitié sur réussite de sauvegarde.
- Ajout de tests de consommation légendaire et de refus si économie déjà dépensée.
- Ajout d'une véritable recette Playwright `audit/v13-lot2-browser.mjs` avec moteurs Chromium/WebKit, interaction réelle avec les boutons, rendu paysage 1280 × 800, captures d'écran et preuves JSON, rejouée automatiquement sur chaque PR.
- Les vérifications couvrent jet d'attaque physique/magique, multiattaque, sauvegarde de zone, dégâts mixtes, JdS sur touche, soins, recharge, emplacements, zéro mutation des joueurs, résultat persistant, Mode Guidé, Mode Préparation, gestion manuelle des PV ennemis et absence d'erreur JS.
- **Statut non déclaré terminé tant que les nouveaux jobs Playwright et les régressions globales ne sont pas tous verts.** Une recette physique sur Samsung S7 FE ne peut pas être réalisée par GitHub Actions et doit être explicitement distinguée de son émulation tactile.

### Corrections constatées en CI de recette
- Nouvelle épreuve de l'économie de tour : une attaque ne peut pas être relancée après consommation manuelle de l'Action si aucun début d'Attaque supplémentaire n'est enregistré. Corrigé, test unitaire vert.
- Première exécution Playwright Chromium/WebKit : lancement de Trait de feu, absence de ciblage et de mutation du joueur, total visible et économie de tour corrects. **Défaut de cadrage identifié** : la popup x=640 sur 1280 px, débordement de 20 px à droite.
- Cause : `mj-presentation.css` applique `#actionPopup.action-popup.show {transform:translateY(0)!important}`, plus spécifique que l'ancienne règle du Lot 1. Règle prioritaire explicite ajoutée pour garantir le centrage horizontal en affichage persistant ; cache PWA incrémenté.
- Les scénarios de navigateur seront rejoués après cette correction, le statut n'est pas encore accepté.

- Ajustement de la recette statique après changement de version PWA : le test de cache doit rechercher la nouvelle clé `encounter-v13-lot2-layout-20261109`, pas l'ancienne.

### Contrôle connecté ajouté
- Première recette navigateur spécifique du Lot 2 : Chromium et WebKit **verts** (tout le parcours Mode Libre/Guidé/Préparation, captures et JSON disponibles via GitHub Actions).
- Extension de la même recette au vrai serveur WebSocket `RPG-Connect` avec une application Brackmard réellement connectée : comparer les PV/états/ressources avant et après Trait de feu, la projection côté MJ et toutes les commandes WebSocket sortantes. Le test bloque toute émission de commande de mutation consécutive au jet ennemi.
- La validation complète reste soumise à l'exécution de cette nouvelle extension sur les deux moteurs, et à la conclusion des suites de régression.

## Recette Lot 2/4 — validation automatisée finale (9 novembre 2026)

**Statut : recette automatisée terminée, réussie.** Le Lot 2 ne présente plus de test automatisé bloquant.

### Preuves exécutées sur `f5cdc7d1542b3a25a104cefb59314bb39c89ba4a`
- [Encounter CI — run #42710355286](https://github.com/bryantoualy-del/Encounter/actions/runs/42710355286) : **success**, y compris la suite E2E guidée générale, Brackmard et Rufus.
- [RPG Connect V5 — run #42710355280](https://github.com/bryantoualy-del/Encounter/actions/runs/42710355280) : **success** sur Chromium et WebKit.
- **Node :** 348 tests principaux, 18 tests V1.3, 7 tests de mise en page/PWA, 7 tests des passerelles Companions, 4 tests d'icônes, tous verts.
- **Navigateur :** 50 contrôles Playwright réussis sur Chromium et 50 sur WebKit, émulation tactile paysage 1280 × 800. Captures et preuves JSON dans les artifacts `v13-lot2-*`.
- **RPG Connect réel :** Encounter + serveur WebSocket canonique + Brackmard réel. Le jet ennemi ne change ni ses PV, ni ses états, ni ses ressources ; aucun message `command` de modification d'état n'est émis.
- **Cas vérifiés :** attaque physique et magique, dégâts typés mixtes, multiattaque, JdS direct/de zone et sur touche, effets potentiels, soins, recharge, emplacement épuisé, consommation des actions, popups persistantes, centrage, Mode Guidé, Mode Préparation et gestion manuelle des ennemis.
- **Défauts corrigés pendant la recette :** action consommée relançable en mode Libre, mauvais identifiant du dialogue légendaire, priorité CSS de centrage, invalidation PWA et tests de version de cache.

### Réserve matérielle et politique de livraison
Les tests tactiles sont des émulations Chromium et WebKit et **ne remplacent pas une recette sur le Samsung S7 FE physique**. Aucun test manuel de l'appareil physique n'a été revendiqué. La compilation n'a pas de script `build` distinct ; `npm ci`, les tests et le chargement des pages en navigateur ont été validés en CI.

**Aucune fusion, aucun déploiement, aucun démarrage du Lot 3.** La PR #30 reste en brouillon pour décision ultérieure. Le présent ajout à la documentation ne modifie pas le code applicatif ni les scénarios testés.

## Lot 3/4 — Simplification des commandes des adversaires (branche dédiée)

Branche : `feat/encounter-v13-lot3-enemy-controls-20261109` ; base `main` `0cb9040c`.

### Reprise et sécurité
- Lots 1 et 2 fusionnés par PR #28, #29 et #30 ; `main` avant travaux : workflow [Encounter CI #42712862763](https://github.com/bryantoualy-del/Encounter/actions/runs/42712862763) **success**.
- PR ouvertes préexistantes : #5, #13, #15, aucune modifiée.
- Les moteurs `rollCharacter`, `rollSkill`, `characterChecks`, `MJPanels.open`, `applyDamageDirect`, `applyHealDirect` et `addConditionMany` sont réutilisés. Aucun doublon de logique métier.

### Réalisation
- **Table Libre + adversaire sélectionné uniquement** : barre tactile à trois boutons **Dégâts & Soins**, **États**, **Tests**. Les commandes historiques restent disponibles en Mode Guidé et pour les autres participants.
- **Dégâts & Soins** : un seul accès au panneau Points de vie existant et à ses modes Dégâts, Soins et PV temporaires, sélections multiples, types et corrections.
- **États** : grille 3×5 fondée sur les **15 entrées inchangées de `CONDITIONS`** et sur `conditionIcon`/icônes déjà disponibles. L'état choisi et les états déjà appliqués sont visuellement signalés ; les réglages de source, durée, DD, JS et application manuelle sont conservés. Le sélecteur historique reste en Mode Guidé.
- **Tests** : section dédiée réutilisant le HTML de `characterChecks` (six caractéristiques, leurs JS, concentration et jusqu'à dix-huit compétences selon le profil). Aucune nouvelle règle de dés.
- **Fiche** : les tests sont déplacés en Mode Libre adversaire sans suppression des données ; quatre sections **Défenses structurées & sens**, **Traits**, **Sources**, **Notes MJ** restent visibles et éditables via l'accès historique à la fiche.
- CSS isolé pour paysage 1280×800, version du cache PWA révisée, aucun fichier des Companions ou de RPG Connect modifié.

### Recette
- Avant modification : CI `main` réussie, incluant les tests Unitaires, V1.3, la passerelle Companions et les navigateurs.
- Sur la branche : `npm test`, `npm run test:v13`, `node --test audit/encounter-ux-layout.test.cjs` et suites de régression via CI ; nouvelle recette Playwright `audit/v13-lot3-browser.mjs` (Chromium + WebKit) : trois commandes, grille exactement 15, 3×5 sans débordement, icônes, sélection et état actif, dégâts/soins, tests de caractéristiques/compétences/JS et Mode Guidé conservé.
- Les résultats de CI de la branche seront précisés après exécution. Le dépôt ne comporte pas de commande de compilation autonome ; installation npm et chargement navigateur contrôlés.
- **Aucune fusion, aucun déploiement, aucun Lot 4.**

### Stabilisation tactile
- Le sous-menu **Tests** est maintenant rendu dans un panneau défilable séparé de l’accordéon « Fiche », avec un bouton explicite de retour, pour conserver la lisibilité et éviter les conflits de défilement sur Samsung S7 FE paysage.
- Les résultats des tests et les défauts résiduels seront renseignés après la recette Chromium/WebKit complète.

### Recette automatisée finale du Lot 3 — validée

**Code applicatif testé : `d26ba080c3feb76dd15acc819f33e8982fccce16`.**

- [Encounter CI #42719540516](https://github.com/bryantoualy-del/Encounter/actions/runs/42719540516) : **SUCCESS**. Tests Node : **348** principaux, **18** V1.3, **8** de mise en page/PWA, **7** passerelles Companions et **4** icônes, soit **385/385 réussis**.
- Recette Playwright tactile paysage 1280 × 800 : **36/36 vérifications Chromium et 36/36 WebKit**, avec capture et fichier JSON de preuves. Trois commandes, sections Fiche, six tests de caractéristiques, six JS, dix-huit compétences, concentration, menu normal/avantage/désavantage, dommages/soins manuels, 15 icônes, grille 3×5 sans débordement, application d'état avec source, retour au Mode Guidé.
- Tests navigateur du **Lot 2** sur Chromium/WebKit : **SUCCESS**.
- Suites navigateur guidées **Brackmard, Rufus et E2E multi-Companions** : **SUCCESS**.
- [RPG Connect V5 #42719540529](https://github.com/bryantoualy-del/Encounter/actions/runs/42719540529) : **SUCCESS** sur Chromium et WebKit.
- Un clic sur une compétence affiche **normalement** le dialogue natif de choix Normal / Avantage / Désavantage : la recette le confirme et sélectionne explicitement Normal. Les popups de résultats persistants sont fermés volontairement entre les actions.
- Les fichiers sont livrés avec version de cache PWA dédiée ; aucune nouvelle mécanique de jet ou état ajoutée.

**Limite** : tests Chromium et WebKit avec émulation tactile, pas de manipulation directe sur le Samsung S7 FE physique. Aucun script de compilation/bundling dédié au dépôt : `npm ci`, contrôles de chargement des pages, tests Node et navigateurs exécutés dans GitHub Actions.

**Statut : Lot 3 prêt à être revu, PR #31 maintenue en brouillon. Aucun merge, aucun déploiement, Lot 4 non commencé.**


## Lot 4/4 — Actions légendaires, arrondi maison, recette globale (10 novembre 2026)

**Branche de livraison :** `feat/encounter-v13-lot4-legendary-rounding-20261110` depuis `main` `5f0177ae1d32f3cea38de4d816c677a65c39677f`. Les Lots 1, 2 et 3 ont été fusionnés précédemment. Les PR #5, #13, #15, préexistantes, ne sont pas touchées.

### Référentiel des modifications

1. **Actions légendaires** : panneau tactile compact sous les statistiques d'un boss ennemi en Mode Libre, avec deux compteurs distincts : actions restantes (±1) et maximum (±1). Le maximum corrigé est une propriété d'instance `legendaryMaxOverride`, conservée par la normalisation et la persistance existantes. Modification immédiate avec journal et `mutate` natifs ; plafonds 0–99 et restant toujours borné par le maximum. Aucun changement du modèle de la bibliothèque ; aucune remise à zéro sur changement d'onglet ou rechargement. La recharge **normale au début du tour du boss** reste intacte. Les modes et les Companions ne reçoivent aucune nouvelle commande.
2. **Convention maison** : en Mode Libre **pour les adversaires uniquement**, une résistance seule arrondit **au supérieur** : 25 / 2 = 12,5, donc 13 PV. L'implémentation centrale `EncounterV13Lot4.halfUp` est utilisée par le résolveur existant, composante typée par composante typée. Les immunités restent prioritaires ; résistance + vulnérabilité s'annulent ; la vulnérabilité seule double le montant. Une correction manuelle MJ `resistance` utilise le même arrondi sans appliquer deux fois la résistance. Les autres modes, notamment Guidé, ainsi que les Companions, conservent leur convention préexistante `Math.floor`. La réduction lors d'un JS réussi (moitié des dégâts) reste inchangée, car il s'agit d'une mécanique distincte.
3. **Pas de refonte** : module et feuille CSS dédiés `encounter-v13-lot4.js/css` chargés après les modules existants, versionnés dans le cache PWA. Aucune modification du moteur d'Annuler/Rétablir.

### Plan de tests et réception

- Régression des Lots 1–3 par l'intégralité de la CI existante (`npm test`, V1.3, contrôles UX/PWA, passerelles Companions, icônes, suites navigateur Guidé/Brack/Rufus et Playwright Lot 2 et Lot 3).
- Nouvelle recette `audit/v13-lot4-browser.mjs` sous Chromium et WebKit, touch paysage 1280 × 800 : modifications du restant et du maximum, plafonds, isolation entre instances, persistance après onglets/rechargement, disponibilité des actions légendaires, cas 25→13 / 23→12, immunité, vulnérabilité, annulation résistance + vulnérabilité, correction manuelle, dégâts mixtes, non-régression du mode Guidé, non-régression des personnages, débordements et erreurs navigateur.
- Vérification de la compatibilité WebSocket via la CI et les recettes précédentes ; aucun protocole, contrat ni autorité Companion n'est modifié.
- Avant travaux : `main` a un CI post-fusion Lot 3 [#42762041182](https://github.com/bryantoualy-del/Encounter/actions/runs/42762041182) **failure** uniquement sur le job navigateur Brackmard, avec timeout `page.screenshot` après des assertions métier réussies ; résultat à surveiller séparément de la nouvelle fonctionnalité.
- Le dépôt est une application statique : pas de script `build` distinct ; `npm ci`, analyse des scripts, tests et chargement Playwright font office de validation technique. Le Samsung S7 FE physique doit encore être testé par le MJ (tactile et lisibilité réelle en paysage).
- Aucun changement à Annuler/Rétablir. **Ne pas fusionner ni déployer avant validation fonctionnelle du MJ.**

**Statut des tests du Lot 4 : à compléter après les exécutions GitHub Actions.**
