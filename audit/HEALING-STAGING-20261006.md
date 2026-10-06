# Tranche soins — première livraison staging, 6 octobre 2026

Cette livraison ouvre **HEAL seulement**. La mission complète soins / PV temporaires / Aide / réanimation **n'est pas terminée**. Aucun merge, déploiement ou changement de main n'est effectué. Les autres familles restent fermées dans l'adaptateur réseau ; leurs tests purs ne constituent pas des tests des capacités jouables.

## Audit et causes

Les huit dépôts ont été inspectés à partir des versions main suivantes : Encounter a82e295, RPG-Connect c117b40, Kentaro 1c810ca, Brackmard 180f0cd, Zephyr 846f9bc, Rufus bc3e48d, Samoth cfe043c, Nans 43bba4d.

Le dépôt RPG-Connect contient les assets et conventions. Le **serveur WebSocket réellement utilisé est Encounter/rpg-connect-server.js**. Il fournit déjà une file d'événements, un ACK de transport, un ACK applicatif MJ et des commandes persistées en mémoire pour les joueurs déconnectés. Il est réutilisé sans modification ni nouveau protocole de handshake.

Problèmes identifiés :

1. applyHealMany / applyHealDirect déléguaient le soin des joueurs connectés au Companion, puis bindState réimportait ses PV. Encounter ne décidait donc pas du résultat final.
2. bindState réimportait également les anciens PV au retour d'un contrôleur : risque d'annuler un soin reçu pendant sa déconnexion.
3. Le catalogue multicible exclut les 0 PV et le sélecteur de combat affiche les adversaires. Cela ne suffit pas pour soigner des alliés inconscients.
4. Soins de Samoth, Imposition des mains et plusieurs pouvoirs custom consomment des ressources ou affichent un texte sans résoudre réellement les PV de l'autre cible.
5. normalizeParticipant supprimait les champs supplémentaires au rechargement. Les métadonnées d'autorité et de source doivent être explicitement conservées.
6. La Marque d'Asmodeus indique une perte de PV max lors du soin d'autrui, mais aucune quantité/formule n'est définie dans le code ou les notes du dépôt. Aucune règle n'est inventée.

## Architecture livrée

Le Companion choisit les alliés par stableId, lance les dés, vérifie ses ressources et réserve une seule fois l'action/les ressources. L'intention et ses modifications de ressources sont sauvegardées localement. Encounter valide atomiquement toutes les cibles puis applique le soin, plafonné aux PV max. Un PNJ sans Companion emprunte exactement ce chemin.

Les Companions cibles reçoivent uniquement leur propre état de santé dans STATE_SYNC. Le soigneur reçoit le nom, le montant demandé et le montant réellement rendu. Aucun PV exact d'un autre participant n'est transmis dans ce résultat.

Le dialogue multicible existant est généralisé avec un contexte de sélection indépendant : liste alliée, minimum/maximum, confirmation/annulation. Les sélections hostiles du multicible précédent ne sont pas modifiées par un soin.

Après un soin, les snapshots locaux ne remplacent plus les PV Encounter de cette cible. Les pertes de PV natives remontent sous forme de deltas explicites dédupliqués ; leur écho STATE_SYNC ne se réapplique pas. Le pipeline d'attaque/JdS existant est conservé. Les mutations positives personnelles des capacités non migrées restent acceptées uniquement avec la révision de santé courante, pour préserver leur fonctionnement natif. Ce mode de compatibilité ne constitue pas une intégration HEAL/REVIVE de ces capacités ni la finalisation de l'autorité exclusive demandée pour toute la tranche. Les anciens octrois locaux de PV temporaires restent compatibles et non cumulatifs selon leur mécanisme natif ; ils **ne constituent pas encore le nouveau pipeline TEMP_HP**.

## Capacités réellement intégrées

| Personnage | Capacité | État livré |
|---|---|---|
| Brack | Second souffle | HEAL personnel, 1d10+10, bonus et ressource réservées une fois |
| Brack | Vigueur naine | HEAL personnel, Esquiver/action et un dé de vie, 1d10+4 |
| Zéphyr | Imposition des mains | HEAL vers soi/PJ/PNJ/invocation admissible ; réserve consommée au montant demandé, même en cas d'overflow |
| Samoth | Soins | HEAL vers n'importe quel allié ; slot ou usage gratuit natif |
| Samoth | Soins jumelés | Deux cibles distinctes mixtes, un seul lancement/slot, métamagie native |
| Samoth | Dés de vie | HEAL personnel ; interaction native fiole/points de sorcellerie conservée |
| Kentaro / Nans / Rufus | Réception de soins | Synchronisation et reconnexion vers les cibles avec Companion |

## Familles préparées mais non ouvertes

Le module pur rpg-health-authority.js sépare HEAL, TEMP_HP, HP_MAX_CHANGE et REVIVE. Les trois dernières familles sont testées isolément, **refusées par l'adaptateur réseau** et non liées aux boutons des capacités.

- TEMP_HP : attribution non cumulative, conservation de la source du pool gardé, remplacement explicite, déduplication. La règle automatique par défaut conserve le plus grand pool ; l'intégration future doit garder les décisions propres au destinataire et les représailles/expiration.
- HP_MAX_CHANGE : Aide +5/+10 sur trois alliés, +PV courants/+max, effet sérialisable, retrait qui conserve les dégâts intermédiaires et plafonne au nouveau max. La planification d'expiration et l'UX MJ ne sont pas livrées.
- REVIVE : retour explicite à 1 PV, validation de mort/temps pour Revivifier, éligibilité séparée pour Jugement. Les états de mort, conditions custom, validations MJ et déclenchements de tour restent à intégrer.

## Capacités différées et motifs

| Personnage | Capacités | Travail restant |
|---|---|---|
| Zéphyr | Flèche normale / sacrificielle | Corréler le soin à la résolution d'attaque ; coût personnel + soin atomiques, sans demi-transaction |
| Zéphyr | Aura de vitalité | Commande de soin répétée, concentration, bonus, durée et changements de cible à tester sur plusieurs tours |
| Zéphyr | Ancre sacrée | Sélection des alliés et lien fiable à la réduction de l'attaque déclenchante |
| Zéphyr | Aide / Revivifier | Brancher les moteurs séparés, validation MJ et durée/mort explicites |
| Zéphyr | Agathys | Synchroniser la source et vérifier les représailles existantes avant activation TEMP_HP |
| Zéphyr | Marque d'Asmodeus | Quantité de réduction, base demandé/reçu, cas multicible, durée/restauration et interaction Aide non définis |
| Nans | Cri de ralliement | Jet réel 2d6+4, 6 alliés, choix PV temp, peur/immunité et consommation unique de l'avantage d'attaque |
| Nans | Écorce | Source, remplacement, effets de disparition et durée |
| Kentaro | Soif / Agathys / Lazarus | Sources, réactions, représailles et effets secondaires ; boutons natifs conservés |
| Rufus | Jugement différé | Retirer la mutation locale automatique au profit d'un déclenchement Encounter persistant et unique |
| Samoth | Potions / Anneau en bois | Valeurs/validation MJ ; aucune valeur de potion inventée et aucun inventaire refondu |

Cette séparation est volontaire : le contrat de santé doit être validé avant d'activer les effets liés à une attaque, une source de PV temporaires ou une mort. Cette livraison ne prétend pas satisfaire les critères de la tranche complète.

## Contrat et fiabilité

- Intention : heal:request { actionId, combatId, source, amount, targetIds }. L'acteur est dérivé de characterId et de son binding Encounter.
- Identifiant d'enveloppe nouveau à chaque retry ; **actionId conservé**, montant et cibles identiques, dés non relancés.
- Résultat : message:gm.healthResult { ok, actionId, family, source, results:[{ targetId, targetName, requestedAmount, appliedAmount, kept }] }.
- Santé privée : state:sync.health { current, max, temp, tempSource, revision } et healthActorId.
- Ciblage : allyCatalog { stableId/id, displayName/name, camp, kind, entityType, lifeStatus, companionId, portrait } ; sans PV exacts.
- Ledger des résultats et des deltas dans l'état Encounter sauvegardé. Le retry ne réapplique pas le soin, même après rechargement d'Encounter.
- Refus de toute l'action si une cible manque, a changé de camp ou est morte. Restitution des valeurs de ressource encore réservées, sans restaurer un snapshot complet qui écraserait les dégâts reçus entre-temps.
- Repos/undo/fin de tour locaux bloqués pendant la réservation. Changer de salle ne retransmet pas une intention de l'ancienne salle.
- File du serveur : persistance **en mémoire**, non durable au redémarrage du serveur. Encounter sauvegarde les PV et ledgers dans son stockage navigateur ; aucune base externe ajoutée.

## Fichiers modifiés

- Encounter : app.js (normalisation), index.html et service-worker.js (chargement/cache), rpg-connect-mj.js (catalogue, autorité HEAL, résultats privés, deltas, conservation participants déconnectés pendant le fight), rpg-health-authority.js, tests du moteur/client, fixture MJ, package.json, scripts et résultats d'audit.
- Six Companions : companion-api.js (sources et échos d'autorité), rpg-connect-client.js (contexte santé), rpg-multi-target-ui.js (choix alliés), rpg-health.js (réservation/retry/résultats), index.html (cache/chargement).
- Brack / Zéphyr : fonctions natives concernées dans index.html.
- Samoth : companion.js (Soins/jumelage/dés de vie).
- RPG-Connect : aucun fichier modifié, bus existant réutilisé.

## Validation et limites

Les chiffres et scénarios finaux sont consignés dans healing-validation.json. Les traces locales contiennent les véritables échanges WebSocket et les captures Chromium. Les sorties des autres familles n'ont pas été présentées comme des tests E2E.

La non-régression existante (114 contrôles Chromium réussis) couvre initiative, validation, attaques touché/raté, dégâts effectifs/RIV, six familles JdS, multicible à résultats indépendants, élimination, undo multicible, états, fin de tour, reconnexions et plusieurs rounds. Les trois nouvelles compositions sont des scénarios **HEAL**, et non les trois scénarios complets TEMP_HP/complexes demandés dans la mission initiale.

Risques restants : validation globale sur iPad réel non effectuée ; flux d'effets complexes non activés ; tests de redémarrage durable du serveur non applicables à sa persistance mémoire. Aucun déploiement main ni annonce de réussite de la mission complète.

### Résultats finaux des suites

- 66 tests moteur/client/protocole/multicible : réussis.
- 7 tests Companions et transport : réussis.
- 4 tests icônes : réussis.
- 114 contrôles du navigateur de non-régression : réussis, aucune exception JavaScript.
- 3 nouvelles compositions HEAL, 3 rounds chacune : résultats détaillés dans le JSON associé.
- Dés de vie Samoth + fiole : test Chromium réussi.
- Compatibilité après soin : Écorce/source/épuisement, Jugement natif non migré et contrôles PV personnels testés dans Chromium, 4 contrôles réussis.

Aucune régression connue dans le périmètre testé. Les critères de la mission complète ne sont pas tous validés : TEMP_HP, HP_MAX_CHANGE et REVIVE des capacités restent différés, et le mode de compatibilité personnel doit être supprimé seulement après leur migration/test.
