# Encounter — préparation, tours d’invocation et assistant de fiches

Mission du 7 octobre 2026. Bases auditées : Encounter `b6bd796`, Kentaro `4be7b6c`, Samoth `17f0530`. Le travail porte sur Encounter, Kentaro et Samoth. Aucun changement requis dans RPG-Connect, Brackmard, Zephyr, Rufus ou Nans.

## Responsabilités conservées

- **Encounter** conserve l’autorité sur le combat : participants, ordre, rounds, demandes, décisions du MJ, dégâts réels, défenses, PV, états et cycle de vie des invocations.
- **Serveur / bus** : dans cette version des dépôts, `rpg-connect-server.js` est hébergé dans Encounter. Le dépôt RPG-Connect contient les ressources partagées, notamment les icônes. Le protocole existant reste utilisable sans modification du serveur.
- **Companions** : règles individuelles, ressources, jets de sauvegarde et animation des dés. Kentaro et Samoth pilotent également leur invocation distincte ; ils ne déterminent pas les PV réels des ennemis.

## Comportement constaté avant / livré après

| Parcours | Avant, reproduit en navigateur sur le commit de base | Après |
|---|---|---|
| Changement simple vers l’écran Préparation | Conservait déjà round, tour et initiatives PNJ. Le « bug des initiatives PNJ remises à zéro » n’a pas été confirmé. | Conservation maintenue ; le statut du fight reste la référence. |
| Nouvelle pression sur Prépa Fight pendant le combat | Relançait la préparation, remettait round et curseur à 1 / au premier participant, et supprimait des demandes. | Consulte la préparation, sans relancer l’initiative ni supprimer une résolution en attente. |
| Reprendre le fight | Le parcours pouvait repasser par une nouvelle préparation. | Bouton explicite, même round, même participant actif, mêmes initiatives et PV. |
| Ajout d’un adversaire à forte initiative | Réinitialisait le curseur au premier participant. | Ordre du round actuel conservé. Le renfort est présent et son premier tour est au round suivant, indiqué dans la fenêtre et sa ligne. |
| Correction d’initiative | Retri et retour au premier participant immédiats. | Confirmation indiquant la modification ; nouvel ordre au prochain round. Le tour courant reste inchangé. |
| Nouvelle phase | Risque de remplacer la rencontre en utilisant la préparation. | Ajout de renforts ennemis ou alliés dans le même fight. Chargement d’une autre rencontre / nouvelle rencontre / import de rencontre bloqués tant que le fight reste actif. |
| Redémarrage | « Reset combat », accessible également depuis un JdS. | « Recommencer le fight », distinct de la consultation, avec confirmation pendant un fight. Les PV sont conservés, conformément au reset existant. |
| Tours d’invocation | Participants distincts déjà présents, mais fin de tour et ruban pouvaient annoncer seulement le propriétaire. | Le ruban, bouton, demande et validation désignent l’invocation. Identifiant du participant et round transportés ; refus / clôture tardifs d’un autre tour ignorés et acquittés. |
| Invocation retirée / éliminée | Demande et affichage pouvaient rester associés au propriétaire ou au participant retiré. | Demande de l’entité retirée annulée ; participant suivant et propriétaire concernés resynchronisés. |

L’initiative retenue pour les invocations est conservée : même valeur que le propriétaire, puis tour immédiatement après lui. Aucun jet d’initiative supplémentaire. Fermer le tour d’une invocation ne réinitialise plus le tour personnel du PJ.

Une modification d’un modèle lié à un fight demande une confirmation précisant que ses capacités et défenses seront actualisées ; PV, CA d’instance, états, initiative et position du tour sont conservés.

## Assistant dans la Bibliothèque

L’entrée **Assistant de fiches** intervient pendant la préparation de séance, avant la composition du fight.

1. Fiche existante, saisie manuelle ou texte collé. Édition 2014 / 2024 / à confirmer. Aucune conversion automatique d’une édition vers l’autre et aucun import par URL.
2. Proposition conservatrice, texte source conservé, validation MJ non cochée par défaut. Classes : attaque, vrai sort, JdS direct, JdS sur touche, réaction, recharge, ressource, action légendaire ou effet descriptif.
3. Correction des caractéristiques, JdS du monstre, défenses, dégâts, bonus, DD, niveau du sort et informations de déclenchement, cibles, état, durée et fin. Un niveau de sort est proposé uniquement pour un vrai sort. Un JdS uniquement textuel est signalé comme non connecté.
4. Essai isolé sur 1 à 6 cibles fictives : toucher / raté, Contresort simulé, demande à un Companion fictif, dé 3D partagé, résultat, dégâts effectifs, défenses et PV temporaires fictifs, état et intervention MJ. Aucun message de l’essai n’est envoyé aux joueurs connectés. Les PV et demandes du vrai fight restent inchangés.
5. Bilan par capacité : automatisée / décision MJ nécessaire / information manquante. La fiche enregistrée reste éditable dans l’assistant et l’éditeur existant, et peut être ajoutée depuis la Bibliothèque.

L’essai réutilise le moteur de dés des Companions, `RPGPlayerSaveAuthority.damage` et `resolveDamageAmount` d’Encounter. Sans moteur 3D disponible, l’interface annonce l’animation simplifiée. Le bilan ne promet pas une prise en charge universelle des fiches AideDD.

### Limites visibles et manuelles

- L’extraction est une proposition à relire ; les mises en page complexes, attaques multiples, ressources liées ou déclencheurs complexes peuvent demander une saisie manuelle.
- Portée, zone réellement touchée, cibles, déclenchement des réactions / actions légendaires et coûts particuliers restent sous contrôle du MJ.
- Un état sur JdS sur touche peut être appliqué automatiquement ; son retrait / sa fin non structurés restent une décision MJ, explicitement indiquée dans le bilan.
- Les états simplement décrits dans un JdS direct, les durées et fins décrites restent manuels. Ils ne deviennent pas connectés du seul fait de coller du texte.
- La prévisualisation simule un Companion fictif ; elle ne contacte pas les Companions réels. Les parcours connectés des fiches enregistrées ont été testés séparément avec les véritables Companions et le serveur WebSocket.

## Données locales et compatibilité

Migration additive, sans remplacement des identifiants personnalisés. Les métadonnées de l’assistant et l’édition sont conservées par la normalisation et par l’éditeur existant. Les anciennes données reçoivent des valeurs par défaut compatibles.

Au premier chargement d’une ancienne sauvegarde, une copie exacte est ajoutée aux backups existants avant normalisation. Un test vérifie conservation des fiches personnalisées, du round, des PV, de l’état et d’un JdS en attente. Si le stockage refuse un nouveau backup, l’erreur ne provoque pas l’effacement des données chargées. L’ordre du round et le round d’entrée des renforts sont persistés.

Les versions des scripts et du service worker sont avancées. Les anciens clients sans `participantId` restent acceptés pour le tour personnel ; les tours d’invocation exigent l’identifiant explicite envoyé par Kentaro / Samoth mis à jour.

## Fichiers modifiés

| Dépôt | Fichiers |
|---|---|
| Encounter — combat et interface | `app.js`, `rpg-connect-mj.js`, `rpg-connect-mj.css`, `rpg-save-authority.js`, `index.html`, `styles.css`, `service-worker.js` |
| Encounter — assistant | `monster-assistant.js`, `monster-assistant-ui.js`, `assistant-dice-engine.js`, `assistant-dice.css` |
| Encounter — vérifications et documentation | `README.md`, `package.json`, `fight-continuity.test.js`, `monster-assistant.test.js`, `audit/mission-browser.mjs`, `audit/mission-baseline-browser.mjs`, `audit/health-regression-browser.mjs`, `audit/multi-target-browser.mjs`, ce rapport et le bilan JSON associé |
| Kentaro | `rpg-connect-client.js`, `index.html` |
| Samoth | `rpg-connect-client.js`, `index.html` |

## Vérifications

Les scénarios navigateur utilisent Chromium réel, le serveur WebSocket isolé, la console MJ et les pages réelles des Companions. Les ajustements de jets / PV sont des fixtures de test ; les commandes, demandes, animations et décisions empruntent les flux de production.

- Baseline : 4 contrôles reproduisant la conservation lors du simple changement d’écran, le reset lors d’une nouvelle Prépa Fight, les initiatives PNJ non remises à zéro et le changement de tour induit par un renfort.
- Tests automatisés : 151 contrôles de règles / autorité / migration ; 7 contrôles des clients et bridges.
- Mission ciblée : 42 contrôles, zéro erreur de page. Comprend les trois profils créés dans l’assistant, dé 3D fictif, invariance du vrai fight, exécution connectée du Loup enregistré et du vrai sort enregistré, demandes et refus de fin de tour, rafraîchissement des deux côtés, renforts, correction différée, deuxième phase, élimination, retrait manuel et clôture tardive de l’invocation lorsque le PJ joue.
- Trois combats complets / six Companions : 55 contrôles, zéro erreur de page ; combats terminés en 4, 4 et 5 rounds. Comprend concentration, pénalité de jet, Armure d’Agathys, attaques d’opportunité, réactions, Contresort réussi / échoué, JdS de PJ, reconnexions, actions légendaires, repaire, phases de boss, dégâts et élimination.
- Soins connectés : 5 contrôles, zéro erreur de page. Second souffle, Imposition des mains sur allié sans Companion, Soin des blessures et consommation de la ressource, puis conservation des PV lors d’une consultation de la préparation.
- Contrôle multicible : 40 contrôles validés, incluant annulation de la confirmation et redémarrage confirmé pendant un JdS. Icônes : 4 tests validés. Bilan final dans `PREPARATION-SUMMONS-ASSISTANT-20261007.json`.

Corrections issues des vérifications : masquage du niveau de sort non magique malgré un style de label, bouton de fin de tour du dragon, commandes de reprise couvertes par la demande en attente. Les scénarios concernés ont été relancés. Le test multicible existant a été adapté à la fermeture déjà automatique de la fenêtre FIGHT et à la confirmation explicite du redémarrage.

Ergonomie contrôlée en Chromium aux dimensions paysage 1180 × 820 et 1280 × 800 : taille et défilement de l’assistant, boutons accessibles, demandes MJ et reprise. **Pas de contrôle effectué sur du matériel iPad / Samsung physique ni sur Safari iOS.**

Les dépendances Three.js ont été servies au navigateur depuis la même version `0.186.1` pour rendre les tests reproductibles dans l’environnement réseau restreint. Le moteur de production garde le mécanisme d’import déjà utilisé par les Companions. Les scripts d’audit existants utilisent les fichiers de cette version dans `browser-deps` à côté des dépôts et `CHROMIUM_PATH` si nécessaire.

## Publication

La publication vise uniquement main d’Encounter, Kentaro et Samoth après validation. Les identifiants complets des commits distants sont fournis dans le compte rendu de livraison. Aucun secret ni trame contenant une invitation n’est ajouté au dépôt ; le bilan JSON conserve seulement les résultats et vérifications.
