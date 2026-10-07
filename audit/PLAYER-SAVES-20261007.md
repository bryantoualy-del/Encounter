# JdS des PJ contre les sorts ennemis — 7 octobre 2026

## Audit

Encounter résolvait déjà les capacités de Bibliothèque à JdS par cible, avec les bonus de son modèle, et savait appliquer les dégâts, les PV temporaires et R/I/V. Le multicible côté Companions, lorsqu'un PJ attaque plusieurs ennemis, était déjà opérationnel. Pour un sort ennemi touchant plusieurs PJ, l'interface Encounter sélectionnait une cible à la fois et lançait localement son JdS. La concentration après dégâts restait une demande séparée du Companion. Le dragon et le spectre sont des participants Encounter distincts, mais leurs fiches de JdS complètes ne sont pas fournies par leurs Companions.

## Nouveau flux

- Un sort/capacité ennemie de Bibliothèque de type JdS, en combat connecté, propose une cible ou « Plusieurs cibles ». Le MJ choisit explicitement les cibles affectées. Les capacités à jet d'attaque continuent leur ancien flux.
- Encounter tire une seule fois les dégâts bruts du sort et crée une demande fiable distincte pour chaque PJ, identifiée par combatId, groupId et requestId. L'économie de l'ennemi est engagée une fois. Tant que les réponses manquent, le tour ne peut pas avancer.
- Chaque Companion lit le modificateur de sauvegarde dans sa fiche native, affiche une demande obligatoire, tient compte des échecs automatiques FOR/DEX et du désavantage DEX sous Entravé, et emploie le moteur de dés 3D existant. Brack propose l'avantage contre le poison depuis sa règle native. Le joueur peut confirmer un autre mode et un bonus circonstanciel à la table. Le résultat est stocké avant l'animation et réémis jusqu'à ACK ; refresh et reconnexion ne relancent pas le dé.
- Encounter reçoit les résultats indépendants, applique la réussite ou l'échec, les demi-dégâts lorsque la capacité les décrit, puis R/I/V, PV temporaires, PV et éventuel JdS de concentration. Le journal affiche la source et chaque résultat. Un résultat répété ne réapplique pas les dégâts.
- Les invocations et autres alliés sans Companion connecté ouvrent une boîte MJ obligatoire : modificateur tiré de la fiche et résultat naturel du d20 doivent être saisis. Le MJ vérifie les bonus et avantages à la table ; aucun profil de JdS complet n'est inventé pour le dragon ou le spectre. La demande manuelle persiste au refresh Encounter.
- La capability `player-save-requests-v1` est négociée explicitement avec le serveur. Le service worker Encounter et les URLs de scripts des six Companions sont actualisés pour charger les nouvelles versions.

La portée, la zone exacte, la visibilité, les avantages circonstanciels et l'aura de Zéphyr sur les alliés proches restent confirmés à la table. Les bonus propres de Zéphyr incluent déjà son aura dans sa fiche. Les états appliqués par un sort de Bibliothèque au-delà de ses dégâts ne sont pas automatiquement déduits d'un texte libre ; le MJ utilise le système d'états existant. Une capacité de recharge combinant jet d'attaque et DD reste dans le moteur d'attaque existant.

## Vérification

- Suite Encounter : 137 tests verts.
- Ponts clients, y compris les bonus natifs CHA des six Companions et l'avantage de Brack contre le poison : 7 tests verts.
- Icônes : 1 test vert.
- Chromium réel, écran Companion iPad paysage : deux PJ connectés, cible multiple, demandes obligatoires, dés 3D, dégâts partagés, résultats indépendants, PV Encounter, spectre manuel, refresh Companion et Encounter pendant une demande, et résultat rejoué sans second dégât. Capture `audit/results/player-save-ipad.png`, synthèse `audit/results/player-saves-summary.json`.
- Les trois combats de non-régression ont été rejoués avec les six Companions et trois compositions de Bibliothèque : Gobelin/Orc/Ogre (4 rounds), Loup sanguinaire/Ombre/Squelette (4 rounds), Fausse hydre — Démo/Sectateur/Vétéran (5 rounds). Le troisième combat inclut désormais, après un échec de Contresort, le JdS natif de Brack avant de poursuivre le tour. Un premier passage du vieux harnais s'est arrêté précisément à cette nouvelle attente ; son scénario a été adapté puis le troisième combat complet a été rejoué et validé.

Le scénario ciblé complète ces combats et vérifie le flux multicible PJ et invocation qui leur manquait.
