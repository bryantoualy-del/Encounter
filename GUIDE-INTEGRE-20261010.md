# Visite guidée Encounter — écrans réels

Le bouton « ✦ Guide » suit 19 étapes sur les vrais éléments d’Encounter. Le visiteur voit la Préparation, la Bibliothèque, le vrai éditeur de fiches, la fenêtre RPG Connect, la vue Combat, le panneau Points de vie et le Journal.

La visite n’enregistre aucun monstre, ne change aucun PV/tour/round, ne crée pas de salle et n’envoie aucune commande aux compagnons. Les vues sont présentées temporairement ; Quitter remet la présentation et le défilement précédents. Une rencontre vide reste vide. Si l’éditeur de monstres est verrouillé pendant un fight, les étapes correspondantes sont passées.

Les boutons de progression, Précédent, Suivant et Quitter, ainsi que les flèches et Échap sont disponibles. Sur iPad, le panneau se place en bas ; sur bureau, sur le côté. L’overlay utilise l’API Popover du navigateur. Une fenêtre de décision déjà ouverte bloque le lancement de la visite pour que le MJ puisse d’abord la traiter.

Aucun aperçu fictif dans une iframe n’est utilisé. Les anciennes pages de démo sont retirées de cette version. Le PDF « Fonctionnement général » se trouve dans docs/ de l’archive.

Correctif éditeur de fiche : le panneau de visite est placé dans le vrai dialogue modal pendant son ouverture, puis remis dans la page à la fermeture. Ceci conserve les commandes Précédent / Suivant / Quitter actives lors de la présentation du profil et de RPG Connect.

Verdict de fiche : le nouvel encadré affiche OUI / NON dans le vrai éditeur, avec les raisons. Après l’enregistrement d’un adversaire, une fenêtre récapitule le résultat. Un OUI signifie qu’au moins une action est structurée et que les champs requis sont présents ; les interventions manuelles sont indiquées à part. NON signale les informations à compléter, même si la fiche a été enregistrée.

À l’import JSON, Encounter affiche aussi un bilan pour chaque fiche du fichier. Un adversaire reçoit le même contrôle technique OUI / NON. Une fiche de personnage ou de compagnon importée reste locale : son JSON n’établit pas de connexion avec l’application Companion, ce qui est indiqué clairement dans le bilan. Les sauvegardes complètes présentent le bilan après le rechargement.

Dégâts mixtes : l’éditeur des adversaires ne modélise qu’un type par capacité. Le contrôle refuse un type composite (« tranchants et feu ») ou un tableau de composantes importé, qui seraient autrement trompeusement présentés comme connectés. Les attaques envoyées par les applications Companion utilisent déjà des composantes typées distinctes. En attendant une saisie équivalente dans les fiches adversaires, appliquer manuellement chaque composante et son type.
