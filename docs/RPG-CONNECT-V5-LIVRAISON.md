# RPG Connect V5 — livraison coordonnée

Les huit applications historiques ont été adaptées sans modifier Pilot20, son créateur, la bibliothèque, la Forge ni le catalogue. Les moteurs et les identités graphiques des six Companions sont conservés. Les PR et les révisions exactes figurent ci-dessous ; leur état de fusion est visible sur GitHub.

## Fonctionnement livré

- **Table Libre par défaut**, mode Guidé conservé ; choix de session propagé et restauré.
- Joueurs propriétaires de leurs PV, PV temporaires, états, ressources, concentration et réaction ; Encounter contrôle les ennemis, l’initiative et le rythme collectif.
- Onglet **Groupe** dans la navigation existante des six Companions : raccourcis natifs à gauche, initiative mixte décroissante à droite, tour actif allié/ennemi, états compacts et édition personnelle.
- Contours or, cyan et magenta sur la barre existante et les seules actions rapides pertinentes ; concentration émeraude `#10b981`. Aucun remplacement des fonds, portraits, boutons ou thèmes natifs.
- Réactions consommées par leurs capacités réelles, restaurées une seule fois au prochain tour confirmé et librement corrigeables dans les deux sens.
- Journaux personnels locaux persistants ; journal global Encounter existant consacré aux interventions MJ, regroupé par round et tour connu. Les jets, ressources et attaques personnels restent privés en Table Libre.
- PV et CA ennemis absents du flux tant que le MJ ne les divulgue pas. Révisions, CAS et déduplication protègent les états propriétaires et les débuts de tour. La perte du MJ rend le marqueur périmé et purge sa file Table Libre non acquittée ; la livraison Guidée reste conservée.

## Corrections de compatibilité

L’annulation certifiée Guidée transmet désormais sa révision de correction au Companion sans réappliquer des valeurs périmées. Les révisions de santé restent indépendantes de la version des ressources : un soin ou une modification de PV ne remet plus à zéro le coût natif de Vigueur naine. Ces changements partagés sont limités aux adaptateurs des huit dépôts et couverts par les parcours d’annulation/reconnexion.

Blessure de Rufus référence le même bonus de Bénédiction que ses autres attaques, avec un total calculé correctement ; la variable auparavant non définie empêchait son exécution. Le sélecteur de mode et le filtre du journal sont lisibles dans WebKit. Les fiches joueurs ouvertes dans Encounter conservent leur état pendant les rafraîchissements.

Les tests historiques utilisent maintenant les contrôles réels : confirmation d’aura, fenêtres de saisie natives, contact persistant de PyroMerlin et bouton de sélection de ligne. Le scénario de cinq rounds attend les acquittements entre tours ; les limites des files serveur ne sont pas relevées. Les traces sont bornées et les anciens résultats supprimés avant chaque exécution.

## Preuves

| Vérification | Résultat |
|---|---:|
| Régressions Encounter | 348/348 |
| Protocole serveur canonique | 8/8 |
| Six HTML réels et sept applications avec vrai WebSocket | 7/7 |
| Ponts Companion | 7/7 |
| Icônes | 4/4 |
| Journal UI et journal MJ | 18/18 |
| Journal et activité | 12/12 |
| Parcours réel Brack Guidé | 30/30 |
| Parcours réel Rufus Guidé | 38/38 |
| Parcours collectif Guidé, sept applications | 116/116 |

Le parcours collectif couvre notamment attaques et sauvegardes natives des six personnages, ressources, initiative, cinq rounds, multi-cibles et annulation, reconnexions, concentration, anciens états rejetés, PV temporaires, repos annulés et restauration après rechargement. Les parcours Brack et Rufus vérifient leurs capacités et annulations réelles, pas un moteur parallèle.

La [PR centrale #20](https://github.com/bryantoualy-del/Encounter/pull/20) fournit les liens vers la CI finale et ses artefacts Guidés. Les workflows sont fixés sur Ubuntu 24.04, compatible avec Playwright. La fusion est conditionnée aux contrôles techniques réussis et à l’examen des captures.

## Captures réelles

La [recette Chromium/WebKit](https://github.com/bryantoualy-del/Encounter/actions/runs/41019701541) a réussi sur les deux moteurs. Les [captures Chromium](https://github.com/bryantoualy-del/Encounter/actions/runs/41019701541/artifacts/12960782648) et [captures WebKit](https://github.com/bryantoualy-del/Encounter/actions/runs/41019701541/artifacts/12960844063) ont été examinées et comparées aux baselines immuables de `audit/v5-manifest.json`.

Chaque moteur produit dix PNG : avant Brack/Samoth/Rufus/Encounter ; après Brack Groupe pendant son tour, Brack réactions hors tour, Samoth concentration, Rufus réaction consommée, Encounter paramètres Table Libre, Encounter journal global. Les six onglets sont également contrôlés géométriquement. Fond, couleur, police et rayon du bouton Action natif sont comparés avant/après. Aucune image générée n’est utilisée comme preuve.

## Dépôts

| Dépôt | PR | Révision du code validé |
|---|---|---|
| RPG-Connect | [#5](https://github.com/bryantoualy-del/RPG-Connect/pull/5) | [11642945](https://github.com/bryantoualy-del/RPG-Connect/commit/116429451a52e39d2b82e391eecd5797010e0881) |
| Kentaro | [#12](https://github.com/bryantoualy-del/Kentaro/pull/12) | [9daf4000](https://github.com/bryantoualy-del/Kentaro/commit/9daf4000e8cf50f4c0c4e5e04590ea7eeaffbe23) |
| Brackmard | [#9](https://github.com/bryantoualy-del/Brackmard/pull/9) | [49260439](https://github.com/bryantoualy-del/Brackmard/commit/49260439f38bcf3d75efbf603c7f4c9a80bf11b3) |
| Samoth | [#12](https://github.com/bryantoualy-del/Samoth/pull/12) | [6bfa2efa](https://github.com/bryantoualy-del/Samoth/commit/6bfa2efa4950ee121330da6157dde024d7f318bb) |
| Rufus | [#19](https://github.com/bryantoualy-del/Rufus/pull/19) | [4b149428](https://github.com/bryantoualy-del/Rufus/commit/4b149428683372866010111e0afa90d97b00d273) |
| Nans | [#10](https://github.com/bryantoualy-del/Nans/pull/10) | [2b210204](https://github.com/bryantoualy-del/Nans/commit/2b21020474eab205b87ce649f18dd5bbcb5b6a0f) |
| Zephyr | [#10](https://github.com/bryantoualy-del/Zephyr/pull/10) | [8beb843e](https://github.com/bryantoualy-del/Zephyr/commit/8beb843ec046f38667d6a108b93e695c98820c77) |
| Encounter | [#20](https://github.com/bryantoualy-del/Encounter/pull/20) | [1715b5f3](https://github.com/bryantoualy-del/Encounter/commit/1715b5f3e3f44135e9507bc5825080ff7ff63b54) |

L’audit préalable est dans [RPG-CONNECT-V5-AUDIT.md](RPG-CONNECT-V5-AUDIT.md). Les dépendances testées sont figées dans `audit/v5-manifest.json` et `audit/staging-manifest.json`.

## Limites et exploitation

- Viewports testés : 1180×820 pour les joueurs et 1280×800 pour le MJ, avec Chromium et WebKit. Aucun essai sur iPad Air 5 ou Galaxy Tab S7 FE physique n’est revendiqué.
- La capture Kentaro et le vert exact mentionnés dans la demande n’étaient pas accessibles ; la comparaison utilise les sources réelles avant modification. Le vert retenu est `#10b981`.
- Les salles serveur restent en mémoire comme en V4. Après redémarrage, Encounter conserve son mode mais les invitations doivent être recréées. Les données personnelles restent sur les appareils ; le journal personnel conserve les 1000 dernières entrées.
- Le serveur canonique est le service `rpgconnect`, lié au dépôt GitHub RPG-Connect, dans l’espace Render confirmé par l’utilisateur. Son adresse est https://rpgconnect-mr10.onrender.com et son contrôle public est `/health`. Le déploiement automatique suit `main` ; le commit et le déploiement V5 constatés sont consignés dans la PR centrale. Le service Render historique nommé Encounter lance une ancienne copie serveur, pas l’interface HTML : il n’est pas annoncé comme une URL frontend V5. Les workflows Pages existants sont conservés ; leurs résultats et liens effectifs sont également consignés dans la PR centrale.
- Les anciens clients restent acceptés en Guidé ; Table Libre exige la capacité V5. Le serveur et les applications doivent être mis à jour ensemble.
