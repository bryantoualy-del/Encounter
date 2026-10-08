# Kentaro — pouvoirs connectés, 8 octobre 2026

## Sources et périmètre

Base : Encounter `54d4250`, Kentaro `cfcd1d8`, RPG-Connect `55c11a8`.
Les huit dépôts demandés ont été récupérés depuis leur dernier `main`.
Les tranches Samoth et Zéphyr présentes dans ces bases sont conservées.

Fiche : **-Kentaro Amane- 10.pdf**, version du 3 septembre 2026.
La fiche donne CA 18, demi-plate 15, DEX +2 et cape +1. Cette CA de base
reste 18 ; les bonus du moteur d’effets partagé sont synchronisés.
Ombre d’égarement suit la description et la précision fournies par le joueur.
La règle explicite du joueur prime pour le Sceau : **remplace la Marque,
1d8 radiant + 1d8 psychique, aucun d6 de Marque**.

## Capacités livrées

| Capacité | Résolution |
|---|---|
| Châtiment occulte | Proposition après touche de lame ; un paquet typé, 6d8 force / 12d8 critique, slot unique, une fois par tour, À terre si taille admissible |
| Malédiction de l’Hexblade | ID réel, action bonus, ressource, durée, +4 et critique 19–20 sur cette cible, soin 14 à sa mort, repos |
| Maléfice | Cible et caractéristique, concentration, d6 nécrotique, désavantage aux tests uniquement, transfert après élimination |
| Voile spirituel | Type choisi explicite, 2d8 N5, critique, durée, concentration, soins empêchés après dégâts du Voile, ralentissement des ennemis proches confirmés |
| Invisibilité | Condition du moteur partagé, choix de bénéficiaires, attaque/lancement de Kentaro, concentration et expiration |
| Lazarus | Réaction, 100 PV temporaires, inactivité jusqu’à fin du prochain tour, fin de concentration, durée et fin des PV temporaires liés |
| Soif ténébreuse | Cible, décision MJ durable, 1 perforant +4 nécrotiques soumis aux défenses, PV temporaires égaux aux dégâts nécrotiques réellement infligés |
| Vision de la Pierre | 12 secondes, prochain jet réellement avantagé, consommation sur attaque de Kentaro, une utilisation par jour |
| Marque / Sceau | Priorité exclusive, deux composantes du Sceau, historique des touches par cible et tour, avantage spécifique, expiration |
| Pas entre les rayons | Même lancement que Foulée brumeuse ; bonus, destination narrative, 1/repos court, aucun slot |
| Foulée brumeuse | Même moteur, emplacement distinct, action bonus |
| Ombre d’égarement | Concentration, obscurcissement, avantage/désavantage selon détection, résistance radiante, riposte 2d8 nécrotique à 3 m confirmés |
| Anneau | Sorts proposés routés vers effets, santé ou JdS partagés ; niveau stocké, économie, concentration et données du lanceur initial ; aucun slot supplémentaire |

Kentaro conserve ses animations, son thème, ses rubans et son fonctionnement
hors ligne. Les boutons manuels de Châtiment ouvrent la décision contextuelle ;
ils ne créent plus une seconde attaque de dégâts.

## Fiabilité

Les demandes d’effets et leur consommation sont durables. Encounter conserve
les reçus par `actionId`. Les dégâts ont un résultat persistant par `attackId` ;
la retransmission conserve cet identifiant. Le Châtiment, les autres bonus et
le Sceau appartiennent au même paquet de dégâts.

Les effets utilisent `RPGCombatEffects`, les conditions existantes, les autorités
de santé/JdS et le journal. Les captures natives permettent l’annulation des
ressources avec les mutations Encounter. Les expirations sont contrôlées par
les tours et par l’horloge. `STATE_SYNC` restaure les effets, cibles et reçus.
La cible éliminée pendant la décision de Châtiment termine la transaction sans
dégâts ; un éventuel slot réservé est rendu.

## Validation

- `npm test` : **244 tests réussis**, aucune erreur.
- `npm run test:companions` : **7 tests réussis**.
- `CHROMIUM_PATH=… node audit/kentaro-browser.mjs` : **40 contrôles réussis**,
  dont critique, retransmission, rechargement, annulation atomique, R/I/V,
  Invisibilité, Spectre, opportunité, repos et mode hors ligne.
- `CHROMIUM_PATH=… node audit/group-browser.mjs` : **63 contrôles réussis**
  sur Kentaro, Samoth, Zéphyr, Nans, Brack Mard et Rufus.
- `CHROMIUM_PATH=… node audit/session-long-combat.mjs` : **14 contrôles réussis**,
  dix rounds, 70 actions des héros et 10 tours du dragon ; reconnexion,
  concentration, annulation atomique, soins et multicible pendant le combat.

Les scénarios Marque seule, Sceau normal, Sceau critique, changement de cible et
expiration sont vérifiés dans les tests de l’autorité et en navigateur.
Les suites existantes vérifient initiative, multicible, concentration, réactions,
Contresort, soins, PV temporaires, invocations, sauvegardes, reconnexions et ACK.

## Limites explicites

Encounter ne possède pas de grille tactique. Distance, détection spéciale,
destination narrative et conditions de morsure restent des faits confirmés à
la table ; des contrôles MJ sont visibles. La riposte d’Ombre nécessite une
attaque identifiée et une proximité confirmée.

Les sorts personnalisés inconnus de l’anneau restent conservés jusqu’à validation
de leurs règles. Suggestion affiche l’instruction et soumet son JdS au moteur ;
son caractère raisonnable et les exceptions narratives restent à vérifier par
le MJ. Les détails d’illusion et d’éclairage d’Ombre sont narratifs, faute de
moteur d’éclairage. Aucun moteur tactique ou de conditions parallèle n’est créé.

RPG-Connect reçoit une documentation de contrat ; son serveur et le protocole
d’ACK existant suffisent. Les cinq autres Companions ne nécessitent pas de
modification de leur code.
