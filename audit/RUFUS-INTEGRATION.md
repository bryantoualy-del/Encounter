# Rufus — intégration du 9 octobre 2026

## Base et périmètre

Audit et modifications depuis `main` : Rufus `c0481435c46da0b8e3e9580a4cb65f8501a89616`, Encounter `eae46a1a5f7bfa401757a5d6bf5379fd953d53d1`, RPG Connect `6b06193d09d0f06914dc9b0bd61bf30e659f761d`. La tranche Brack du 9 octobre est conservée. Les autres Companions ont été lus et testés à leurs dernières révisions, sans modification : Kentaro `db7e722`, Samoth `ba4fd7f`, Brackmard `7c67b41`, Zephyr `909e90f`, Nans `273ece5`.

Les branches de livraison reposent sur ces commits réels ; les arbres GitHub reprennent tous les fichiers du parent et remplacent uniquement les chemins listés ci-dessous. Les têtes `main` sont revérifiées avant fusion. Aucun force-push sur main.

## Ce qui était local ou incomplet

| Capacité | État audité | Résultat |
|---|---|---|
| Image miroir | Consommation native de deux charges, sans défense Encounter | Trois doubles dans un état structuré ; redirection, CA 13, destruction et durée |
| Invisibilité | Ressource et concentration locales, bénéficiaire implicite | Choix de Rufus ou d’un allié ; état réel, perception, rupture et concentration partagée |
| Vision | Saisie libre et avantage/critique globaux | ID Encounter verrouillé ; avantage et 17–20 contre cette cible ; révélation MJ contrôlée |
| Œil du Destin | Bouton local « agonie » | Éligibilité MJ, ou seuil explicitement configuré ; indicateur sans PV ; une attaque par round |
| Ombre | Absorption manuelle et bonus surtout local | Offre après élimination appliquée ; retrait après annulation ; +1d8 natif sur attaque/JdS |
| Chanceux | Dé supplémentaire et choix locaux | Choix sauvegardé, révision de la même attaque avant décision ; JdS connectés enrichis |
| Frappes autoguidées | Jet et réduction du dé déjà natifs, total non révisé côté MJ | Proposition après raté, même transaction et consommation seulement sur touche finale |
| Collier | Inventaire équipé sans export ; modèle Encounter statique | Profil dynamique de l’objet réel ; la résistance statique cède au profil connecté |
| Blessure | Référence à `spec` et `context` non définis ; bus générique présent | Attaque de sort complète, cible réelle, raté/touche/critique, dégâts sous autorité Encounter |
| Ruse / téléportation | Économie et événements locaux | Intention partagée, désengagement temporaire, portée native et journal MJ |

## Règles et garanties

- Rufus garde ses jets, coûts, FX du Linceul, Sournoise, lames et Ombre, ruban, HUD, dés 3D et fonctionnement autonome.
- Image miroir intervient avant `applyDamageDirect`, donc avant Esquive instinctive. Seuils 6/8/11, doubles CA 10 + DEX (+3), naturel 1 raté, destruction idempotente même après disparition du dernier double. Pas de nouveaux participants. Attaques sans jet, attaques de sauvegarde, aveuglement et perception autorisée ignorent les doubles conformément au contexte.
- Invisibilité ordinaire suit le bénéficiaire réel ; son attaque ou lancement de sort rompt l’effet. Le sort du lanceur ne rompt pas l’invisibilité de l’allié. La concentration utilise le système partagé existant.
- Vision autorise un seul ID de cible, avec un instantané d’éligibilité dans l’attaque. Le MJ valide portée et information pertinente révélée ; aucune fiche secrète ni PV n’est envoyée. Le désavantage natif du contrecoup SAG atteint les JdS hostiles.
- Agonie : aucun seuil inventé. Validation MJ par défaut ; une table peut renseigner `encounter.rufusAgonyThresholdPercent`. Mort, cible différente, Linceul non éveillé et limitation par round retirent l’avantage.
- Ombre vérifie le résultat officiel de dégâts et l’attribution à Rufus. Une annonce de dégâts, un ennemi déjà mort ou une élimination annulée ne suffit pas. Le souvenir ne se cumule pas ; son utilisation est unique.
- `attack:revise` conserve `attackId` et `actionId`, stocke un `revisionId` et les deux résultats de Chanceux. ACK, reprises et reçus persistants utilisent le bus existant. Les pénalités Encounter restent appliquées une seule fois. La fenêtre MJ reste la même ; une révision tardive est refusée.
- Annulation certifiée via le Journal MJ et `undo:prepare/commit/finalize`. Restitution des ressources, suppression des demandes encore en attente et tombstones contre les replays. Les expirations sont journalisées ; les modifications ultérieures incompatibles continuent à interdire une restauration dangereuse.
- Aucun calcul local de R/I/V ou division de dégâts déjà résolus. Le collier exact est `Collier de résistance nécrotique`, quantité positive et équipé. Encounter applique les défenses puis les PV temporaires et PV.
- Le bouton manuel d’Esquive instinctive renvoie au choix de réaction automatique, sans seconde consommation ni seconde réduction.

## Préservation

Les mécanismes existants d’Esquive instinctive, Esquive totale DEX, opportunité Dague/Hexen, Sournoise propre/réaction, Lame du Feu Caché CON 16, Dague CON 13, Motif SAG 15 multicible, Jugement différé, CA du Linceul 14/16/17, soins, tours, concentration, reconnexion et annulation sont conservés. Les cinq autres Companions n’ont aucun fichier modifié.

## Fichiers modifiés

| Dépôt | Fichiers |
|---|---|
| Rufus | `companion-v3.js`, `index.html`, `rpg-player-saves.js`, `rpg-resources.js`, `rpg-undo.js`, nouveau `rpg-rufus-combat.js` |
| Encounter | `app.js`, `index.html`, `mj-journal.js`, `package.json`, `rpg-combat-effects.js`, `rpg-connect-mj.js`, `service-worker.js`, nouveaux `rpg-rufus-authority.js` et `rpg-rufus-authority.test.js`, `.github/workflows/ci.yml`, `audit/staging-manifest.json`, nouveau `audit/rufus-browser.mjs`, ce rapport et `audit/RUFUS-VALIDATION.json` |
| RPG Connect | `README.md`, `rpg-resources.js`, nouveau `RUFUS-PROTOCOL.md` |

## Validation exécutée

- `npm test` : **301/301**, dont **21 nouveaux tests** Rufus. Couverture des redirections, exceptions, destruction et rejeu, durée, cible invalide/concentration remplacée, révélation contrôlée, agonie configurable, révisions tardives/idempotentes, pénalités, absorption et expiration de Ruse.
- `npm run test:companions` : **7/7**, six bridges et client WebSocket réel.
- `node audit/rufus-browser.mjs` : **38/38**, Chromium et serveur WebSocket isolé. Les activations et coûts natifs, annulations (effet, élimination et attaque en attente), reconnexions des deux interfaces, choix Chanceux persistant, deux issues de Frappes, Blessure raté/touche/critique et R/I/V + PV temporaires, collier équipé/retiré, Ombre + JdS, contrecoup SAG, Motif multicible, expiration, Ruse, téléportation, hors ligne et tailles iPad/mobile ont réellement été exécutés.
- `node audit/e2e.mjs` : **116/116** vérifications partagées, six Companions, aucune erreur JavaScript.
- `node audit/brack-browser.mjs` : **29/29**, aucune erreur JavaScript ; tranche récente d’aura, défenses, relances et réactions préservée.
- Scripts classiques parsés et `git diff --check` sans erreur.

Les résultats des trois suites navigateur sont regroupés sans jetons ni trames brutes dans `RUFUS-VALIDATION.json`. CI ajoute la suite Rufus et épingle les commits correspondants de Rufus et RPG Connect. Les tests utilisent des fixtures contrôlées pour les dés, l’horloge, les ressources et les cibles ; l’initiative Rufus et la suite partagée utilisent réellement les animations 3D.

## Arbitrages conservés à la table et limites

- Portée, ligne de vue, capacité à ignorer les illusions et perception de l’invisible : validation MJ, en particulier lorsque la portée d’une perception spéciale ne peut pas être déduite sans positions.
- Agonie finale : validation MJ si aucun seuil canonique/configuré.
- Vision : portée et défense pertinente révélée choisies par le MJ. Le contrecoup garde exactement la règle native.
- Blessure : bonus d’attaque de sort explicitement confirmé, puisqu’aucune source fixe n’est définie sur la fiche native.
- Se cacher : intention, jet de Discrétion et perception à valider ; aucun état Caché accordé automatiquement.
- Téléportation : destination et espace libre à confirmer. Encounter n’a pas de système de coordonnées tactiques compatible ; aucune coordonnée inventée.
- Les vérifications iPad/mobile portent sur des tailles Chromium ; aucun appareil iPad/Safari physique n’a été testé. Les animations natives sont conservées, sans certification visuelle exhaustive de chaque FX sur matériel réel.
- La matrice entière de toutes les combinaisons possibles n’est pas déclarée validée ; seuls les parcours effectivement listés dans les preuves le sont.

## Livraison

PR Rufus **#16**, RPG Connect **#4**, et PR Encounter associée. Voir leurs liens de commits et statuts de fusion sur GitHub ; le rapport n’anticipe pas une fusion non réalisée. Déployer Encounter avec Rufus ; aucune modification du serveur de transport n’est nécessaire.
