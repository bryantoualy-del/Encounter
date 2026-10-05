# Stabilisation — constat avant correction

Base Encounter : 7f8ba7145978de26993c890373628398b6281b0d.

## Reproduction navigateur initiale

Chromium 153, pages Encounter/Kentaro/Brackmard, serveur isolé avec clé de test.
Initiatives manuelles 14 et 12 transmises, bonus locaux ajoutés, valeurs reçues,
validation individuelle et FIGHT exécutés par clics. Le symptôme initiative
absente n'est PAS reproduit sur cette combinaison de versions.

Fin de tour Kentaro : popup MJ reçue, puis ReferenceError emitEvent is not defined.
Les six clients contiennent cet appel après api.emitLocal, déjà abonné au transport.
Cause : deuxième chemin inexistant et inutile, pas défaut du premier envoi.

## Défauts constatés dans le code, à reproduire ensuite

- Machine Encounter initialisée LOBBY même si fight.phase est restaurée.
- pendingTurnEnd, selectedTargets, pending attacks et verrous ne sont pas persistés.
- Verrous de dégâts expirent après 15 secondes même si résolution encore attendue.
- Initiative "envoyée" affichée sans vérifier queue/envoi ni attendre ACK serveur.
- Retransmission d'initiative avec nouvel eventId peut remplacer une validation.
- initiative:retry utilisé par Encounter mais refusé par la whitelist serveur.
- Queue client volatile : rechargement avant ACK perd l'événement.

## Cartographie

UI Companion → CompanionAPI.emit → subscriber rpg-connect-client → queue →
WebSocket event → serveur (identité + seen + pendingEvents) → Encounter.onEvent →
event-ack MJ → commande retour → Companion → command-ack.

L'ACK serveur accepte l'événement dans sa file ; il ne signifie ni application
par Encounter ni validation MJ. Companion conserve les règles locales et Encounter
les PV des ennemis. Aucun changement visuel n'est prévu.

Serveur Render : Encounter/main, commit live 7f8ba7145978de26993c890373628398b6281b0d.
RPG-Connect est le dépôt des assets partagés ; le serveur est dans Encounter.

Les anciens tests audit/e2e.mjs injectent des participants et modifient les règles :
ils constituent des contrôles hybrides, pas les trois combats E2E demandés.

## Rejeux ciblés

Les reproductions ultérieures ont établi la suppression des participants cc-* au chargement (app.js), les boutons Fin de tour masqués/inaccessibles, la popup Nans non fermée par une décision réseau, les images WebP invalides et les composants typés incomplets. Les scripts combats-e2e.mjs et autonomous-e2e.mjs manipulent les interfaces, sans injection de participants, d’événements de jeu ni mutation du state. Les pertes d’ACK et copies de trames réelles sont provoquées par un proxy WebSocket de test.
