# Invocations liées à Encounter — 6 octobre 2026

Cette extension est basée sur la tranche soins validée, sur `feature/summon-authority-20261006` dans Encounter, Kentaro et Samoth. Les quatre autres Companions et le bus sont inchangés. Aucun merge ni déploiement sur main.

## Audit et périmètre

Le dragon de Samoth existait uniquement sous state.dragon (50 PV, CA19, slot5/action/concentration1h, deux Déchirements et Souffle, juste après Samoth). Le spectre de Kentaro existait sous spectreActive/spectreHp/spectreTemp (22 PV +5 PV temp, CA12, absorption de vie, juste après Kentaro, retrait au repos long). Leurs commandes et PV étaient locaux. Les acteurs déclarés dans CompanionAPI ne créaient pas d’entités Encounter.

Encounter possède déjà companionOf et un tri plaçant les créatures associées après leur propriétaire à initiative égale. Ce mécanisme est réutilisé. Les invocations ne lancent pas une nouvelle initiative et ne consomment pas une nouvelle place dans le roster des six connexions. Elles ont néanmoins une ligne/phase propre juste après leur propriétaire, avec la validation de fin de tour existante.

Les objets animés de Samoth utilisent une mécanique collective distincte (plusieurs objets, tailles, lot de jets/dégâts). Cette extension ne les convertit pas en créatures individuelles ; leur fonctionnement existant est conservé.

## Autorité et cycle de vie

La création native produit un UUID d’incarnation persisté dans le Companion. L’identité Encounter est `summon:<ownerId>:<instanceId>`, avec ownerId, propriétaire participant, kind et type de créature. Le dragon est dragon ; le spectre est mort-vivant. La création initiale adopte les valeurs natives ; ensuite les snapshots du Companion ne peuvent plus écraser PV, PV max, PV temp, défenses MJ ni états Encounter.

Le snapshot normal `state:changed.custom.summons` transporte le cycle de vie et l’économie native. Le bus et son ACK sont inchangés. Des traces de retrait persistées empêchent les snapshots retardés, retries et reconnexions de recréer une incarnation disparue. Une nouvelle invocation reçoit une nouvelle identité. À 0 PV, la créature disparaît conformément aux branches natives ; ce n’est pas un personnage inconscient à soigner/revivifier.

Concentration arrêtée/remplacée, renvoi, durée1h du dragon, repos long de Kentaro ou retrait MJ terminent l’incarnation. Retirer le propriétaire retire aussi ses invocations. Le curseur de tour est conservé par identité lors de l’insertion/retrait, afin de ne pas changer arbitrairement le combattant actif.

## Santé et ciblage

Les soins, Aide et PV temporaires empruntent les moteurs déjà livrés. Le catalogue allié contient les invocations avec leur type et leur propriétaire, sans PV exacts pour les autres joueurs. Le propriétaire seul reçoit `state:sync.summons` contenant santé et états de ses propres créatures. Les PV du propriétaire restent indépendants.

Les boutons locaux de dégâts/soins d’invocation deviennent des demandes Encounter en mode autoritaire. `summon:damage` est une demande distincte de dégâts au seul compagnon invoqué du demandeur ; elle conserve actionId, combatId, cible et quantité dans la réservation/retry existants. Encounter valide la propriété, applique R/I/V et PV temp avec son moteur habituel et déduplique les demandes. Les PV de Kentaro/Samoth ne sont pas utilisés pour ces dégâts.

Le spectre est refusé par Imposition des mains à cause du type mort-vivant ; la réserve est restituée. La présente extension ne change pas gratuitement les filtres des autres capacités natives. Le moteur reste unique pour PJ, PNJ et invocations.

## Tours, attaques et états

Le serveur donne la main au contrôleur du propriétaire lorsque la ligne de l’invocation est active. Il accepte sa demande de fin de tour pour cette ligne et envoie le même close/grant avec l’acteur concerné. La synchronisation d’état n’avance pas un tour local ; le grant aligne la phase. La reconnexion aligne la phase depuis l’acteur actif.

Les attaques restent dans les flux hit/miss existants ; leur acteur est désormais correctement dragon/spectre. Le compteur dragon est séparé du compteur Samoth. Les états incapacitants sont validés sur l’invocation au jet, à la demande de validation et à la réception des dégâts (test réseau : propriétaire paralysé/dragon valide, puis dragon paralysé/propriétaire valide), et son avantage prochaine attaque d’arme est distinct de celui du propriétaire. Les défenses et états MJ sont conservés, synchronisés et réutilisés par Encounter.

## Limites de données

Les Companions ne fournissent pas de fiche complète de JdS/R/I/V pour ces créatures. Aucun profil officiel ni valeur maison supplémentaire n’a été inventé : les valeurs natives connues sont importées et les défenses/JdS supplémentaires restent à renseigner/valider par le MJ dans Encounter. L’adoption d’une ancienne sauvegarde sans heure d’invocation démarre la durée suivie du dragon au moment de son adoption ; les nouvelles invocations enregistrent l’heure de lancement et ne prolongent pas leur durée à la reconnexion.

Le contrôle/ressources restent locaux au Companion et les PV/ledgers persistent dans le stockage navigateur Encounter, comme la tranche soins. La file serveur reste en mémoire, sans base externe ajoutée. Tests réalisés dans Chromium ; qualification physique iPad non réalisée.

## Fichiers

- Encounter : rpg-summon-authority.js et tests, rpg-connect-mj.js, app.js (métadonnées/tri), index.html/service-worker.js, package.json, fixture MJ, audit/summon-e2e.mjs et ce rapport.
- Kentaro : index.html (identité, phase, PV/états, boutons), companion-api.js, rpg-connect-client.js, rpg-health.js, rpg-summons-client.js.
- Samoth : companion.js et index.html, companion-api.js, rpg-connect-client.js, rpg-health.js, rpg-summons-client.js.

## Tests et livraison

Résultats finaux et contrôles détaillés dans summon-validation.json. Les suites utilisent le vrai serveur WebSocket, six Companions et Chromium réel. Les nouvelles vérifications couvrent création native, initiative du propriétaire, validation MJ des deux phases, attaques/counters séparés, soins admissibles/refusés, Aide/Cor mixtes, propriétaire déconnecté, reload Encounter/Companion, disparition à0, ancien snapshot, nouvelle incarnation, doublon de dégâts, concentration, expiration et repos long.

Le scénario dédié aux invocations utilise un combat avec les six Companions, le dragon, le spectre, trois alliés créés depuis la Bibliothèque et deux ennemis (Gobelin/Loup sanguinaire). Il couvre trois séquences : création/tours/attaques ; effets mixtes/reconnexion ; destruction/nouvelle incarnation/concentration/expiration/repos. Il ne compte pas comme trois combats distincts. Les trois compositions distinctes de la suite soins ont également été rejouées.

Les traces navigateur et snapshots permettent la reproduction. Quelques passes intermédiaires ont corrigé des fixtures de test (bonus d’initiative, bouton de validation présent dans deux surfaces, champ de jet partagé masqué dans la vue invocation) ; aucun gameplay n’a été forcé pour masquer un échec. La passe finale est exécutée en série avec les suites de non-régression santé et multicible.

Les nouvelles PR sont des drafts basées sur `feature/healing-authority-20261006`, pour isoler cette extension et conserver la revue de la tranche soins. Main reste inchangé.

## Résultat final

- 94 tests unitaires, 7 tests clients/bridges et 4 tests icônes : **105 réussites, 0 échec**.
- Chromium réel : **218 vérifications réussies, 0 échec**, sans exception JavaScript : global114, trois combats26, familles santé33, capacités complexes15, invocations natives25, dés de vie1, compatibilité4.
- Les trois compositions de combat précédentes sont rejouées sur les branches invocations ; le scénario natif dragon/spectre est également passé sur le code final.
- Aucun changement dans Brackmard, Zephyr, Rufus, Nans ou RPG-Connect pour cette extension. Aucun changement publié sur main.
- **Aucune régression connue dans le périmètre testé.** Les limites de données et les objets animés différés restent celles détaillées ci-dessus.

Commandes : npm test, npm run test:companions, npm run test:icons ; scripts audit/e2e.mjs, healing-e2e.mjs, health-families-e2e.mjs, health-complex-e2e.mjs, summon-e2e.mjs, healing-hitdice-e2e.mjs, healing-compat-e2e.mjs.
