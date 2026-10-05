# Rapport de tests multi-cible — 5 octobre 2026

**Verdict : READY FOR MANUAL USER TEST.**

L’intégration existante a été reprise, exécutée dans un vrai Chromium et corrigée uniquement sur des défauts reproduits. Les fichiers de règles, les formules de dégâts, les ressources et les coûts d’action des personnages n’ont pas été changés. Les modifications de Samoth et Nans concernent le mode de sélection des cibles dans leur interface.

**main n’a pas été modifiée. Aucun merge n’a été effectué.** Toutes les publications concernent `feature/multi-target-2026-10-05`.

## A. Commits récupérés et testés

| Dépôt | HEAD récupéré au début |
| --- | --- |
| Encounter | c0ca155162edadb5f740dc970c2f40bab900093a |
| RPG-Connect | c117b408816a0f52a08449d6fa5554d94794c0b4 |
| Kentaro | 9169773df6a7a906e271a3d036ca07695fa7eea3 |
| Brackmard | cf7499cdb5ef28ee9fc5e944cf2b124eb41d9c5c |
| Zephyr | e9874128c1558f5941372e5c2cf66033eda13d14 |
| Rufus | 5df70ccb10dbb517b54c8371aa6872b3cacff89c |
| Samoth | 186e3497ca1a9eeeb566834863d51daf575a82ea |
| Nans | 39356ca27e337d269a3f2cebceafcc9b5485bb68 |

Les huit checkouts étaient propres. Le manifest correspondait aux six Companions et aux assets RPG-Connect. Son entrée Encounter était une référence historique `70bc685…` ; les tests ont bien utilisé le HEAD demandé `c0ca155…`, puis les correctifs décrits ci-dessous.

Le serveur WebSocket est actuellement dans Encounter (`rpg-connect-server.js`). Le dépôt RPG-Connect apporte ici les assets partagés. Les pages Encounter et Companions ont été servies localement avec les assets RPG-Connect locaux : le vrai transport WebSocket et le vrai code de production ont été utilisés, sans dépendre du runner GitHub Actions ni du serveur de la table en production.

## B. Tests automatisés

| Commande | Première exécution | Exécution finale |
| --- | --- | --- |
| `npm test` | 19/20 ; attente d’une décision MJ dans le nouveau test multi-attaque | **21/21** |
| `npm run test:companions` | 7/7 | **7/7** |
| `npm run test:icons` | 4/4 | **4/4** |

Soit **32 tests automatisés réussis**. La suite MJ inclut désormais les régressions d’identité de cible, de verrou d’attaque, de réutilisation d’action et d’undo périmé. Un test supplémentaire vérifie l’annulation d’une action JDS partiellement résolue. Les tests des Companions vérifient que changer le mode de sélection ne dépense ni ressource ni économie d’action.

Le premier blocage du test multi-attaque provenait du script : il cliquait sur le bouton désactivé de l’attaque précédente avant l’arrivée de la popup suivante. Il attend maintenant le bon `attackId`. Les attentes de texte d’undo et de PV après restauration ont aussi été corrigées. Ce défaut de test a été distingué des bugs de production.

## C. Tests dans Chromium

Environnement : **Chromium 153 headless, Playwright 1.62.1**, serveur HTTP local, serveur WebSocket isolé, contextes navigateur distincts, capture des trames réseau, traces Playwright et captures d’écran. Le téléchargement standard de Chromium a échoué ; un véritable binaire Chromium a été installé par une autre distribution locale. Les animations de dés de production sont restées actives et ont été fermées comme par un joueur.

| Suite | Résultat final | Nature du test |
| --- | --- | --- |
| `audit/e2e.mjs` | **93 contrôles réussis**, aucune erreur JavaScript non interceptée | Suite existante sur les six Companions ; interfaces et fixtures contrôlées |
| `audit/multi-target-browser.mjs` | **39 contrôles + 3 sondes réussis**, aucune erreur JavaScript non interceptée | Vortex natif, sélection visuelle, reconnexion, undo, attaques génériques et événements de robustesse |
| `audit/five-round-browser.mjs` | **115 contrôles réussis**, aucune erreur JavaScript non interceptée | Cinq rounds complets Samoth/Zéphyr, par les interfaces |
| `audit/combats-e2e.mjs`, scénario 3 | **117 contrôles réussis**, aucune erreur JavaScript non interceptée | Cinq rounds Rufus/Nans, par les interfaces, avec doublons et pertes d’ACK provoqués |

Les tests hybrides ne sont pas présentés comme des clics natifs de bout en bout. Les attaques génériques à deux `attackId` utilisent un pair de protocole dans Chromium qui émet des événements puis acquitte les décisions MJ. Cela teste réellement le transport et Encounter sans inventer une capacité native de personnage ni modifier ses règles. Les événements invalides, retransmissions et fixtures R/I/V sont également injectés intentionnellement pour les sondes de robustesse.

Les scripts existants ont été adaptés aux changements déjà présents dans l’intégration : une popup JDS multi-cible reste ouverte pour la résolution suivante ; une popup d’initiative se ferme automatiquement ; le choix d’une capacité de zone doit préparer son sélecteur avant le choix des cibles. Les captures ont reçu un délai adapté à ce Chromium.

## D. Scénarios exacts

### Action multi-cible isolée

Samoth et Kentaro rejoignent une salle. Le MJ prépare, reçoit et valide leurs initiatives, puis commence le combat. Samoth sélectionne visuellement trois adversaires contrôlés : Loup sanguinaire, Gobelin et Élémentaire de glace. Le Loup a 1 PV, 2 PV temporaires et une résistance au froid ; le Gobelin a des PV temporaires ; l’Élémentaire est immunisé au froid.

Samoth lance son **Vortex de glace natif** : un événement `save:request`, trois références dans `targets[]`, un `actionId`, DD 18 et un seul jet de dégâts commun. Les JDS manuels sont 1, 20, 1, avec les modificateurs propres 2, 4, 1. Le Loup meurt lors de la première résolution. Samoth est déconnecté et reconnecté avant les deux suivantes ; les commandes de synchronisation et les résolutions restantes passent. Le Gobelin réussit et reçoit la moitié ; l’Élémentaire reçoit zéro dégât de froid. L’action locale est dépensée une seule fois.

Le même événement logique est retransmis sous un nouvel `eventId` : aucun double dégât, aucune seconde consommation locale. L’undo natif de Samoth restaure les PV, PV temporaires et conditions des trois cibles.

Deux attaques génériques, A vers le Loup et B vers le Gobelin, partagent ensuite un `actionId`. Chaque popup est validée indépendamment. A tue sa cible sans empêcher B. Les dégâts de B retransmis avec la cible A ne sont pas réappliqués. Un seul `action:undo-request` restaure les deux cibles. Une autre sonde retransmet un jet d’attaque avec un nouvel `eventId` et un autre `targetId` avant les dégâts : le verrou conserve maintenant la cible originale.

Les sondes suivantes vérifient l’undo en pleine résolution, la réutilisation d’un `actionId` avec un nouveau `saveId`, les conditions et leur immunité, résistance et vulnérabilité combinées, PV temporaires, désavantage propre à une cible, annulation avantage/désavantage indépendante, cible inexistante, cible supprimée en cours de résolution et reset pendant un JDS. La sélection est effacée après reset ; le catalogue des créatures préparées peut rester disponible.

### Combat Samoth/Zéphyr — cinq rounds complets

Les créatures sont ajoutées depuis la bibliothèque par l’interface : **Loup sanguinaire, Ombre, Squelette**. Pour que le combat dure cinq rounds, la fiche locale d’Ombre est préparée à **1 000 PV et résistance au froid par l’éditeur MJ**. C’est une fixture de durée, pas une modification du dépôt de bestiaire ni des règles des PJ. L’Ombre reçoit aussi 5 PV temporaires par l’interface. L’immunité au poison du Squelette est vérifiée avant le combat.

| Round | Actions réellement jouées |
| --- | --- |
| 1 | Vortex de Samoth sur les trois cibles, trois JDS indépendants ; attaque de Zéphyr sur le Squelette, châtiment/JDS ; Squelette éliminé ; actions d’adversaires vers Samoth |
| 2 | Rayon de givre de Samoth sur l’Ombre, volontairement déclaré raté par le MJ ; attaque de Zéphyr sur l’Ombre |
| 3 | Rayon de Samoth et attaque de Zéphyr ; rechargement de Samoth et d’Encounter, reconnexion et conservation du tour actif |
| 4 | Rayon de Samoth puis undo natif ; attaque de Zéphyr ; poursuite normale du cycle de tours |
| 5 | Rayon de Samoth et attaque de Zéphyr ; critiques via jets manuels de 20 ; fins de tour validées et arrivée au round 6 |

Il y a dix actions de PJ, dont le Vortex produit trois résultats de sauvegarde. Après les cinq rounds : dégâts et soins MJ vers les deux Companions, reset, nouvelle préparation et initiatives simultanées. Les résistances, PV temporaires, états, journal et trames ont été contrôlés. Des copies de trames réelles et des pertes d’ACK ont été provoquées par le proxy de test.

### Combat Rufus/Nans — cinq rounds

Bibliothèque : **Goule, Araignée géante, Vétéran**. Rufus utilise son attaque spectrale ; Nans utilise le Fracas du Cor puis ses attaques. Le MJ est rechargé pendant un JDS en attente ; les initiatives et le combat sont conservés. Une fin de tour est demandée puis les pages sont reconnectées ; le Companion suivant est déconnecté et reconnecté, puis reçoit bien son tour. Les attaques des rounds suivants comprennent des critiques et des changements de cible. À la fin, les trois adversaires sont éliminés ; l’interface d’élimination exacte à 0 PV, le retrait des cibles attaquables, les soins, le reset et la nouvelle préparation passent.

## E–G. Bugs trouvés, causes et corrections

| Défaut reproduit | Cause | Correction et preuve |
| --- | --- | --- |
| Popup MJ sans nom/CA lorsque seul `targetId` est fourni | L’affichage lisait seulement l’objet `payload.target` | Lecture du participant verrouillé dans Encounter ; vérifications de nom et CA dans JSDOM et Chromium |
| Undo partiel suivi de dégâts tardifs | Les snapshots étaient restaurés, mais la file de JDS restait active | Annulation des résolutions restantes, fermeture de popup, persistance et rejet des événements d’action annulée ; test et rejeu navigateur |
| Dégâts déplacés vers une autre cible après retransmission d’un jet | Un `attackId` existant pouvait remplacer son verrou de cible | Verrou immuable, jet déjà connu ignoré et validation calée sur le verrou ; test avec dégâts retardés et cible contradictoire |
| Deuxième JDS sous le même `actionId` avec un nouveau `saveId` | La déduplication portait sur l’identifiant de sauvegarde, sans vérifier l’identité de l’action enregistrée | Validation de la transaction logique ; nouvelle sauvegarde incompatible refusée ; contrôle d’absence de nouvelle mutation |
| Retour d’une capacité de zone à une attaque restant en multi-cible | Le mode du sélecteur survivait au changement de sort/onglet | Samoth prépare le mode au choix du sort ; Nans repasse en mono-cible à l’ouverture d’Attaques ; tests sans consommation de ressource et vérification de la cible réellement envoyée |
| Undo d’un ancien combat agissant sur le combat actuel | La branche undo précédait le contrôle du `combatId` | Contrôle de combat avant l’undo ; test reproduisant puis empêchant la restauration périmée |

## H. Commits publiés

| Dépôt | Commit de correction publié |
| --- | --- |
| Encounter | d40e15087d355cdee4a625242d8f3e5ed6c46e29 |
| Samoth | d5b7f1b782b808b375096a9845fc323ab704b965 |
| Nans | a6174c7d83ab5a4d24d1a157819a3963cee68e04 |

Les cinq autres dépôts sont inchangés. Le manifest Encounter référence les nouveaux SHA et arbres de Samoth et Nans.

Le push Git classique n’avait pas d’identifiant d’écriture dans cet environnement. La publication a été faite par la connexion GitHub, sans forcer de ref. Les commits publiés ont été récupérés et leur contenu comparé aux commits locaux testés. Les commits locaux `51537f8`, `9068b24`, `c159d64` et `2141182` sont conservés dans des branches locales d’audit ; aucun travail n’a été supprimé. Le commit de rapport ajoute ce document et la variante du scénario de cinq rounds avec l’attaque ratée volontaire, sans changer le code de production testé.

## I. Résultats finaux

Les flux testés passent : création/jointure de salle, préparation, initiative et validation MJ, combat/tours, attaques et Touché/Raté, dégâts, JDS, états, R/I/V, PV temporaires, mort, changement de cible, journal/rubans, dialogues de repos, undo, reconnexion, synchronisation et reset.

La sélection visuelle et son compteur ont été vérifiés, ainsi que les vignettes et les popups effectivement au premier plan. Encounter et Samoth ont été contrôlés à 768 × 1 024 ; aucune largeur de page hors écran. La suite existante vérifie aussi des vues mobiles et les rubans des six Companions. Aucun blocage JavaScript non intercepté n’a été observé dans les exécutions finales.

## J. Limites et risques résiduels

- La validation concerne les versions de branche exécutées localement. Elle ne remplace pas un test de la table réelle avec Render, son réseau et ses invitations.
- Le navigateur est Chromium headless, pas Safari sur un iPad physique. L’observation à 768 px ne certifie pas tous les formats de tablettes ni toutes les interactions tactiles.
- Les attaques génériques à action commune sont testées par injection de protocole ; elles ne constituent pas une nouvelle capacité native multi-attaque livrée à un personnage.
- L’undo a été contrôlé sur une action complète et une action partielle. L’annulation d’une action ancienne après plusieurs actions tierces concurrentes sur les mêmes cibles n’est pas couverte par cette campagne ; aucun rollback causal généralisé n’est certifié ici.
- Les contrôles de robustesse sont une campagne ciblée, pas une preuve exhaustive sur toutes les capacités, toutes les créatures et des sessions de très longue durée.

## K–L. Confirmation et verdict

**main n’a pas été modifiée. Aucun merge n’a été effectué.**

**READY FOR MANUAL USER TEST**, sur `feature/multi-target-2026-10-05`. Aucune fusion vers main n’est autorisée ou effectuée ; la prochaine étape est le test manuel de Bryan/MJ sur ces versions.
