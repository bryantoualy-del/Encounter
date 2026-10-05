# RPG Connect — rapport de stabilisation du 5 octobre 2026

## État de livraison

**MISSION INCOMPLÈTE — ne pas considérer la version publiée comme satisfaisant tous les critères de stabilité.**

Les huit dépôts ont reçu les corrections principales sur `main`. Trois combats distincts et 208 contrôles E2E avaient passé sur cette version. Le contrôle final a ensuite reproduit un défaut supplémentaire de validation individuelle d’initiative. Son correctif a passé 9 contrôles ciblés, mais le rejeu complet a été interrompu par la perte de connexion de l’environnement d’exécution au cours du deuxième combat.

Ce dernier correctif est sauvegardé sur les branches `audit/initiative-validation-recovery-2026-10-05` des sept applications concernées ; il n’est pas promu sur `main`. Les changements de durée limite des captures et le script ciblé ajoutés localement ne sont pas inclus dans ces branches de reprise.

Une archive intermédiaire avait été créée, extraite et testée avant la découverte du dernier défaut. **Elle ne constitue pas la livraison finale demandée et n’est pas présentée comme telle.** Il reste à rejouer les trois combats sur les branches de reprise, publier la version réellement testée, refaire le smoke test, reconstruire le ZIP, vérifier son extraction et rendre le fichier téléchargeable.

Le serveur Render utilise le code du dépôt **Encounter**, et non le dépôt RPG-Connect. RPG-Connect contient principalement les assets partagés. Render déploie actuellement le commit Encounter 40ca97bb337fdb9fdd6a78cb08c91d4971f1c8e4 ; état LIVE confirmé. La page Encounter publiée correspondait octet pour octet au fichier testé de ce commit. Le jeu authentifié en production reste **NON TESTÉ** : aucune vraie clé MJ n’a été utilisée dans les essais.

## A. Causes réelles et corrections

| Symptôme | Cause réelle | Fichiers concernés | Correction et preuve |
|---|---|---|---|
| Initiative annoncée mais absente Encounter, sans reconnexion, tel que décrit initialement | Ce symptôme précis n’a pas été reproduit sur les versions récupérées : Kentaro 14+2 et Brack 12+1 arrivaient dans Encounter | Six clients, CompanionAPI, serveur et MJ inspectés | Ne pas attribuer artificiellement ce symptôme à une cause unique ; **TESTÉ E2E ET PASSÉ** pour cette reproduction initiale du chemin réseau, sans reproduire l’échec signalé |
| Fin de tour provoque ReferenceError | Après api.emitLocal, un deuxième appel vise emitEvent, inexistant | Six rpg-connect-client.js | Suppression du second chemin ; abonnement API unique. Erreur initiale **TESTÉ E2E ET ÉCHOUÉ**, rejeu **TESTÉ E2E ET PASSÉ** |
| Rechargement Encounter perd participants/initiatives/tour | pruneLegacyAutoCCPlayers supprime les participants cc-* à chaque chargement puis ils sont recréés avec initiative 0 | Encounter/app.js | Conservation des participants connectés pendant préparation/combat ; stress avant/après reconnexion **TESTÉ E2E ET PASSÉ** après reproduction de l’échec |
| Combat restauré mais machine revient LOBBY | Initialisation de la machine indépendante de la phase persistée | Encounter/rpg-connect-mj.js | Restauration de la phase et de la session autoritaire |
| Pending Fin de tour, cibles ou attaque perdus au reload | Structures transitoires non persistées ; verrous expirant pendant une décision MJ | Encounter/rpg-connect-mj.js | Persistance des transactions, décisions, sélections, événements vus, JdS et pending ; reprise des décisions |
| Événement perdu entre émission et ACK lors du reload | Outbox Companion uniquement en mémoire | Six rpg-connect-client.js | Outbox sessionStorage, mêmes identifiants, retransmission périodique et purge sur ACK |
| Message « envoyé » trop tôt | Confusion émission locale / mise en transport / ACK serveur / décision MJ | Six clients et companion-api.js | Statuts de transmission puis réception serveur ; validation MJ distincte |
| Retry initiative rejeté | initiative:retry absent de la whitelist | Encounter/rpg-connect-server.js | Commande ajoutée ; contrat serveur **TESTÉ HORS E2E** |
| File serveur saturée perd un événement | Éviction silencieuse de l’ancien événement | Encounter/rpg-connect-server.js | Refus explicite du nouvel événement à la limite ; saturation **NON TESTÉ** en navigateur |
| Fin de tour masquée ou bouton inaccessible après action | Visibilité du ruban et pointer-events hérités | Six rpg-connect-client.js | Maintien du bouton du joueur actif et pointer-events:auto ; **TESTÉ E2E ET PASSÉ** |
| Nans conserve sa popup après décision réseau | confirmHit ne ferme pas la modal native | Nans/index.html, companion-api.js | Passage par la résolution native de choix ; **TESTÉ E2E ET PASSÉ** |
| Images cassées, notamment profil bête | Cinq anciens WebP invalides : standard beast/construct, boss beast/fey/ooze | RPG-Connect/assets ; registres des huit dépôts | 28 PNG intacts, chemins cohérents, racine versionnée, fallback SVG neutre ; aucun if spécifique Loup sanguinaire |
| Type froid/fielon mal normalisé | Regex unicode double échappée | Encounter/rpg-connect-mj.js | Normalisation correcte ; R/I/V et dégâts froid **TESTÉ E2E ET PASSÉ** |
| Métadonnées critique incomplètes | nat/crit cachés dans la structure native ou absents du pending exposé | companion-api.js ; bridges Brack/Zephyr/Samoth/Nans ; Rufus/companion-v3.js | Extraction explicite des métadonnées natives ; **TESTÉ E2E ET PASSÉ** |
| Économie Kentaro mal reflétée | actionUsed/bonusUsed hors de la structure lue par API | Kentaro/index.html, companion-api.js | Adaptateur economy natif ; attaque bonus et dépense **TESTÉ E2E ET PASSÉ** |
| Dégâts mixtes mal typés | Heuristique de texte laissant une partie non typée | Nans/index.html, Samoth/companion.js, Zephyr/index.html, APIs | Composants natifs explicites ; somme des composants égale au total pour les attaques contrôlées |
| Élimination issue d’un JdS peu visible | Retour JdS et feedback élimination incomplets | Encounter/rpg-connect-mj.js ; six clients | Résolution, toast et suppression des cibles mortes |
| Popup CIBLE ÉLIMINÉE hors écran ou écrasée | Règles CSS contradictoires et notification de cible suivante remplaçant le toast | Encounter/table.css, rpg-connect-mj.js | Correction du placement et conservation du toast ; visibilité et cadre contrôlés |
| Reset laisse pending/modal sur quatre Companions | API reset ne termine pas les callbacks d’attaque natifs | Six companion-api.js ; Brack/Zephyr/Samoth/Nans bridges | Annulation explicite sans dégâts ; baseline **TESTÉ E2E ET ÉCHOUÉ**, rejeu **TESTÉ E2E ET PASSÉ** |
| Reset inaccessible pendant JdS | Dialog native intercepte les clics vers le panneau MJ | Encounter/rpg-save-authority.js | Bouton Reset dans le dialog ; queue annulée, retours annulés explicites |
| Reset ferme aussi la nouvelle demande initiative | Prépa envoie initiative:request avant session.resetCombat | Six rpg-connect-client.js | Fermeture seulement en phase lobby ; régression reproduite puis rejeu **TESTÉ E2E ET PASSÉ** |
| Valider Kentaro affiche « Initiative validée » chez Brack non validé | combatSession publie initiative-validated à tous dès la première validation | Encounter/rpg-connect-mj.js ; six clients | Phase par characterId + initiative-pending ; baseline **TESTÉ E2E ET ÉCHOUÉ**, 9 contrôles ciblés **TESTÉ E2E ET PASSÉ**. Correctif seulement sur branches de reprise |
| ACK tardif peut remplacer l’état validé | Le handler ACK réécrit le ruban sans tenir compte de la validation ou du combat en cours | Six rpg-connect-client.js | Garde sur phase/tone ; rejeu avec pertes d’ACK **TESTÉ E2E ET PASSÉ**. Correctif seulement sur branches de reprise |

## B. Dépôts, fichiers et commits

Les commits suivants sont publiés sur main :

| Dépôt | Commit | Fichiers principaux modifiés |
|---|---|---|
| Encounter | 40ca97bb337fdb9fdd6a78cb08c91d4971f1c8e4 | .gitignore, app.js, audit/STABILIZATION-2026-10-05.md, audit/autonomous-e2e.mjs, audit/combats-e2e.mjs, audit/reset-pending-e2e.mjs, audit/stabilization-e2e.mjs, index.html, rpg-connect-icon-registry.js, rpg-connect-mj.js, rpg-connect-protocol.test.js, rpg-connect-server.js, rpg-save-authority.js, service-worker.js, table.css |
| RPG-Connect | c117b408816a0f52a08449d6fa5554d94794c0b4 | rpg-connect-icon-registry.js |
| Kentaro | 1cea8d3491576413c6ae461ef2532987376df70d | companion-api.js, index.html, rpg-connect-client.js, rpg-connect-icon-registry.js |
| Brackmard | 87bb067263df87210b972f73e63d5530e930837a | companion-api.js, index.html, rpg-connect-client.js, rpg-connect-icon-registry.js |
| Zephyr | cfa25b4ec86ebdb0c3b8a11659728650c2da8392 | companion-api.js, index.html, rpg-connect-client.js, rpg-connect-icon-registry.js |
| Rufus | 50c6799ffd302c7de56c23504280057beb597843 | companion-api.js, companion-v3.js, index.html, rpg-connect-client.js, rpg-connect-icon-registry.js |
| Samoth | da4aa5c4103b20c2d71223cbe5134869c1de35bc | companion-api.js, companion.js, index.html, rpg-connect-client.js, rpg-connect-icon-registry.js |
| Nans | 0fe9d9a00054bd903f82fac8233a0f422ad7be1d | companion-api.js, index.html, rpg-connect-client.js, rpg-connect-icon-registry.js |

Les 28 PNG partagés ont aussi été publiés dans RPG-Connect au commit 09ede3862f8a8b7bbb4371dcee4ee36824161a1a ; les registres pointent vers cette version immuable.

Dernier correctif ciblé, sauvegardé sans promotion :

| Dépôt | Commit de reprise |
|---|---|
| Encounter | ab8ce6040c48c7cafc774a478c6cc32870002609 |
| Brackmard | afc3be9168c2b74f85233cbdcf74bd5112b80388 |
| Samoth | 38e1bbda64e400bf4bbd7be7e07512718328acaf |
| Rufus | 1af57b56de5af9cff44c28a73b8d145e48a100cf |
| Kentaro | 5d36a1119ad24f5e1b93b4c005130845dde90dd0 |
| Nans | 233e89f7d0891059312d1fe0e955b39eb92aabc8 |
| Zephyr | 8fc457e3a699382509ce1c183f87bf73f4472f8a |

Les branches de reprise modifient le client et son URL de cache sur les six Companions ; Encounter modifie rpg-connect-mj.js, index.html et service-worker.js.

## Cartographie du transport

UI native → bridge du personnage → CompanionAPI.emit → subscriber rpg-connect-client → enrichissement characterId/combatId/cible/attackId → outbox → WebSocket event → serveur (identité et déduplication) → pendingEvents → Encounter.onEvent → persistance puis event-ack → commande MJ → file serveur de commandes → Companion → contrôle d’identifiant et application native → command-ack.

ACK serveur = événement accepté par le bus ; event-ack MJ = traitement par Encounter ; command-ack = commande appliquée côté Companion. Aucun ACK ne signifie à lui seul « initiative validée ».

- initiative:request → UI initiative → initiative:rolled avec requestId stable → valeur proposée Encounter → clic Valider MJ → session individuelle.
- turn:end-request → validation/refus MJ ; refus remet le bouton ; validation envoie turn:close, avance le participant et envoie turn:grant au binding du personnage suivant.
- attack:rolled + attack:pending-hit partagent attackId et verrou de cible → popup MJ → attack:decision → résolution locale → attack:damage ou attack:miss → ledger autoritaire Encounter → R/I/V, PV temp puis PV → retour de résolution et nouvelles targets.
- save:request conserve saveId/requestId, cible, caractéristique, DD, mode de dégâts → queue de JdS Encounter → décision MJ → save:result, dégâts/conditions côté Encounter.
- target:selected remonte la sélection ; targets:set et target:clear reviennent du MJ. Une cible à 0 PV est retirée des listes et sélections.
- state:changed transporte l’état local du personnage, avec révisions ; state:sync restitue la session Encounter (combat/round/tour/cibles/pending). La fiche locale reste autoritaire pour les règles et ressources du personnage.
- conditions:set et commandes HP sont acquittées et dédupliquées côté Companion. Les PV adverses sont exclusivement appliqués par Encounter.
- Undo, concentration et ressources font partie de l’état local publié par l’API. Leur couverture exhaustive et un undo après résolution autoritaire sont **NON TESTÉ** ; aucun rollback réseau autoritaire n’est revendiqué.
- Retransmission client toutes les 1,5 secondes tant que l’ACK manque, avec le même identifiant ; suppression des doubles événements et ledger d’attaque empêchent une seconde application.

## C. Tests et périmètre

Chromium réel, plusieurs pages/contexts, viewport paysage 1180×820. Clics, saisies, dialogs, choix Bibliothèque, animations, MJ Touché/Raté/JdS/Fin de tour, reload et déconnexion sont utilisés. Les lectures DOM/state servent aux assertions ; aucun participant ni événement de jeu n’est injecté. Le proxy copie uniquement des trames réellement produites et perd volontairement les premiers ACK. Les anciens tests audit/e2e.mjs hybrides ne servent pas de preuve des trois combats.

| Contrôle | Statut | Résultat / limite |
|---|---|---|
| Trois combats distincts sur le premier commit final publié | TESTÉ E2E ET PASSÉ | 208 assertions, aucun échec ni erreur JS sur le run complet antérieur |
| Rejeu complet après dernier correctif individuel | NON TESTÉ | Rejeu commencé, interrompu pendant combat 2 par indisponibilité de l’environnement ; ne constitue pas un passage complet |
| Validation individuelle, ACK retardé, reconnexion Brack et fallback réel d’image | TESTÉ E2E ET PASSÉ | 9 contrôles ciblés sur le correctif de reprise |
| Baseline validation individuelle | TESTÉ E2E ET ÉCHOUÉ | Brack affichait validée après validation de Kentaro uniquement |
| Reset attaques, Fin de tour, trois JdS, initiatives ouvertes ; PV/ressources préservés | TESTÉ E2E ET PASSÉ | 40 contrôles, dernier rejeu terminé après le correctif individuel |
| Mode autonome des six Companions | TESTÉ E2E ET PASSÉ | 14 contrôles, attaque native et résolution locale, sans RPG Connect |
| Contrats serveur/MJ, bridges six personnages, registre d’icônes | TESTÉ HORS E2E | 5 + 7 + 4 tests passent |
| Initiative manuelle, bonus, jet normal, demandes simultanées après Reset | TESTÉ E2E ET PASSÉ | Vérifiés dans les combats de la version publiée |
| Initiative et validation persistées, round/tour/pending conservés | TESTÉ E2E ET PASSÉ | Reload Encounter et Rufus ; reconnexion Nans suivant hors ligne |
| Touché/Raté, critique, bonus Kentaro, composants mixtes | TESTÉ E2E ET PASSÉ | Native UI + décisions MJ |
| Résistance froid, immunité poison, vulnérabilité contondant, PV temp | TESTÉ E2E ET PASSÉ | Combat 2, calculs Encounter |
| Duplications d’événements et commandes, pertes d’ACK | TESTÉ E2E ET PASSÉ | Initiatives, dégâts, JdS, tours et dégâts/soins joueurs appliqués une seule fois |
| Élimination exacte à zéro / dégâts excédentaires / retrait des cibles | TESTÉ E2E ET PASSÉ | Combats et sélections de deux Companions |
| Loup sanguinaire et autres icônes réellement rendues | TESTÉ E2E ET PASSÉ | Images décodées, captures inspectées, fiche/liste/cibles |
| Fallback après erreur réseau réelle de giant.png | TESTÉ E2E ET PASSÉ | Route navigateur avortée, SVG chargé puis image normale restaurée |
| Vue paysage proche iPad | TESTÉ E2E ET PASSÉ | Viewport navigateur uniquement, pas iPad physique |
| Vue mobile | TESTÉ E2E ET PASSÉ | Contrôle limité du bouton RPG à 390×844 ; pas audit exhaustif |
| iPad physique et gestures tactiles | NON TESTÉ | Aucun appareil physique |
| Toutes les capacités/sorts, concentration, expiration de tous états, undo réseau | NON TESTÉ | Seuls les pouvoirs décrits ci-dessous sont couverts |
| Redémarrage du processus serveur / perte de son stockage mémoire | NON TESTÉ | Reconnexions socket/reload couvertes, pas crash serveur |
| Reset d’un Companion durablement hors ligne | NON TESTÉ | Ne pas confondre avec Companion suivant hors ligne reconnecté |
| Saturation des files et retransmissions dépassant toutes les fenêtres de déduplication | NON TESTÉ | Limites de ledger non stressées jusqu’à expiration |
| Jeu authentifié sur Render avec les vrais clients publiés | NON TESTÉ | Tests utilisent serveur isolé et clés aléatoires éphémères |
| Health Render et correspondance HTTP Encounter publié | TESTÉ HORS E2E | Render LIVE et index conforme au commit publié |
| Smoke final sur la version publiée antérieure | TESTÉ E2E ET PASSÉ | Court scénario 3 par interface |
| Archive intermédiaire extraite, correspondance des fichiers et secrets | TESTÉ HORS E2E | 56 fichiers comparés, aucune détection de secret |
| Smoke depuis extraction intermédiaire | TESTÉ E2E ET PASSÉ | Serveur et assets Encounter importés depuis l’extraction |
| ZIP final incluant le dernier correctif de reprise | NON TESTÉ | Non construit ni livré ; environnement indisponible |

## D. Combat 1 — flux standard

Créatures différentes sélectionnées et ajoutées depuis la Bibliothèque : **Gobelin, Orc, Ogre**. Companions : **Kentaro et Brackmard**. Plusieurs tours, jusqu’au troisième round dans le run complet publié, moins de dix rounds.

Kentaro utilise une initiative manuelle 19 + bonus 2 = 21 ; Brack une initiative normale avec bonus 1. Les valeurs reçues sont visibles puis validées individuellement par le MJ. L’ordre réellement actif, la réception turn:grant et les boutons sont contrôlés.

Actions : attaque Kentaro ratée par décision MJ, attaque bonus Solinar critique sur Orc, attaques Brack normales/critique avec manœuvre de renversement, changement de cible, actions ennemies vers joueur. JdS : manœuvre Brack FOR DD17 ; Perturbations synaptiques Kentaro INT DD16, avec résolution MJ et état éventuel.

Éliminations du run complet : Gobelin, Orc, Ogre. Fin de tour refusée puis redemandée, ensuite acceptée ; passage aux participants suivants. Résultat : **TESTÉ E2E ET PASSÉ** sur la version publiée. Le dernier rejeu a terminé ce combat avant l’interruption ultérieure.

## E. Combat 2 — bestiaire, icônes et éliminations

Nouvelle rencontre depuis Bibliothèque : **Loup sanguinaire, Ombre, Squelette**. Companions : **Samoth et Zephyr**. Jusqu’à trois rounds dans le run complet publié.

Samoth : initiative manuelle 19 + 1 = 20. Zephyr : jet normal avec bonus −1 ; l’ordre réel dépend de ce jet et le test suit le véritable participant actif.

**Loup sanguinaire** : icône bête intacte, cadrée et centrée ; liste, aperçu/fiche et cible Companion contrôlés. Aucun hack fondé sur son nom. Ombre/Squelette utilisent les icônes mort-vivant cohérentes, sans image cassée.

Actions/JdS : Vortex de glace Samoth, DEX DD18 sur Ombre ; résistance froid et PV temporaires 5 configurés via interface MJ. Poison contre Squelette : immunité, aucun PV perdu. Contondant contre Squelette : vulnérabilité. Zephyr utilise son attaque et châtiment tonitruant, FOR DD16, dégâts composés et état. Deux Companions ciblent une même créature puis poursuivent sur les survivantes.

Éliminations du run complet : Loup sanguinaire, Ombre, Squelette. Cibles retirées, sélection morte absente, retour Companion reçu. Résultat : **TESTÉ E2E ET PASSÉ** sur la version publiée. Le dernier rejeu avait atteint le deuxième round avant la perte de l’environnement ; ce dernier rejeu complet est **NON TESTÉ**.

## F. Combat 3 — stress et reconnexions

Troisième rencontre depuis Bibliothèque : **Goule, Araignée géante, Vétéran**. Companions : **Rufus et Nans**. Trois rounds joués ; affichage round 4 atteint au moment de l’arrêt planifié, et non quatre rounds complets.

Rufus : initiative manuelle 19 + 3 = 22. Nans : initiative manuelle 12, choisie par saisie UI pour que le scénario « participant suivant hors ligne » soit déterministe. Un essai antérieur avec initiative naturelle 1 avait fait échouer l’hypothèse du test sur le prochain participant ; l’automatisation a été corrigée pour respecter l’ordre réel, sans mutation du state.

Reconnexions provoquées :
1. Reload Rufus et Encounter après réception des initiatives, avant validation : valeurs conservées.
2. Reload des deux après validation : initiatives et validations conservées.
3. Double clic Fin de tour Rufus puis reload des deux pendant la demande : pending, round, tour et initiatives identiques après reprise.
4. Nans explicitement déconnecté avant validation de la fin de tour Rufus : Encounter avance vers Nans hors ligne ; après rejoindre via UI, Nans reçoit son tour.
5. Reload Encounter pendant la résolution du JdS Nans : dialog restauré, résolution normale.

Actions : dagues spectrales Rufus avec CON DD13 ; Cor Fracas Nans avec CON DD12 et réussite manuelle MJ 20, dégâts moitié ; attaques Nans sur Goule. Les trames réelles sont dupliquées et les ACK perdus volontairement ; assertions sur application unique des dégâts, soins et passages de tour.

Éliminations après reconnexion : Goule ; puis Araignée géante amenée exactement à 0 PV par le contrôle natif de dégâts MJ, avec popup visible et retrait des listes des deux Companions. Vétéran restant : arrêt planifié après couverture des scénarios. Résultat : **TESTÉ E2E ET PASSÉ** sur la version publiée. Aucun rejeu complet du combat 3 après le dernier correctif individuel : **NON TESTÉ**.

## G. Matrice des six Companions

Cette matrice décrit les trois combats complets de la version publiée ; elle ne transforme pas le rejeu final interrompu en succès.

| Companion | Connexion et présence | Initiative / validation MJ | Turn grant | Action/attaque | JdS pertinent | Fin de tour / passage suivant | Reconnexion | Résultat |
|---|---|---|---|---|---|---|---|---|
| Kentaro | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — synaptiques | TESTÉ E2E ET PASSÉ | NON TESTÉ | Flux essentiel passé ; défaut individuel global connu sur main |
| Brackmard | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — trip | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — test ciblé de reprise | Flux essentiel passé |
| Zephyr | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — tonitruant | TESTÉ E2E ET PASSÉ | NON TESTÉ | Flux essentiel passé |
| Rufus | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — spectral | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | Flux essentiel passé |
| Samoth | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — vortex | TESTÉ E2E ET PASSÉ | NON TESTÉ | Flux essentiel passé |
| Nans | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ — Cor Fracas | TESTÉ E2E ET PASSÉ | TESTÉ E2E ET PASSÉ | Flux essentiel passé |

## Archive et reprise nécessaire

L’archive intermédiaire correspondait au commit Encounter 40ca97bb337fdb9fdd6a78cb08c91d4971f1c8e4, 56 fichiers, 5 617 085 octets, SHA256 727dc3c78491846b117176cc782d78929f900491788760ad9f6e55ac77878bc5. Elle excluait .git, node_modules, audit, workflows, tests, caches, captures et fichiers temporaires ; aucun secret/token/clé MJ détecté. Les octets extraits correspondaient au commit, et le smoke depuis extraction passait.

**Ce ZIP est désormais supersédé par le correctif individuel non encore livré.** Il ne faut pas le renommer ou le présenter comme version finale stable.

Pour terminer : récupérer les sept branches de reprise, réintégrer le test individuel (validation de Kentaro sans valider Brack ; ACK retardé ; fallback réseau et reload Brack), rejouer les trois combats et les scénarios Reset/autonome, contrôler les captures, promouvoir seulement les versions passées, puis effectuer smoke/ZIP/extraction/smoke exacts et livrer le fichier.
