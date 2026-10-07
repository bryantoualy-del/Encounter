# Bibliothèque de lanceurs de sorts et morsure du Loup sanguinaire — 7 octobre 2026

## Audit et cause

La fiche intégrée du Loup sanguinaire décrivait « JS FOR DD 13 ou à terre » dans `detail` mais ne possédait qu'une action `kind: attack`. Le moteur de cible résolvait la touche et les dégâts sans créer de demande de sauvegarde. De plus, le bouton « Lancer comme sort » apparaissait sur toutes les capacités ennemies dépourvues de `isSpell`, y compris les morsures et attaques d'armes. Une attaque touchée était reconnue dans le pont RPG par lecture d'une ligne du journal ; cette ligne peut changer pendant l'application des dégâts et de la concentration.

## Modifications

- L'éditeur de Bibliothèque conserve désormais `isSpell`, `spellLevel`, `attackMode` et un objet `onHitSave` (caractéristique, DD, état sur échec). Les fiches intégrées déjà stockées localement récupèrent les nouvelles données mécaniques du Loup sanguinaire sans écraser les autres personnalisations.
- Le bouton de déclaration de niveau n'apparaît que sur un sort explicitement identifié et dont le niveau manque. Une capacité non magique n'ouvre pas Contresort. Une capacité déjà classifiée est envoyée directement à la fenêtre de réaction avant résolution, y compris un tour de magie de niveau 0.
- La morsure du Loup sanguinaire possède `onHitSave: FOR 13 → À terre`. Après la touche, elle utilise le même protocole `player-save:request` que les sorts ennemis ; le Companion lance son dé 3D. Sur échec, Encounter applique l'état. Sur raté, aucune sauvegarde. La sauvegarde ne réapplique pas les dégâts de la morsure ; l'ACK et le registre empêchent un double effet. Une invocation sans profil natif passe par le MJ.
- L'attaque renvoie maintenant une résolution structurée (touche, jet, dégâts) au pont RPG, sans déduire sa réussite du texte du journal.
- Quatre profils 5e 2014 AideDD / SRD 5.1 sont ajoutés aux trois formats de la Bibliothèque : Acolyte, Fanatique, Prêtre, Mage. Leur sélection de capacités distingue explicitement les sorts des armes et fournit le niveau, le DD et les dégâts lorsque le moteur sait les résoudre. Les effets persistants complexes portent un rappel MJ plutôt qu'une automatisation partielle.

## Sources de vérification

- Loup sanguinaire : https://www.aidedd.org/dnd/monstres.php?vf=loup-sanguinaire
- Acolyte : https://www.aidedd.org/dnd/monstres.php?vf=acolyte
- Fanatique : https://www.aidedd.org/dnd/monstres.php?vf=fanatique
- Prêtre : https://www.aidedd.org/dnd/monstres.php?vf=pretre
- Mage : https://www.aidedd.org/dnd/monstres.php?vf=mage
- Boule de feu : https://www.aidedd.org/dnd/sorts.php?vf=boule-de-feu
- Cône de froid : https://www.aidedd.org/dnd/sorts.php?vf=cone-de-froid

## Vérifications

- `npm test` : 143 tests verts, dont 6 nouveaux cas de métadonnées, migration de fiche, demande sur touche, état sur échec et déduplication.
- `npm run test:companions` : 7 tests verts ; `npm run test:icons` : 1 test vert.
- Chromium réel : 16 contrôles verts. Bibliothèque et éditeur, attaque touchée sur Kentaro, popup obligatoire FOR DD 13, dé 3D, « À terre » après échec, attaque ratée sans JdS, refresh de Kentaro et d'Encounter avec demande en attente, spectre avec JdS manuel, Mage et Boule de feu, fenêtre Contresort avant effet, puis JdS DEX du sort. Captures `audit/results/wolf-bite-save-ipad.png`, `audit/results/wolf-ability-ipad.png`, `audit/results/mage-spells-ipad.png` ; résumé `audit/results/spellcasters-wolf-summary.json`.
- Trois compositions distinctes de combats de non-régression avec les six Companions : Gobelin/Orc/Ogre 4 rounds ; Loup sanguinaire/Ombre/Squelette 3 rounds après adaptation du harnais au nouveau JdS de Nans ; Fausse hydre — Démo/Sectateur/Vétéran 5 rounds. Tous terminés en moins de 10 rounds, avec les vérifications antérieures de concentration, Agathys, opportunités et Contresort.

## Limites explicites

Le MJ choisit la zone, la portée et la visibilité. Les emplacements de sort des monstres sont visibles mais leur dépense n'est pas automatisée dans cette tranche. Immobilisation de personne, Esprits gardiens, Vol, Projectile magique et les réactions propres aux lanceurs ennemis gardent leurs rappels MJ ; ils ne simulent pas un résultat mécanique absent. Les invocations non contrôlées par un Companion n'empruntent pas les bonus du propriétaire : le MJ saisit leur modificateur réel et le dé.
