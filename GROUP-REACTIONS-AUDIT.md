# Groupe, ressources natives et réactions liées — audit du 7 octobre 2026

## Base et mécanismes réutilisés

Les huit `main` ont été lus et comparés aux références GitHub au démarrage puis avant livraison. La tranche journal/annulation est effectivement présente : `mj-journal.js`, `MJJournalModel` et `rpg-undo.js` fournissent les patches limités aux mutations, les tombstones durables et les phases prepare/commit/finalize/abort. Cette tranche étend ces points et les transactions `rpg-reaction-authority.js` / `rpg-reactions.js`, sans deuxième journal ni remboursement autonome.

| Dépôt | main audité |
|---|---|
| Encounter | `1752ec60250b746190b7e4eafdf4263903868a63` |
| RPG-Connect | `c117b408816a0f52a08449d6fa5554d94794c0b4` |
| Kentaro | `32e7c9436ab900481bf4bb812c759ccfcfabdabd` |
| Samoth | `186d1ef8583a483ab206b0713c45591ac8642436` |
| Brackmard | `d73747718b14a0742f7d1b797caf554f4720e8ed` |
| Zephyr | `8f4bf9aad03528b58eba81437d51f7e7a050756b` |
| Rufus | `8b497355b2dd9f11bb07e29bcb83c55d2b17085d` |
| Nans | `7781b3d63b18a13cdf56a7ba884ee80fb97dbfc9` |

## Responsabilités et ressources

Le moteur natif vérifie et dépense. `CompanionAPI` observe les différences et émet `resource:changed`; la connexion envoie les états et intentions au MJ. Encounter journalise ces changements mais ne les transforme pas en compteurs de personnage. Les compteurs restent persistés et restaurés par le Companion, y compris lors d'un repos natif. `resource:set` conserve ses commandes natives existantes.

| Companion | Champs de ressources observés par le transport |
|---|---|
| Kentaro | slots, curseReady, biteReady, stoneReady, ring |
| Samoth | slots, sorceryPoints, featPoints, wings, staffCharges, cureFree, flame, vial, hitDice |
| Brack | superiorityDice, fougue, secondWind, indomitable, breath, hitDice |
| Zéphyr | slots, layOnHands, channel, arrows, binahChromatic, binahWall, sense, decree, anchor, binahMue |
| Rufus | psiDie, lucky, hexCharges, psiReconstitutionReady, ravenShadow, pilgrim, judgment, fireBladeReady, visionUses |
| Nans | rages, horn, voltoEnergy, voltoStored, barkReady, capeReady, ancReady |

« Observé » signifie transmis au MJ, pas exposé aux autres joueurs ni modifiable dans Encounter. Inventaires, notes, configurations, maxima, choix de manœuvre et règles d'éligibilité restent natifs. Les emplacements de pacte de Kentaro sont ses `slots` natifs. Frénésie de Nans reste son état/règle natifs, sans nouveau compteur réseau. Les drapeaux et économies consommés par une action connectée peuvent être inclus dans son patch local d'annulation, sans devenir des ressources publiques.

Samoth consommait auparavant le slot et la métamagie après la décision Touché/Raté. La consommation intervient désormais après validation de la configuration et avant le jet/la décision : raté, JdS réussi ou dégâts nuls ne remboursent pas le lancement. Une saisie locale annulée avant lancement restaure la capture native.

## Composant Groupe

`rpg-group.js` est canonique dans RPG-Connect et copié identiquement dans les six clients statiques. Un bouton compact dans la barre d'outils Combat ouvre un dialogue de portraits; un tap ouvre la fiche tactique. Le HUD reste conservé. La surface accepte `min/max`, `excludeSelf`, `playersOnly`, `companionsOnly`, `allowNPC`, `allowSummons`, `consciousOnly`, `reactionRequired`, `lifeStatus`, `filter`. Les capacités décident de leurs contraintes.

Seuls id, nom, portrait, rôle/type, propriétaire, identité Companion, statut vital, PV/PV temporaires, CA partagée, réaction, concentration, états et tour actif sont copiés. Ennemis, inventaires et ressources privées sont exclus. `RPGHealth.choose` utilise maintenant ce même sélecteur : soins, Imposition, Aide, Ancre et capacités déjà reliées à cette API. Les révisions et epochs refusent les anciens snapshots. Une sélection devenue invalide est retirée avant validation. Une mise à jour identique ne remplace pas les cartes sous le doigt.

## Opportunités

Le bouton et les attaques existantes de Rufus et Brack restent la référence. Kentaro appelle Solinar natif en mode réaction; Zéphyr appelle son attaque native avec économie de réaction; Nans utilise `beginAttack('reaction',false)`. Le protocole reste intent → request/options → claim → grant → jet natif → décision Encounter → dégâts natifs → resolve/closed. Le refus ou une cible devenue invalide avant grant ne consomme rien. Le ledger durable interdit un deuxième jet lors d'une réémission du grant.

**Limite Samoth :** son main ne contient aucun moteur d'attaque d'arme personnel. Ses sorts et le souffle de son dragon ne constituent pas une attaque d'opportunité native. Le bouton indique donc cette incompatibilité et reste désactivé. Aucun profil d'arme ni bonus n'a été inventé; Instruction est également indisponible sur ce client tant qu'une attaque d'arme native compatible n'existe pas.

## Instruction

La règle native auditée dépense immédiatement une attaque, l'action bonus et un d10 de supériorité, avant tout accord de l'allié. Cette règle est conservée en cas de Passer ou d'annulation du choix. Brack ouvre Groupe sur un allié Companion conscient disposant d'une réaction. Encounter vérifie l'état partagé à l'envoi et avant grant, dans la transaction générique. L'allié voit « Instruction de Brack », Accepter/Passer; Accepter ouvre le choix de l'ennemi avant claim.

Le moteur de l'allié exécute sa vraie attaque. Le d10 déjà lancé par Brack et un deuxième d10 natif fourni pour un éventuel critique sont persistés dans la transaction. Sur touche seulement, le client ajoute un unique composant « Instruction de Brack » : un dé normalement, deux sur critique. Le destinataire ne les relance jamais. Rufus conserve intégralement `sneakEligible`/`sneakBucket`, ses compteurs de tour et ses dégâts natifs; aucune Sournoise n'est calculée dans Encounter.

## Diversion et autres manœuvres

La manœuvre native n'applique Diversion qu'après une touche et sa dépense native. Encounter attache `nextAllyAttack` à l'ennemi avec source, propriétaire et id de séquence. Une attaque alliée réserve atomiquement cet effet avant le jet (grant générique pour une réaction, `attack:prepare/attack:grant` pour une attaque ordinaire), afin que le moteur natif obtienne réellement l'avantage. Deux réservations ne peuvent pas bénéficier du même effet. Le jet consomme la réservation même en cas de raté; une préparation annulée la libère. Expiration au début du prochain tour de Brack ou si la cible est éliminée. Application, consommation et expiration utilisent le journal existant.

Croc-en-jambe, Menace et Poussée conservent leurs demandes de JdS natives et leur résolution partagée existante. Riposte et Sentinelle conservent leurs chemins natifs. Une Instruction de Brack utilise explicitement la réaction native sans appliquer la réduction de vitesse propre à son opportunité/Sentinelle.

## Journal et annulation

`rpg-resources.js` capture avant le handler natif, réserve dans `RPGUndo`, et transporte actionId/parentActionId/undoCapture. Les soins et attaques multicibles réutilisent le même root; chaque demande de JdS garde un saveId distinct. Instruction capture ses coûts avant la dépense sous ce même identifiant. Les grants, décisions, conséquences et états partagés rejoignent la même entrée; les ressources personnelles sont restaurées dans le client, les PV/états/réactions publics dans Encounter. Les confirmations, ACKs et tombstones existants empêchent les remboursements répétés et rejets tardifs.

Les refus d'annulation déjà présents restent : tour/round remplacé, mutation ultérieure incompatible, origine non certifiée, concentration remplacée localement pendant la résolution, cycle de vie d'invocation/participant non certifié. Un effet partagé peut être restauré par les patches de conditions, mais la restauration d'une invocation n'est pas déclarée supportée. Aucun remboursement de secours n'est ajouté.

## Validation et fichiers

Voir `audit/group-browser.mjs`, `rpg-group-mission.test.js`, les tests de réactions/ressources/journal existants et `audit/e2e.mjs` (scénario sur cinq rounds complets puis fin et rechargement). Les tests couvrent des scènes réelles dans Chromium, pas uniquement des mocks. Les résultats sont générés dans les répertoires d'audit ignorés par git.

Fichiers modifiés par dépôt :

- **Encounter** : `audit/e2e.mjs`, `index.html`, `mj-journal.js`, `package.json`, `rpg-connect-mj.js`, `rpg-connect-mj.test.js`, `rpg-connect-server.js`, `rpg-participant-profiles.js`, `rpg-reaction-authority.js`, `audit/group-browser.mjs`, `rpg-diversion-authority.js`, `rpg-group-mission.test.js`.

- **RPG-Connect** : `rpg-group.js`, `rpg-instruction.js`, `rpg-native-reactions.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

- **Kentaro** : `companion-api.js`, `index.html`, `rpg-connect-client.js`, `rpg-health.js`, `rpg-multi-target.js`, `rpg-reactions.js`, `rpg-undo.js`, `rpg-group.js`, `rpg-instruction.js`, `rpg-native-reactions.js`, `rpg-opportunities.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

- **Samoth** : `companion-api.js`, `companion.js`, `index.html`, `rpg-connect-client.js`, `rpg-health.js`, `rpg-multi-target.js`, `rpg-reactions.js`, `rpg-undo.js`, `rpg-group.js`, `rpg-instruction.js`, `rpg-native-reactions.js`, `rpg-opportunities.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

- **Brackmard** : `companion-api.js`, `index.html`, `rpg-connect-client.js`, `rpg-health.js`, `rpg-multi-target.js`, `rpg-opportunities.js`, `rpg-reactions.js`, `rpg-undo.js`, `rpg-group.js`, `rpg-instruction.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

- **Zephyr** : `companion-api.js`, `index.html`, `rpg-connect-client.js`, `rpg-health.js`, `rpg-multi-target.js`, `rpg-reactions.js`, `rpg-undo.js`, `rpg-group.js`, `rpg-instruction.js`, `rpg-native-reactions.js`, `rpg-opportunities.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

- **Rufus** : `companion-api.js`, `companion-v3.js`, `index.html`, `rpg-connect-client.js`, `rpg-health.js`, `rpg-multi-target.js`, `rpg-opportunities.js`, `rpg-reactions.js`, `rpg-undo.js`, `rpg-group.js`, `rpg-instruction.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

- **Nans** : `companion-api.js`, `index.html`, `rpg-connect-client.js`, `rpg-health.js`, `rpg-multi-target.js`, `rpg-reactions.js`, `rpg-undo.js`, `rpg-group.js`, `rpg-instruction.js`, `rpg-native-reactions.js`, `rpg-opportunities.js`, `rpg-resources.js`, `rpg-weapon-gate.js`.

### Incompatibilité d’annulation démontrée pendant l’audit

La dague spectrale native de Rufus peut émettre un JdS après la résolution des dégâts d’Instruction. La vérification du journal ne consultait pas cette file de JdS, et pouvait donc proposer une annulation alors que le dialogue de sauvegarde restait ouvert. La vérification appelle désormais `EncounterMJControl.hasPendingAction`, fondé sur `saveAuthority.snapshot()`. Une conséquence en attente bloque l’annulation; la finalisation utilise aussi `saveAuthority.cancelAction` pour purger les demandes obsolètes liées au root. Ce sont les primitives existantes du moteur de JdS. Le nouveau scénario vérifie le refus d’annulation avant ce JdS puis la restauration après sa résolution.

### État de livraison

Cette tranche reste sur `codex/group-resources-reactions-2026-10-07` dans les huit dépôts tant que la matrice demandée n’est pas complètement validée. Samoth n’a pas d’attaque d’arme native compatible sur le main audité. Cette limite empêche de déclarer les six opportunités livrées. Aucun main n’est modifié avant levée de cette limite et validation complète.

Les tests unitaires passent (164), les bridges/clients des Companions passent (7) et les icônes passent (4). Le scénario de non-régression antérieur à la dernière correction du raccord JdS a validé 110 contrôles sur cinq rounds complets et fin/rechargement; le scénario journal/annulation existant a également passé ses contrôles navigateur. Ces résultats ne constituent pas une validation exhaustive de chaque cas de la mission. Les scénarios navigateur sont conservés pour reproduire et poursuivre cette validation. Certaines captures/gestes Playwright rencontrent des timeouts de rendu Chromium dans cet environnement; les échecs sont conservés dans les rapports locaux, et ne sont pas assimilés à un succès.

Les nouveaux documents sont `Encounter/GROUP-REACTIONS-AUDIT.md` et `RPG-Connect/GROUP-PROTOCOL.md`. La vue Groupe conserve également le dernier snapshot reçu avant chargement du module, pour éviter une vue vide lors d’une reconnexion rapide. Les anciennes epochs/révisions sont refusées avant application de leurs effets côté client.
