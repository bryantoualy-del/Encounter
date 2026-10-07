# Finalisation combat — audit et suivi

## Base auditée
Les huit dépôts ont été clonés depuis GitHub/main dans une nouvelle branche feature/combat-architecture-20261006. Aucun travail précédent n'a été modifié.

## Flux constatés avant modification
- Chaque Companion expose __CompanionBridge et CompanionAPI. getState publie PV, temp/source, CA, concentration, économie, ressources, défenses et invocations. MutationObserver émet state:changed ; rpg-connect-client transmet state/event au serveur.
- Le bus effectif est Encounter/rpg-connect-server.js. Le dépôt RPG-Connect contient le registre et les ressources d'icônes, pas ce serveur. Le serveur garde pendingEvents, pending commands, receipts et déduplication en mémoire ; une panne serveur perd la salle (limitation existante).
- Encounter/rpg-connect-mj.js reçoit state/roster, bindState reflète concentration et économie ; les PV gérés sont protégés contre les snapshots locaux périmés. stateSyncPayload diffuse uniquement un catalogue hostile sans PV exacts.
- applyDamageDirect applique R/I/V puis PV temp/PV, envoie hp:damage avec before/after et publie l'autorité santé. applyDamageConsequences réexécute la commande locale puis restaure le snapshot authoritative.
- Kentaro utilise CON +3 avec avantage dans les contrôles locaux, mais Math.random sans pénalité distante. Samoth utilise CON +6. Zéphyr affiche CON +6 (aura comprise) et suit conc, sans contrôle après dégâts complet. Rufus possède aussi de la concentration (Vision, Invisibilité, Motif hypnotique), CON +0 : ne pas l'oublier.
- Kentaro : Voile, Maléfice, Invisibilité, Bannissement et autres boutons data-conc. Samoth : Hâte, Invisibilité supérieure, Rayonnement, Dragon, Objets, Souffle du dragon ; bâton Brouillard/Mur. Zéphyr : boutons data-conc et châtiments. Nans/Brack n'exposent aucune concentration active native.
- Seul Samoth possède Contresort dans le code audité : emplacement N3+, automatique si niveau suffisant, sinon Charisme +7 contre 10+niveau. Aucun ajout prévu ailleurs.
- Le moteur dice-engine.js est commun (Three.js, overlay #ccDiceOverlay). CompanionSocialDice montre un ou deux d20 déjà tirés ; pas de nouveau moteur.
- Réactions : Kentaro reactionUsed ; Samoth eco.reaction ; Zéphyr eco.r ; Brack used.reaction ; Rufus economy.reaction (true=disponible) ; Nans bridge natif. Leur restauration est locale via nextTurn, actuellement appelé lors de turn:close : point à vérifier avant moteur réaction.
- Rufus : boutons spectral/hexen, attack context reaction, sneakOwn/sneakReaction séparés. Brack : brackReaction(opportunity/sentinel/riposte), réaction et sup ; target:condition Vitesse 0 envoyé sur touche.
- Agathys local Kentaro capture déjà temp avant impact, mais produit un texte de retour sans dégâts automatiques Encounter. Zéphyr peut aussi avoir Agathys : source temporaire et originalAmount présents.
- Dragon et spectre utilisent déjà RPGSummonAuthority et RPGSummons ; réconciliation/tombstones existants à conserver.

## B — hardening
Empoisonné désavantage tests/attaques ; Agrippé/Entravé et effets Vitesse 0 réduisent vitesse affichée ; échecs FOR/DEX automatique et désavantage DEX native ; Effrayé dépend de visibilité connue ; À terre/critiques reçus nécessitent distance explicite. Mécanique centrale utilisée par jets Encounter et bus. Icônes réutilisées dans les listes et popup.
Validation : 95/95 tests Encounter, dont 3 tests conditions. Les tranches suivantes ne sont pas encore validées à ce stade.

## C — concentration
Demandes Encounter par instance après R/I/V, sans confondre dégâts et perte de PV normaux. Demandes dans état combat, reprise via state sync ; résultats Companion persistants, replays jusqu'à ACK logique. Popup obligatoire, moteur Three.js natif, avantage CON +3 Kentaro, CON +6 Samoth/Zéphyr, CON +0 Rufus ; pénalité synaptique incluse. Cleanup bridge local et invocations réconciliées. Identifiant d'incarnation pour protéger une nouvelle concentration homonyme. Les conséquences santé locales sont conservées, leurs anciens contrôles de concentration sont inhibés uniquement pour les dégâts authoritative. Incapacitation et 0 PV rompent sans dé. Le serveur annonce companion-concentration-v1 sans rendre les clients antérieurs incompatibles ; les nouveaux clients exigent cette capability.
Validation initiale : 10 tests concentration, 95 non-régression, 7 clients/bridges. Chromium : six Companions connectés, six initiatives validées, fight lancé, popup et animation native Kentaro, Samoth, Zéphyr, Rufus ; aucun pageerror. Artefacts dans audit/results/concentration-summary.json. Les trois combats complets finaux ne sont pas encore réalisés.
