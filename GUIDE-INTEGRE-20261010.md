# Encounter — guide interactif intégré

Archive complète basée sur Encounter_Concentration_Tour_Corrige_Cloudflare_2026-10-09.zip.
Déposer cette archive à la place du précédent ZIP Encounter dans le même processus Cloudflare.
Les fichiers de l’application sont à la racine du ZIP.

Le bouton « ✦ Guide » dans la barre supérieure ouvre un parcours de 17 étapes avec numéros,
encadrés en surbrillance et indications. Précédent, Suivant, Quitter et Rejouer sont disponibles.
« Retour à Encounter » ferme le guide.

Le parcours utilise une rencontre fictive dans une fenêtre isolée : il ne modifie pas la partie,
ne communique pas avec RPG Connect et n’envoie pas de messages au MG.
Cette première version explique les écrans sur une console de démonstration ; elle ne surligne
pas encore les composants de la rencontre réelle.

Intégration : ajout de encounter-guide.js, chargement dans index.html et nouveau cache
encounter-guide-20261010-2. Les scripts actuels sont inclus dans le cache hors ligne.
Les autres fichiers de la version de base sont conservés.

Vérification : syntaxe JavaScript, test du parcours et contrôle de l’intégrité de l’archive.
Le rendu sur iPad/Safari et dans le site déployé reste à vérifier.

Ajout : création des adversaires, attaques, sorts, bilan de compatibilité et essais fictifs.
