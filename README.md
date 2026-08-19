# RH / PMO Administration V2.2

Corrections principales :
- navigation du menu initialisée indépendamment du chargement Grist ;
- chargement indépendant de chaque table ;
- `Team` et `Team_ref` restent utilisables même si les tables RH ne sont pas encore migrées ;
- diagnostic visible des tables absentes et erreurs d'accès ;
- version affichée dans le pied du menu (`V2.2`).

Tables attendues :
- Team
- Team_ref
- Motifs_RH
- Parametres_Alertes

Le widget demande `Full document access`.

Si `Motifs_RH` ou `Parametres_Alertes` sont absentes, les onglets correspondants affichent un message,
mais l'administration des ressources Team continue de fonctionner.
