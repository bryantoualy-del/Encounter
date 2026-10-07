# Annulation autoritaire, protocole et limites

L'action logique porte un identifiant stable, le combat, le round, le participant actif, une révision croissante et les mutations de ses participants. Les demandes dérivées (JdS, concentration, effets déclenchés) sont reliées à cet identifiant. Les révisions de transport et de santé ne sont jamais restaurées en arrière.

La restauration est un delta de champs avec comparaison de leur valeur actuelle à la valeur produite par l'action. Elle conserve les autres champs et refuse les données modifiées entre-temps. Une ancienne sauvegarde globale n'est jamais réappliquée. Cette première version refuse les entrées antérieures à une autre mutation, les changements de tour/round, les créations/retraits de participants ou d'invocations, et les consommations non capturées. Les intentions PV maximum/réanimation et les mutations des invocations sont refusées tant que leur restauration complète n’est pas certifiée.

## Transaction distribuée

| Phase Encounter | Commande | Companion | Condition suivante |
|---|---|---|---|
| Vérification | `undo:prepare` | Vérifie son tour, ses deltas et la capture initiale des coûts pour une intention native ; verrouille les interactions ; persiste la décision | Tous les `undo:prepared` sont positifs |
| Annulation enregistrée, synchronisation en cours | `undo:commit` | Prépare la restauration locale ; conserve le verrou et une tombstone durable | Tous les `undo:ack` sont positifs |
| Correction Encounter enregistrée | `undo:finalize` | Applique son état de santé autoritaire, invalide ses anciennes demandes/résultats, actualise la fiche | Tous les `undo:finalized` sont positifs |
| Synchronisée | — | Déverrouillé | Historique conservé |

Avant la correction finale, un refus déclenche `undo:abort` : Encounter reste inchangé, les deltas locaux préparés sont compensés. Les états sont persistés de chaque côté et les commandes manquantes rejouées après reconnexion. Un Companion absent laisse la transaction en attente ; une transmission n'est jamais présentée comme un acquittement.

Encounter diffère les événements de combat durant préparation/commit/finalisation et ne les acquitte qu'après leur traitement. Les Companions diffèrent les commandes ordinaires durant leur verrou. Les commandes et résultats d'une action annulée sont ignorés grâce à son identifiant. Les corrections ne portent que l'état propre du destinataire sans catalogues de cibles ; les PV réels ennemis ne sont pas ajoutés au protocole.

## Couverture et refus

- Deltas autoritaires de dégâts, soins, PV temporaires et états ; ressources/counters capturés par le module propre de chaque Companion pour les intentions de santé ; concentration native résolue sous la même action.
- Les attaques et sorts originaires d'un Companion ainsi que les réactions associées sans capture complète de leurs consommations sont explicitement refusés. Leur résolution normale reste disponible.
- Une modification des données locales entre capture et annulation bloque la transaction. Une restauration de ressource n'est jamais déduite d'un coût affiché.
- L'annulation ne traverse pas un changement de round/tour, une modification ultérieure du même champ, ni le cycle de vie d'une invocation. Elle n'annule pas la progression du temps ou une fenêtre indépendante.
- Un ancien Companion sans ce module ne peut pas confirmer la transaction. L'état reste en vérification ; une livraison coordonnée des six branches est requise.

La santé finale reste la responsabilité d'Encounter. Le code de correction est installé dans chaque Companion, avec son bridge et ses règles propres ; Encounter ne réécrit pas directement le stockage d'un autre client.
