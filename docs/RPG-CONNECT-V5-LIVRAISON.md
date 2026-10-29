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

**Ce script navigateur n’a pas encore été exécuté.** Localement, aucun navigateur n’est installé et les téléchargements Playwright retournent une archive ZIP invalide. Aucun fichier image n’a été généré pour simuler une preuve. Le vert émeraude `#10b981` reste à comparer à la référence du MJ.

## Dépôts et dépendances

Aucun fichier du dépôt Pilot20 n’a été modifié. Les bibliothèques de personnages, la Forge et le catalogue sont hors périmètre. Les changements partagés sont limités aux adaptateurs historiques de combat et au journal, avec validation de régression.

| Dépôt | PR en brouillon | Commit V5 |
|---|---|---|
| RPG-Connect | [PR #5](https://github.com/bryantoualy-del/RPG-Connect/pull/5) | [`33d5ab63`](https://github.com/bryantoualy-del/RPG-Connect/commit/33d5ab63b38fcad457290d425a14a7be10aba7cf) |
| Kentaro | [PR #12](https://github.com/bryantoualy-del/Kentaro/pull/12) | [`780b52c8`](https://github.com/bryantoualy-del/Kentaro/commit/780b52c83b9dce0c5aa3f21ede8d84647a3cb2c1) |
| Brackmard | [PR #9](https://github.com/bryantoualy-del/Brackmard/pull/9) | [`7ed15bab`](https://github.com/bryantoualy-del/Brackmard/commit/7ed15bab98cc00da6c4337517b4c5e11e6bf7f2d) |
| Samoth | [PR #12](https://github.com/bryantoualy-del/Samoth/pull/12) | [`50eaa7fe`](https://github.com/bryantoualy-del/Samoth/commit/50eaa7fe24ea2ead649578f55bb1e1e280e65b9e) |
| Rufus | [PR #19](https://github.com/bryantoualy-del/Rufus/pull/19) | [`aa3f9906`](https://github.com/bryantoualy-del/Rufus/commit/aa3f9906b5aa7f588c84bd36d92bc0b7cb1011dd) |
| Nans | [PR #10](https://github.com/bryantoualy-del/Nans/pull/10) | [`e7b7bb68`](https://github.com/bryantoualy-del/Nans/commit/e7b7bb685fa68dde0b4fe40f50a4ed7d6727ba26) |
| Zephyr | [PR #10](https://github.com/bryantoualy-del/Zephyr/pull/10) | [`b5c5a37a`](https://github.com/bryantoualy-del/Zephyr/commit/b5c5a37a5b2eff9e0d2adde3171a34daedff6ede) |

Encounter porte cette livraison, l’audit, la recette et les preuves. Les versions de ses dépendances sont figées dans le manifeste. Les branches dédiées ne changent pas les versions principales.

## Limites et étapes restantes

1. Exécuter la recette navigateur, récupérer les PNG réels et examiner les rendus. Réparer tout écart de DA ou de mise en page avant fusion.
2. Vérifier les workflows GitHub et leur disponibilité réelle ; la présence d’un workflow ne prouve pas son exécution.
3. Fusionner les huit PR et vérifier les déploiements seulement après validation technique et visuelle complète. Aucun lien V5 de déploiement n’est revendiqué.

Les salles du serveur restent en mémoire comme en V4. Après un redémarrage serveur, Encounter restaure son mode mais les invitations doivent être recréées ; les états et journaux personnels demeurent sur les appareils.
