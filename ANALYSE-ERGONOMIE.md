# ENCOUNTER — Diagnostic et choix de la V4

## Le besoin réel

L’outil doit permettre au MJ de répondre immédiatement à trois questions : qui joue, dans quel état sont les combattants, et sur qui suis-je en train d’agir ? Une action ordinaire doit demander peu de gestes et ne pas déplacer le regard dans plusieurs zones éloignées.

## Ce qui freinait la V3.6.1

| Constat dans la version fournie | Conséquence pendant la partie | Réponse de la V4 |
| --- | --- | --- |
| Sept commandes en haut, plus les modes | Recherche visuelle avant d’agir | Annuler visible, gestion regroupée dans ••• |
| Initiative répétée dans un ruban et la liste | Espace occupé et informations dupliquées | Ordre dans la liste ; nom courant, prochain et round en haut |
| Fiche sous la liste sur téléphone, minimum de hauteur important | Défilement et séparation des contrôles | Liste plein espace disponible ; fiche ouverte à la demande |
| Cible masquée par les règles CSS mobiles de la barre de PV | Risque d’agir sur le mauvais personnage | Nom de la cible toujours visible avant de valider |
| CA incorporée dans un sous-texte descriptif | Lecture lente de la défense | CA dans une colonne stable face aux PV |
| Affichage des états limité à trois sur certaines lignes | État important masqué derrière « +n » | Tous les états affichés, avec retour à la ligne |
| Membres des groupes présentés en petites cellules | Peu de place pour noms, états et PV temporaires | Une ligne par membre, avec en-tête commun |
| Groupement pouvant rapprocher des initiatives individuelles différentes | Ordre visuel susceptible de diverger du tour réel | Liste strictement triée, groupe répété s’il est interrompu |
| Boutons 1/5/10 appliquant immédiatement un effet | Une fausse manipulation change les PV | Présélection du montant puis validation explicite |
| Retour en Combat déclenchant à nouveau le début du tour | Actions réinitialisées, effets/recharges susceptibles de repartir | Changer de vue conserve l’état du combat |
| Police décorative et nombreux contrastes bruns proches | Petites informations fatigantes à parcourir | Texte fonctionnel sans empattements, fond bleu nuit, nombres contrastés |
| Bibliothèque et préparation régénérées à chaque action de combat | Travail d’interface inutile | Rendu des vues secondaires seulement lorsqu’elles sont utilisées |

## Choix assumés

- La sélection et le tour en cours sont deux notions distinctes : bleu pour la cible, or et texte « À JOUER » pour le tour.
- Les PV sont dominants, mais la CA conserve sa propre colonne.
- Une ligne à 0 PV garde son nom, ses chiffres et un état explicite. Elle n’est pas rendue illisible par une opacité excessive.
- Les groupes restent détaillés pour éviter de masquer les états de leurs membres. Une rencontre très chargée exige toujours un défilement : il vaut mieux conserver des lignes lisibles que tout miniaturiser.
- Les rappels de tour sont aussi placés dans la zone des combattants. Ils restent disponibles sur téléphone sans ouvrir la fiche.
- Les actions, ressources, états détaillés et caractéristiques restent dans les onglets de la fiche. Les commandes de préparation ne prennent pas la place du suivi de combat.
- Le retour de résultat est bref et ne bloque pas les interactions. Le dernier événement reste consultable au pied de la liste et le journal conserve l’historique.
- La hauteur disponible est calculée à partir des barres réelles, y compris les marges de sécurité des écrans mobiles.
- Le zoom navigateur est autorisé et les animations respectent la préférence de mouvement réduit.

## Périmètre conservé

Bibliothèque intégrée, création et édition des modèles, participants manuels, modifications par instance, rencontres sauvegardées, états avec durée, économie d’actions, ressources, actions légendaires, repaire, phases de boss, imports/exports et sauvegardes automatiques.

La refonte porte sur le support de jeu. Elle ne constitue ni une réécriture complète du moteur de règles ni un audit des fiches de personnages. Les points de règles déjà automatisés restent ceux de la version d’origine, sauf le correctif de navigation indiqué ci-dessus.

## Mise à disposition

Le ZIP est prêt pour le dépôt GitHub Pages existant. La connexion GitHub interrogée n’a retourné aucun dépôt accessible pendant cette intervention ; aucune branche ni publication distante n’a donc été créée.
