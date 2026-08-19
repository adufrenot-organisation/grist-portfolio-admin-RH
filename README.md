# RH / PMO — Administration V2.1

Correctifs V2.1 :
- correction d'une erreur JavaScript qui bloquait tout le widget ;
- navigation gauche opérationnelle ;
- chargement contrôlé de `Team`, `Team_ref`, `Motifs_RH`, `Parametres_Alertes` ;
- diagnostic explicite si une table est absente ou vide ;
- affichage du nombre de ressources et d'équipes dans l'état de synchronisation.

Important : dans le fichier `.grist` de structure transmis pour la conception, `Team` et `Team_ref` avaient 0 ligne. Le widget affiche les données présentes dans le document Grist dans lequel il est installé ; il ne crée pas automatiquement ces données.
