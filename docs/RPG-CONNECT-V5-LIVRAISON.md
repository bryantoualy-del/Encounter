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
| RPG-Connect | [PR #5](https://github.com/bryantoualy-del/RPG-Connect/pull/5) | [`33d5ab63`](https://github.com/bryantoualy-del/RPG-Connect/commit/73baec9d9011030c02e51d1de0f0c95ab553b024) |
| Kentaro | [PR #12](https://github.com/bryantoualy-del/Kentaro/pull/12) | [`780b52c8`](https://github.com/bryantoualy-del/Kentaro/commit/d7caf21d55441ab2fdcd40775c2e99e3a3c5db3e) |
| Brackmard | [PR #9](https://github.com/bryantoualy-del/Brackmard/pull/9) | [`7ed15bab`](https://github.com/bryantoualy-del/Brackmard/commit/16294799e7eaa04ad398d0d3c1ad3b950ba5b809) |
| Samoth | [PR #12](https://github.com/bryantoualy-del/Samoth/pull/12) | [`50eaa7fe`](https://github.com/bryantoualy-del/Samoth/commit/8ef9ded47577d55e2e76373281c8d897842223a4) |
| Rufus | [PR #19](https://github.com/bryantoualy-del/Rufus/pull/19) | [`aa3f9906`](https://github.com/bryantoualy-del/Rufus/commit/1bda1da0c7c0346e5115137155498eedbd2f4253) |
| Nans | [PR #10](https://github.com/bryantoualy-del/Nans/pull/10) | [`e7b7bb68`](https://github.com/bryantoualy-del/Nans/commit/e8e1c579b5939d446437c346d6a8994c601c3290) |
| Zephyr | [PR #10](https://github.com/bryantoualy-del/Zephyr/pull/10) | [`b5c5a37a`](https://github.com/bryantoualy-del/Zephyr/commit/e2fe8965bef83a7480acf4c980358dfef3f920c1) |

Encounter porte cette livraison, l’audit, la recette et les preuves. Les versions de ses dépendances sont figées dans le manifeste. Les branches dédiées ne changent pas les versions principales.

## Limites et étapes restantes

1. Exécuter la recette navigateur, récupérer les PNG réels et examiner les rendus. Réparer tout écart de DA ou de mise en page avant fusion.
2. Vérifier les workflows GitHub et leur disponibilité réelle ; la présence d’un workflow ne prouve pas son exécution.
3. Fusionner les huit PR et vérifier les déploiements seulement après validation technique et visuelle complète. Aucun lien V5 de déploiement n’est revendiqué.

Les salles du serveur restent en mémoire comme en V4. Après un redémarrage serveur, Encounter restaure son mode mais les invitations doivent être recréées ; les états et journaux personnels demeurent sur les appareils.

La deuxième recette a détecté le panneau Combat historique de Kentaro encore visible sous son sélecteur `data-panel`, ce qui repoussait le Groupe sous le viewport ; ce sélecteur est désormais pris en charge. Les anciens E2E Guidés utilisent maintenant le serveur canonique RPG-Connect au lieu de la copie serveur Lot 2 obsolète.
