# RPG Connect V5 — livraison coordonnée à valider

**État : brouillon, aucune fusion et aucun déploiement V5.** Les contrôles automatisés locaux passent. La validation visuelle bloquante n’est pas acquise.

## Modifications

- Encounter : sélecteur de session Table Libre/Guidé, paramètres conservés, divulgation explicite PV/CA ennemis, correction du marqueur sans réinitialisation, saisie narrative et journal MJ existant.
- Serveur canonique : filtrage Table Libre, états personnels minimaux, mode avec contrôle de révision, anciens clients refusés en Table Libre, présence du MJ et reprise de session.
- Six Companions : onglet Groupe intégré, ordre mixte décroissant, tour actif allié/ennemi, raccourcis vers les moteurs natifs, contours d’économie sans changement de fond, éditeur personnel, réaction corrigeable dans les deux sens.
- Journal local : événements locaux persistants, chronologie de round/tour connu, dégâts calculés sans supposer leur application, PV temporaires bleus. Les détails personnels ne remontent pas à Encounter.
- Les règles de début de tour utilisent la révision du participant ; une correction visuelle ou un rejeu réseau ne récupère pas une réaction consommée.

## Preuves automatisées locales

| Suite | Résultat |
|---|---:|
| Régressions Encounter (`npm test`) | 348/348 |
| Protocole serveur canonique (`npm test` dans RPG-Connect) | 7/7 |
| Six HTML réels + sept applications avec vrai WebSocket (`npm run test:v5`) | 7/7 |

Les parcours vérifient Riposte de Brack (réaction + dé), Esquive instinctive de Rufus, Bouclier de Samoth (réaction + emplacement et CA temporaire), Protection de Zéphyr, correction libre de réaction, restauration après réouverture, initiatives et tour ennemi, confidentialité des PV/CA ennemis, état simultané des six joueurs et journal manuel du MJ.

Les tests DOM ne prouvent ni la lisibilité iPad ni le rendu Safari. Ils ne sont pas présentés comme des captures.

## Recette visuelle et CI

`audit/v5-browser.mjs` charge les applications réelles et le serveur canonique. `audit/v5-checkout.mjs` récupère les versions V5 et les versions avant modification depuis des commits immuables de `audit/v5-manifest.json`. Le workflow `RPG Connect V5 validation` prévoit Chromium et WebKit, à 1180×820 pour les joueurs et 1280×800 pour le MJ, avec captures PNG et résultats JSON.

Captures attendues : avant Brack/Samoth/Rufus/Encounter ; après Brack Groupe pendant son tour, Brack réactions hors tour, Samoth concentration, Rufus réaction consommée, Encounter paramètres Table Libre, Encounter journal global. Le script compare aussi les couleurs/fonds/formes typographiques du bouton Action existant.

**Première exécution navigateur réussie dans GitHub Actions**, Chromium et WebKit : [run 40956513188](https://github.com/bryantoualy-del/Encounter/actions/runs/40956513188). Les 20 PNG sont des captures réelles. La revue a rejeté le rendu initial : une règle de grille native étalait les cartes sur toute la largeur ; la navigation de Samoth et la présentation des paramètres MJ nécessitaient également une adaptation ciblée. Ces points ont été corrigés et une nouvelle recette avec contrôles géométriques est requise avant fusion. Localement, le navigateur reste indisponible ; la CI fournit la preuve graphique. Le vert émeraude retenu est `#10b981`.

## Dépôts et dépendances

Aucun fichier du dépôt Pilot20 n’a été modifié. Les bibliothèques de personnages, la Forge et le catalogue sont hors périmètre. Les changements partagés sont limités aux adaptateurs historiques de combat et au journal, avec validation de régression.

| Dépôt | PR en brouillon | Commit V5 |
|---|---|---|
| RPG-Connect | [PR #5](https://github.com/bryantoualy-del/RPG-Connect/pull/5) | [`73baec9d`](https://github.com/bryantoualy-del/RPG-Connect/commit/73baec9d9011030c02e51d1de0f0c95ab553b024) |
| Kentaro | [PR #12](https://github.com/bryantoualy-del/Kentaro/pull/12) | [`25b33403`](https://github.com/bryantoualy-del/Kentaro/commit/25b334030ad45b051242bf8fead90a25e43a5e8a) |
| Brackmard | [PR #9](https://github.com/bryantoualy-del/Brackmard/pull/9) | [`c80cbcc9`](https://github.com/bryantoualy-del/Brackmard/commit/c80cbcc9f91e7325afe074f4eef27d5e12c0f840) |
| Samoth | [PR #12](https://github.com/bryantoualy-del/Samoth/pull/12) | [`865cb95f`](https://github.com/bryantoualy-del/Samoth/commit/865cb95f167240483100634b1b1d6cf7d84e658e) |
| Rufus | [PR #19](https://github.com/bryantoualy-del/Rufus/pull/19) | [`0f8f239e`](https://github.com/bryantoualy-del/Rufus/commit/0f8f239e58708f637365682134cc02f4f9742903) |
| Nans | [PR #10](https://github.com/bryantoualy-del/Nans/pull/10) | [`e9332a27`](https://github.com/bryantoualy-del/Nans/commit/e9332a2713d62fe2e9faa26a2a42fea9fae91b85) |
| Zephyr | [PR #10](https://github.com/bryantoualy-del/Zephyr/pull/10) | [`4218827d`](https://github.com/bryantoualy-del/Zephyr/commit/4218827d90b65859e1fccd0c6fde0c83f3b66402) |

Encounter porte cette livraison, l’audit, la recette et les preuves. Les versions de ses dépendances sont figées dans le manifeste. Les branches dédiées ne changent pas les versions principales.

## Limites et étapes restantes

1. Exécuter la recette navigateur, récupérer les PNG réels et examiner les rendus. Réparer tout écart de DA ou de mise en page avant fusion.
2. Vérifier les workflows GitHub et leur disponibilité réelle ; la présence d’un workflow ne prouve pas son exécution.
3. Fusionner les huit PR et vérifier les déploiements seulement après validation technique et visuelle complète. Aucun lien V5 de déploiement n’est revendiqué.

Les salles du serveur restent en mémoire comme en V4. Après un redémarrage serveur, Encounter restaure son mode mais les invitations doivent être recréées ; les états et journaux personnels demeurent sur les appareils.

La deuxième recette a détecté le panneau Combat historique de Kentaro encore visible sous son sélecteur `data-panel`, ce qui repoussait le Groupe sous le viewport ; ce sélecteur est désormais pris en charge. Les anciens E2E Guidés utilisent maintenant le serveur canonique RPG-Connect au lieu de la copie serveur Lot 2 obsolète.

La troisième recette Chromium et WebKit a réussi : [run 40958800096](https://github.com/bryantoualy-del/Encounter/actions/runs/40958800096). Les captures confirment la grille à deux colonnes, la visibilité de l’initiative et les paramètres MJ. Derniers ajustements soumis à validation : retrait des anciens emplacements de navigation vides, libellé explicite du tour dans le journal global et purge de la file personnelle au passage en Table Libre. La recette Guidée attend désormais le résultat durable des dés plutôt qu’un état transitoire de leur animation.
