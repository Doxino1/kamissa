# Kamissa — maquettes « Racines » (référence design)

Ces fichiers `.dc.html` sont des maquettes HTML exportées du canevas Claude Design. Ce sont des **références visuelles**, pas du code de production : à reproduire dans le code Next.js existant.
Chaque fichier contient tout son markup (styles inline) et, en bas, un petit script avec les données d'exemple et les interactions. Ils ne s'ouvrent pas tels quels dans un navigateur (ils dépendent du moteur du canevas) : lire le source.

Fichiers : Profil-Racines (profil), Accueil-Racines (Événements), Communaute-Racines (Communauté / Artistes / Matching), Calendrier-Racines, Boutiques-Racines, Parametres-Racines, Auth-Racines (connexion / inscription + bienvenue), Modale-Evenement-Racines, Modale-Boutique-Racines.

## Retenue le 01/11/2026 : N — Racines

Inspirée de opportunity.waltonfamilyfoundation.org. Remplace la Palette C « Argile et sauge » (Figtree + Caprasimo).

- Fond #fdfcf9, texte #12110e, gris #6e6a61, filets #e4dfd4, fond de carte #efeadf.
- Accents terre (catégories, repères, avatars) : ocre #cb9a56, sauge #5f8763, ardoise #5a7580, taupe #9b8b73, vieux rose #a3867d, canard #337c83. Ces accents servent au décor (carrés, repères, avatars) ; pour du texte ou du blanc sur fond coloré, utiliser sauge foncé #46684a ou noir #12110e. Alerte #9e3a1e.
- Titres : Instrument Serif, grandes capitales (≈120px en tête de page) + une ligne en italique. Texte : Hanken Grotesk ; libellés en petites capitales espacées (11–13px, letter-spacing .08–.14em). Champs de formulaire : soulignés, saisie en Instrument Serif.
- Logo « Kamissa » en serif centré avec trois carrés (ocre, sauge, ardoise).
- Codes : sections numérotées « ( 01 ) », chiffres en grand serif, onglet actif en italique souligné, boutons pilules (noir plein ou contour), repères carrés sur la carte, listes séparées par des filets plutôt que des cartes, modales à angles droits sur voile rgba(18,17,14,.45).

## Points ouverts
- Matching : maquetté en suggestions (cartes + « Proposer un échange »), pas en swipe. À confirmer avant d'y toucher.
- Cartes : les maquettes montrent une illustration ; l'appli garde Leaflet, seuls les repères et les couleurs changent.
- Textes ajoutés dans les maquettes, absents du prototype : « le matériel, près de chez vous. » (Boutiques), « visible des autres artistes / masqué » (Profil public), « ( Nouveau ) » / « ( Nouvelle adresse ) » (modales). Demander avant de les reprendre.
- Catégorie de l'événement : en pastilles dans la modale (au lieu d'une liste déroulante).
