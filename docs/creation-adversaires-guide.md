# Fonctionnement général — créer ses adversaires

## Parcours MJ

1. Bibliothèque → Créer : catégorie Adversaire, nom, source et édition, CA, PV, bonus de JdS et défenses.
2. Une capacité par ligne. Attaque : mêlée/distance, bonus, formule et type de dégâts. Sauvegarde : caractéristique, DD, dégâts et moitié si réussite.
3. Pour un véritable sort : cocher Sort, renseigner son niveau réel et sa résolution. Le MJ choisit zone et cibles.
4. Lire le verdict de la fiche dans l’éditeur : **OUI — fiche conforme** si CA, PV et les champs des actions connectées sont renseignés ; **NON — fiche non conforme** avec les raisons précises si un champ manque ou si aucune action structurée n’est disponible. Le contrôle éditorial détaillé, facultatif, sert à relire chaque capacité et les décisions du MJ.
5. Essayer sur cibles fictives, enregistrer, puis lire le récapitulatif de conformité affiché après l’enregistrement. Si le résultat est NON, choisir « Corriger la fiche ». Ajouter ensuite la quantité voulue à la composition. Prépa Fight / FIGHT restent les étapes de combat connecté.

## Exemples

- Morsure : action, Attaque mêlée +5, 2d6+3 perforants ; JdS sur touche FOR DD13 ; À terre sur échec. Le JdS ne part qu’après une touche confirmée.
- Boule de feu : action, Sauvegarde DEX DD14, 8d6 feu, Demi-dégâts si réussite, Sort niveau 3. Le niveau sert au parcours de Contresort.

## Limites

Un texte décrivant un JdS ne crée pas une demande connectée. Cocher Sort ne programme pas tous ses effets. Téléportations, zones persistantes, réactions originales, coûts, durées et conditions de fin peuvent demander une décision ou un suivi manuel. Après résolution à la table, appliquer PV et états dans Encounter sur adversaires et compagnons, une seule fois, en vérifiant le Journal.

Le verdict OUI certifie que la fiche possède les champs nécessaires pour **au moins une action structurée** et qu’aucun champ bloquant n’a été détecté dans les capacités renseignées. Il ne promet pas que chaque effet narratif sera exécuté automatiquement : la fenêtre signale séparément les interventions du MJ. Un résultat NON n’empêche pas d’enregistrer la fiche ; il explique ce qu’il faut compléter pour la résolution connectée.

## Importer une fiche personnelle

Dans **••• → Importer JSON**, choisir un fichier JSON Encounter ou coller son contenu puis confirmer. Après l’import, le bilan affiche OUI ou NON pour chaque adversaire du fichier, avec les champs à corriger et les interventions manuelles. Pour une sauvegarde complète, il s’affiche après le rechargement. Un PDF, une image ou un format de fiche tiers n’est pas interprété par cet import JSON.

Une fiche classée **Personnage**, **Compagnon** ou **PNJ allié** est importée dans la bibliothèque locale. Le bilan affiche NON pour sa connexion RPG Connect : importer son JSON ne connecte pas son application Companion ni ne garantit ses sorts ou capacités. Vérifier la connexion et les capacités dans le Companion concerné.

## Dégâts de plusieurs types

Dans chaque capacité, le champ **Dégâts par type** accepte une ligne par composante, au format `formule | type`. Exemple :

```text
1d8+3 | tranchants
1d6 | feu
```

Ce champ remplace les deux anciens champs Dégâts et Type pour cette capacité. Encounter lance les deux formules lors d’une même attaque, applique résistances, immunités et vulnérabilités par type, puis met à jour les PV de la cible, y compris si c’est un compagnon connecté. Les critiques doublent les dés de chaque ligne ; un JdS avec demi-dégâts réduit chaque composante avant les défenses. Le résultat et ses types figurent dans le journal de combat. Les anciens adversaires avec un seul type continuent de fonctionner.

Une ligne incomplète ou un type inconnu donne un verdict NON et empêche d’exécuter cette capacité tant qu’elle n’est pas corrigée. Écrire « tranchants et feu » dans le seul champ Type historique ne répartit toujours pas les dégâts. Les événements d’attaque émis par les applications Companion utilisent leurs propres composantes typées, également traitées séparément par Encounter.

L’essai fictif vérifie les champs et calculs simulés, sans toucher à la partie ni communiquer avec les joueurs. Il ne prouve pas les déclencheurs complexes ni la reprise réseau.

Ce chapitre figure dans le PDF Fonctionnement général, annexes F et G, et dans les étapes de l’éditeur de fiches dans la visite des écrans réels.
