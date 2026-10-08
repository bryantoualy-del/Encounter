# Encounter — Finitions MJ du 8 octobre 2026

## Modifications livrées

- Bibliothèque : grille adaptée à la largeur, portraits et statistiques lisibles, contrôles tactiles de 44 px, recherche/filtres visibles. Composition élargie (430 px sur grand écran), quantités et initiatives conservées, récapitulatif et validation accessibles dans le pied du panneau.
- Initiative : emplacement de portrait commun de 52 px pour PJ connectés ou locaux, alliés, adversaires, boss et invocations. Cadrage object-fit: cover, remplacement si image absente, couleurs de faction et indicateurs Action/Bonus/Réaction conservés.
- Opportunité : fenêtre présentant l’adversaire et les six compagnons, leur disponibilité, sélection explicite du MJ puis envoi uniquement aux compagnons cochés. Aucun calcul fictif de distance. Revalidation au moment de l’envoi ; identifiant propre à chaque destinataire lié à une même opportunité. Le Companion choisit les options natives ; l’arbitrage et les dégâts restent dans Encounter.
- Décisions : composant sombre/doré unique, portraits/contextes, boutons explicites, priorité aux réactions bloquantes, puis sauvegardes/attaques et fin de tour. Fermer ou Échap conserve les demandes dans la file ; compteur pour les reprendre. Les demandes MJ et les autorités existantes persistent les décisions après rechargement. Réservation avant autorisation, aucune dépense sur refus, protection contre doubles validations.

## Flux harmonisés

Touché/Raté, sauvegardes, autorisations de réactions (dont Esquive instinctive, Bouclier, Ailes protectrices, Riposte/Sentinelle), Style Protection avec les quatre conditions à vérifier, fin de tour, décisions multi-cibles d’Animation d’objets et Mur prismatique, morsure de Kentaro, taille inconnue du Châtiment occulte, portée de riposte d’Ombre d’égarement, Revivifier, reset combat, correction d’initiative, actualisation d’une fiche liée au combat et contrôle de concentration.

Les informations sans choix restent des notifications/HUD. Les fenêtres sources sont présentées par le composant commun sans remplacer leurs règles ni leurs handlers.

## Tests réellement exécutés

| Suite | Résultat |
|---|---|
| npm test | 248/248 |
| npm run test:companions | 7/7 |
| npm run test:icons | 4/4 |
| Navigateur ergonomie MJ | 30/30, aucune erreur JavaScript |
| Navigateur automatismes Samoth | 19/19, aucune erreur JavaScript |
| Navigateur pouvoirs Kentaro | 40/40, aucune erreur JavaScript |
| Parcours navigateur CI des six compagnons | 115/115, aucune erreur JavaScript |

Écrans testés dans Chromium : 1920×1080, 1366×768, 1180×820 (format iPad paysage), 900×700. Contrôles de dimensions et captures inspectées. Ce sont des viewports simulés, pas des essais matériels Safari/iPad.

Le parcours MJ couvre création Gobelins/Kobolds, quantités, initiatives communes/individuelles, portraits Brack/Gobelin/Kobold, choix des destinataires d’opportunité, acceptation/refus/pass, réaction consommée, Touché/Raté, Protection autorisée/refusée, Esquive instinctive, sauvegarde, fin de tour autorisée/refusée et reconnexions du Companion/Encounter avec demande en attente. Les contrôles de rejeu confirment une seule attribution de réaction et une seule application des dégâts.

Les suites Samoth/Kentaro exercent les capacités réellement publiées (Hâte, Bouclier, Ailes protectrices, Animation d’objets, Invisibilité supérieure ; Châtiment occulte, Sceau, malédiction, sorts, anneau, Lazarus, morsure, spectre, concentration, opportunité et rejeux). Le parcours CI exerce aussi les attaques/manœuvres Brack, les sauvegardes Zéphyr/Nans/Rufus, les multi-cibles, R/I/V, PV temporaires, annulation atomique et cinq rounds.

## Architecture et concurrence

Seul Encounter est modifié. Aucun changement des règles des six compagnons ni du transport RPG-Connect. Les autorités de combat, ressources locales, auras, effets, concentration, soins, sauvegardes et annulation atomique existants sont conservés. Samoth n’a pas d’adaptateur natif d’opportunité dans la version auditée : il apparaît indisponible, aucune capacité inventée.

Base Encounter : `839752ec07109cdcb7bb74a5870de0e75bba5816`. Les sept références du transport/compagnons sont dans staging-manifest.json, mises à jour vers les derniers main testés (l’ancien manifest CI pointait avant les nouvelles capacités). Vérification répétée des huit main : inchangés avant publication. Branche dédiée ; arbre créé sur l’arbre distant original, avec uniquement les fichiers explicitement listés ; aucun push forcé.

## Fichiers modifiés

- app.js
- index.html
- mj-connected-feedback.js
- mj-panels.js
- package.json
- rpg-connect-mj.js
- rpg-connect-mj.test.js
- rpg-kentaro-authority.js
- rpg-reaction-authority.js
- rpg-samoth-authority.js
- rpg-save-authority.js
- rpg-zephyr-authority.js
- service-worker.js
- mj-decisions.js
- mj-decisions.test.js
- mj-finishes.css
- mj-portraits.js
- audit/mj-finishes-browser.mjs
- audit/e2e.mjs
- audit/samoth-automatismes-browser.mjs
- audit/staging-manifest.json
- audit/MJ-FINISHES-20261008.md
- audit/MJ-PAGES-404-20261008.md

Preuves : mj-finishes-evidence/{ergonomics,samoth,kentaro,ci-browser}.json.

## Limites

- Tests connectés réalisés sur serveur WebSocket local isolé avec les six interfaces natives ; pas de session de production réelle.
- Le parcours ergonomie/Samoth isole le rendu des dés ; Kentaro et le parcours CI utilisent le rendu natif.
- La portée et la visibilité restent une décision du MJ.
- Les confirmations administratives hors combat et l’assistant autonome de monstres ne sont pas refondus.
- Les sites publics renvoient actuellement 404 GitHub Pages. Voir MJ-PAGES-404-20261008.md ; ne pas confondre intégration du code et disponibilité des sites.
