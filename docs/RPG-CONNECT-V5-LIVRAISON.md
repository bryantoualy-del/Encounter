# RPG Connect V5 — livraison coordonnée

**Table Libre validé en environnement isolé ; livraison bloquée par la recette Guidée. Aucune fusion.** Les références, résultats et limites de cette livraison sont consignés ci-dessous. Aucun fichier de Pilot20 n’a été modifié.

## Comportement livré

- Table Libre devient le mode de session par défaut ; Guidé conserve les mécanismes historiques. Le choix se propage et se restaure.
- Encounter conserve le rythme collectif, les ennemis, l’initiative et les corrections. Les joueurs restent propriétaires de leurs PV, états, ressources et réactions. Aucune attaque locale ne retire automatiquement des PV ennemis en Table Libre.
- Les six Companions réutilisent leurs véritables moteurs et leur navigation : onglet Groupe, raccourcis natifs, liste mixte par initiative, tour actif allié/ennemi, édition personnelle et réaction librement corrigeable.
- Les contours jaune, cyan, magenta et émeraude (#10b981) s’appliquent uniquement aux actions rapides et à la barre existante. Les fonds, typographies, portraits et thèmes sont conservés.
- Les journaux personnels persistent localement, sans envoyer les jets ou calculs privés au MJ. Le journal global existant raconte les interventions Encounter, regroupées par round et tour connu. Les événements hors combat restent sans faux tour.
- Révisions et déduplication protègent les débuts de tour ; une correction du marqueur ou une reconnexion ne récupère pas une réaction consommée. Un marqueur périmé est signalé lors de la perte du MJ ; le serveur purge alors les commandes Table Libre non acquittées, sans modifier la file Guidée.
- Les PV/CA ennemis sont absents du flux tant que le MJ ne les divulgue pas. Le serveur filtre les champs et transactions en Table Libre ; les files Guidées privées sont purgées au changement de mode.

## Vérifications

| Suite | Résultat |
|---|---:|
| Régressions Encounter | 348/348 |
| Protocole serveur canonique | 8/8 |
| Six HTML réels + sept applications + vrai WebSocket | 7/7 |
| Ponts des Companions | 7/7 |
| Icônes | 4/4 |
| Journal et activité (`test:journal`) | 12/12 |
| Journal UI et journal MJ | 18/18 |

La recette V5 vérifie Riposte (réaction + dé), Esquive instinctive, Bouclier (emplacement + réaction + CA temporaire), Protection, les corrections libres, les six états simultanés, les ennemis cachés/publics, la reprise après reconnexion/réouverture, le journal MJ et l’absence de transmission des attaques personnelles. Elle utilise les applications réelles, pas des doubles de leur moteur.

## Couverture des scénarios demandés

| Scénario | Preuves et portée |
|---|---|
| A — Groupe | Six onglets réels, tri mixte décroissant, PV/temp/CA/états/réaction, surbrillance allié et ennemi ; DOM connecté et géométrie Chromium/WebKit. |
| B — Économie | Contours sur barre et seuls raccourcis ; navigation sans attribut de surbrillance, fond/police/rayon natifs comparés, concentration Samoth visible. |
| C — Réactions | Riposte de Brack consomme dé + réaction ; Esquive instinctive Rufus, Bouclier Samoth (CA 15→20 sans changer la base), Protection Zéphyr ; bouton manuel dans les deux sens, synchronisation, récupération action/bonus/réaction au tour suivant des six personnages, expiration de Bouclier et début de tour dédupliqué. |
| D — Journaux | Événements locaux persistants après réouverture ; aucune attaque personnelle reçue par Encounter ; intervention manuelle MJ et regroupements round/tour ; synchronisations sans duplication. |
| E — Modes/reprise | Table Libre initial, bascule Guidé/Table Libre, purge des transactions personnelles, propriétaire local conservé, refus des corrections périmées, GM absent explicite et absence de rejeu de sa file Table Libre. |

La compatibilité Guidée est également soumise aux parcours historiques complets ; leur statut courant reste distinct de la réussite V5.

## Captures réelles et comparaison

`audit/v5-checkout.mjs` récupère les sources et baselines immuables de `audit/v5-manifest.json`. `audit/v5-browser.mjs` exécute les sept applications et le serveur canonique. La revue compare les captures avant/après : cuivre de Brack, glace de Samoth, violet de Rufus et interface MJ conservés. Les règles de grille natives et un ancien emplacement vide ont été corrigés pour garder Groupe visible et aligné.

Chaque moteur produit 10 PNG : avant Brack/Samoth/Rufus/Encounter ; après Brack Groupe pendant son tour, Brack réactions hors tour, Samoth concentration, Rufus réaction consommée, Encounter mode Table Libre, Encounter journal global. Les six onglets sont contrôlés géométriquement et le bouton Action d’origine est comparé avant/après (fond, couleur, police, rayon).

La recette [Chromium/WebKit 40962200591](https://github.com/bryantoualy-del/Encounter/actions/runs/40962200591) passe sur les deux moteurs. Ses [captures Chromium](https://github.com/bryantoualy-del/Encounter/actions/runs/40962200591/artifacts/12936707353) et [captures WebKit](https://github.com/bryantoualy-del/Encounter/actions/runs/40962200591/artifacts/12936732310) ont été examinées ; le filtre MJ est lisible dans WebKit. Le statut de la régression Guidée et des dernières vérifications figure dans `RPG-CONNECT-V5-VALIDATION.json`. Les captures sont de vraies captures navigateur, sans génération d’image.

## Dépôts et dépendances

Aucun fichier du dépôt Pilot20 n’a été modifié. Les bibliothèques de personnages, la Forge et le catalogue sont hors périmètre. Les changements partagés sont limités aux adaptateurs historiques de combat et au journal, avec validation de régression.

| Dépôt | Pull request | Commit V5 |
|---|---|---|
| RPG-Connect | [PR #5](https://github.com/bryantoualy-del/RPG-Connect/pull/5) | [`11642945`](https://github.com/bryantoualy-del/RPG-Connect/commit/116429451a52e39d2b82e391eecd5797010e0881) |
| Kentaro | [PR #12](https://github.com/bryantoualy-del/Kentaro/pull/12) | [`25b33403`](https://github.com/bryantoualy-del/Kentaro/commit/25b334030ad45b051242bf8fead90a25e43a5e8a) |
| Brackmard | [PR #9](https://github.com/bryantoualy-del/Brackmard/pull/9) | [`c80cbcc9`](https://github.com/bryantoualy-del/Brackmard/commit/c80cbcc9f91e7325afe074f4eef27d5e12c0f840) |
| Samoth | [PR #12](https://github.com/bryantoualy-del/Samoth/pull/12) | [`865cb95f`](https://github.com/bryantoualy-del/Samoth/commit/865cb95f167240483100634b1b1d6cf7d84e658e) |
| Rufus | [PR #19](https://github.com/bryantoualy-del/Rufus/pull/19) | [`0f8f239e`](https://github.com/bryantoualy-del/Rufus/commit/0f8f239e58708f637365682134cc02f4f9742903) |
| Nans | [PR #10](https://github.com/bryantoualy-del/Nans/pull/10) | [`e9332a27`](https://github.com/bryantoualy-del/Nans/commit/e9332a2713d62fe2e9faa26a2a42fea9fae91b85) |
| Zephyr | [PR #10](https://github.com/bryantoualy-del/Zephyr/pull/10) | [`4218827d`](https://github.com/bryantoualy-del/Zephyr/commit/4218827d90b65859e1fccd0c6fde0c83f3b66402) |

Encounter porte cette livraison, l’audit, la recette et les preuves. Les versions de ses dépendances sont figées dans le manifeste. La fusion doit utiliser les têtes validées, sans modification du code après recette.

## Limites et exploitation

- Les viewports testés sont 1180×820 (joueurs) et 1280×800 (MJ), avec WebKit et Chromium. Ce ne sont pas des essais sur iPad Air 5 ou Galaxy Tab S7 FE physiques. La capture Kentaro et la référence exacte de vert mentionnées dans la demande n’étaient pas accessibles ; la comparaison utilise les sources de production avant modification.
- Les salles serveur restent en mémoire comme en V4. Après redémarrage du serveur, Encounter conserve son mode mais les invitations doivent être recréées ; les états et journaux personnels restent sur les appareils. Le journal personnel conserve les 1000 dernières entrées.
- Le navigateur local n’était pas installable ; la CI fournit les captures et les preuves des parcours réels.
- La vérification du serveur Render est bloquée : aucun espace de travail n’est sélectionné. Le guide Render impose de faire identifier l’espace par l’utilisateur avant de lire ses services. Aucun déploiement serveur ni contrôle de santé de production n’est revendiqué.
- Le déploiement doit coordonner le serveur V5 puis les applications. Les anciens clients ne sont acceptés qu’en Guidé ; Table Libre demande la capacité V5. Les workflows Pages existants sont conservés.

Pour une recette à la table : créer une session, vérifier Table Libre, connecter les six joueurs, préparer/valider les initiatives, afficher successivement un allié et un ennemi, consommer/corriger une réaction, modifier les PV personnels hors ligne, reconnecter puis recharger, et contrôler la séparation des journaux. Conserver Guidé comme option de session lorsque ses transactions sont souhaitées.

## Blocages constatés — recette finale

La [recette V5 finale](https://github.com/bryantoualy-del/Encounter/actions/runs/40963669476) passe sur Chromium et WebKit, avec le dernier serveur et les six Companions. Les 348 régressions et les 8 tests serveur passent. Les huit PR restent en brouillon et aucune branche principale n’a été modifiée.

La [recette Guidée](https://github.com/bryantoualy-del/Encounter/actions/runs/40963669704) échoue :

- Rufus : Image miroir consomme correctement 2 charges ; après annulation certifiée, une synchronisation rétablit 3 charges au lieu de conserver les 5 restaurées.
- Brack : le contrôle combiné de Vigueur naine (soin, dé de vie, action et Esquive) échoue après une première annulation d’Esquiver.
- Parcours collectif : le JdS de Peur de Zéphyr n’apparaît pas après la simulation de cinq rounds (audit/e2e.mjs:128). La collecte brute des trames dépasse ensuite la limite de sérialisation ; ce défaut du diagnostic ne constitue pas une preuve de réussite.

Une correction exploratoire de l’annulation a été retirée car sa vérification isolée échouait. Elle n’est pas incluse dans les PR. Il reste à résoudre ces trois parcours, borner les trames de diagnostic et relancer la compatibilité Guidée avant fusion. Le statut préexistant ou introduit de ces défauts n’est pas établi ; aucune régression n’est déclarée résolue sans preuve.
