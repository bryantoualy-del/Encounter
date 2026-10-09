# Encounter — contexte, journal et mise en page

## Version de départ

- Main Encounter : e1fec851cc3302347aebc88b5e653d81c08e0de4.
- Référence Kentaro : f0b63ab250268cca0e7514e36b749a3b66e3be8d, notamment kentaro-journal.js et sa feuille de style intégrée : entrées en cartes, catégorie explicite, recherche, filtres, espacement et bordure colorée.
- RPG Connect consulté : 97964ff8208f4dfd544e43c4582372e0f28fdcba.
- ZIP comparé : Encounter_Cloudflare_patch_2026-10-09(1).zip.

Tous les fichiers du ZIP ont été comparés aux SHA Git de main, y compris les ressources binaires. Seuls index.html et rpg-connect-icon-registry.js différaient, pour la mise à jour des icônes Cloudflare. Main a été repris pour ces deux fichiers. Aucune correction supplémentaire propre au ZIP n’a été détectée.

L’URL du site Cloudflare déployé n’était pas fournie. Le ZIP disponible a donc été réconcilié, mais il n’est pas possible d’attester qu’il correspond exactement au déploiement en production.

## Modifications

- Les réglages Brack de visibilité et de proximité quittent le haut de la fiche. Une section repliable « Contexte et interactions » les regroupe avec les sens et perceptions existants.
- Les commandes de couverture des auras de Zéphyr, les réglages contextuels de Châtiment et les commandes de zone et de portée de Nans sont déplacés dans cette même section. Leurs handlers et données mécaniques sont conservés.
- Le bouton pour provoquer une attaque d’opportunité est accessible depuis la section de contexte.
- Les décisions MJ présentent le contexte des participants concernés. Les anciens réglages du Voile ne sont pas recréés. Invisibilité et Ombre d’égarement conservent les champs d’autorité existants.
- Les véritables états appliqués restent visibles : Invisible, Effrayé, À terre, concentration et autres effets mécaniques ne sont pas supprimés à cause de leur couleur.
- Le journal conserve ses transactions et son protocole d’annulation. Les résultats par cible sont visibles directement, avec jet, décision et conséquences regroupés sous le même identifiant d’action. Le journal ajoute recherche et filtres, sépare attente, validation, refus et annulation et replie les diagnostics techniques.
- Les noms des cibles sont mémorisés dans l’entrée pour rester lisibles après leur retrait du combat. L’historique antérieur est conservé dans une section repliable.
- Le ruban de concentration utilise une largeur calculée et des marges internes, sans masquer le texte. Les statistiques passent sur deux colonnes lorsque la fiche est étroite. Les textes et boutons peuvent se replier.
- Le bouton des décisions différées quitte son positionnement flottant. Il s’intègre au ruban de connexion ou à la fiche mobile, sans recouvrir les commandes.
- Le cache hors ligne et les URL de version des fichiers modifiés sont actualisés.

Seul Encounter est modifié. Le serveur, le resolver, les autorités de dégâts et la politique de transmission des PV ne sont pas modifiés.

## Vérifications réalisées

163 tests ciblés passent : décisions, modèle du journal et annulation, Brack (dont Inflexible), Kentaro, Rufus, Nans, Zéphyr, soins/PV, JdS joueurs, réactions, persistance.

44 contrôles dans Chromium passent :

- section contextuelle repliée et modifiable ;
- présence du contexte dans une décision MJ ;
- absence de réglages contextuels dans les cartes ;
- concentration active et inactive, noms longs et trois états simultanés ;
- marges et largeur des conteneurs à 1920×1080, 1366×768, 1180×820, 1024×768, 820×1180, 768×1024, 600×800 et 390×844 ;
- jet en attente, Touché sans dégâts encore en attente, résultats multicibles visibles ;
- refus et raté distincts, élimination à 0 PV ;
- rechargement avec conservation du groupe et des PV ;
- aucune exception JavaScript.

Un scénario avec le serveur WebSocket local et un client joueur de test valide cinq contrôles : réception réelle du jet, validation Touché et application unique des dégâts, reconnexion Encounter, reconnexion joueur avec retransmission et absence d’exception.

Les captures avant/après proviennent du main de départ réconcilié et de la version corrigée, avec les mêmes participants et actions de démonstration. La capture réseau provient du scénario réellement transporté par WebSocket.

## Limites

- Les tailles iPad ont été testées dans Chromium ; aucun iPad physique ni Safari/WebKit n’a été utilisé.
- Le client réseau du scénario est un client de test, pas une session complète des six compagnons natifs.
- Le déploiement Cloudflare et le serveur Render en production n’ont pas été modifiés ou testés.
- La suite globale npm test a été tentée mais requiert des fichiers des dépôts frères absents de ce checkout. Les suites ciblées indiquées ci-dessus ont été exécutées intégralement et passent ; ceci ne constitue pas une validation de toute la suite globale.

## Déploiement

Le ZIP de déploiement contient index.html à sa racine, ainsi que les scripts, styles, portraits, icônes et autres ressources de l’application. Déposer ce ZIP dans le projet Cloudflare existant.

Seul Encounter doit être redéployé. Les réglages de connexion et le resolver existants sont conservés.
