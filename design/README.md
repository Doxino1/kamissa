# Kamissa — Spécification design (handoff Claude Design)

> Source : `design_handoff_kamissa/README.md` de l'export « Kamissa — Système de design » (projet Claude Design `9c70dc9f-1589-41ed-8a80-7cfb09e73efc`).
>
> ⚠️ **Typographie obsolète dans ce README** : il indique Fraunces seule. La référence actuelle est le fichier racine `Kamissa App.dc.html` (constantes `FONT = 'Figtree'`, `HEADING_FONT = 'Caprasimo'`, DS « Organic »), qui est plus récent que la copie dans `design_handoff_kamissa/`. Les couleurs ci-dessous restent valides.
>
> Dans ce repo : `design/Kamissa App.dc.html` (référence, avec `support.js`, `image-slot.js` et `_ds/organic…` pour qu'il s'ouvre) et `design/screenshots/`. Fichiers de l'export d'origine : `Kamissa App.dc.html` (référence actuelle) ; `Kamissa App - Palette Chaleureuse.dc.html` (+ `-print`) = variante Cormorant Garamond + Lora, non retenue ; `Kamissa App - Backup Collage.dc.html` = piste éditoriale/collage future ; `_ds/organic…` = design system utilisé ; `_ds/classical…` = DS non utilisé ; `design_handoff_kamissa/screenshots/` = 9 captures de référence (auth, événements, calendrier, boutiques, profil posts/portfolio, communauté, artistes, matching).

---

# Handoff: Kamissa — plateforme communautaire pour artistes

## Overview
Kamissa est une plateforme communautaire pour artistes à Paris et Athènes : découverte d'événements, réseautage/matching entre artistes, portfolios, et un annuaire de boutiques de matériel. L'app est gated par authentification (pas de mode invité).

## About the Design Files
Les fichiers de ce bundle sont des **références de design créées en HTML** — un prototype montrant l'apparence et le comportement voulus, pas du code de production à copier tel quel. La tâche consiste à **recréer ces designs HTML dans l'environnement du codebase cible** (React, Vue, Swift, natif, etc.) en utilisant ses patterns et librairies existants — ou, si aucun environnement n'existe encore, à choisir le framework le plus adapté au projet.

## Fidelity
**Haute fidélité (hifi)** : couleurs, typographie, espacements et interactions finalisés. Le développeur doit recréer l'UI fidèlement avec les librairies/patterns du codebase cible.

⚠️ **Points de fidélité stricte, à ne pas réinterpréter :**
- **Langue** : toute l'interface est en **français** (labels, placeholders, textes de statut). Ne pas traduire en anglais.
- **Ne pas inventer de champs/états absents du prototype.** Le badge de "niveau" ("Artiste amateur") n'existe QUE sur l'écran Profil de l'utilisateur courant — il n'y a pas de notion de niveau/statut ("Amateur artist" / "Professional artist") sur les cartes de l'annuaire Artistes ni ailleurs. Si un champ semble utile mais n'est pas dans ce document ou dans le fichier source, demander avant de l'ajouter.
- **Se référer aux screenshots fournis pour la mise en page exacte**, pas seulement à la description textuelle — notamment la grille de cartes Artistes (voir ci-dessous), qui est un **grid de cartes carrées avec avatar rond**, pas une liste de lignes.

## Screens / Views

### 1. Authentification
- Écran plein centre, carte max-width 380px, fond `#efe8d8`, radius 28px
- Titre "Kamissa" centré, police display (voir Design Tokens)
- Deux onglets pill (Connexion / Créer un compte) dans un track `#f9f6f0`
- Champs : nom (signup only), email, mot de passe — inputs radius 14px, fond `#efe8d8`
- Bouton principal pleine largeur, fond `#c06722`, texte blanc
- À la création de compte réussie : modale de bienvenue ("Bienvenue chez Kamissa !") avec CTA "Commencer"

### 2. Événements (écran par défaut post-login)
- Barre de recherche + bouton filtres (ville / type / discipline / coût) en pills, panneau filtres avec animation fade-slide à l'ouverture
- Layout deux colonnes desktop : liste (42%, ou 52% en tablette 900–1199px) + carte Leaflet (flex 1) ; mobile : toggle liste/carte
- Carte de bandeau "Bonjour, {prénom}" + highlight de la semaine
- Cartes événement : badge catégorie coloré, date, titre, lieu, badge coût, boutons Sauvegarder/Participer + icône partager (copie lien)
- Hover sur une carte ⇄ highlight du marker correspondant sur la carte (sync bidirectionnelle)
- Carte Leaflet + tuiles CARTO Voyager, clustering des markers (leaflet.markercluster), recentrage automatique selon la ville filtrée
- Skeleton loading (~650ms) au premier chargement ; état vide si recherche/filtres sans résultat
- Bannière dismissible "Complétez votre profil" si non masquée
- Pagination "Charger plus" (paliers de 6)
- FAB "Ajouter un événement" → modale avec validation (titre requis, message d'erreur inline)

### 3. Communauté (3 onglets : Communauté / Artistes / Matching)
- **Communauté** : sélecteur ville, fil de messages avec réponses en thread, recherche, état vide, champ d'envoi de message
- **Artistes** : filtre ville + recherche (nom/discipline), grille de cartes (auto-fill 240px desktop, 2 colonnes tablette, 1 colonne mobile). Chaque carte : avatar circulaire (52px, motif décoratif tant qu'il n'y a pas de vraie photo) en haut, nom en gras (16px) sous l'avatar, ville en petit texte gris, un badge pill coloré pour la discipline (fond `#dff4ef`, texte `#22796b`), une phrase de bio (13px), puis un bouton "Suivre" pleine largeur en bas (contour sauge `#3f6b52`, devient rempli une fois suivi). **Aucun badge de niveau ("Amateur"/"Professionnel") sur ces cartes** — ce n'est pas une liste de lignes texte, c'est une grille de cartes verticales. Voir `screenshots/07-artistes.png`.
- **Matching** : carte type "swipe" (photo, nom, discipline, ville, bio, tags), boutons Passer/Proposer un échange, historique récent des 5 dernières actions avec option Annuler (persisté en localStorage), modale de confirmation de match

### 4. Calendrier
- Vue mensuelle en grille 7 colonnes, navigation mois précédent/suivant/aujourd'hui
- Jour sélectionné surligné, jour du jour encadré ; pastilles d'événements par jour (max 1-2 visibles)
- Liste des événements du jour sélectionné sous la grille

### 5. Boutiques
- Même structure liste+carte que Événements (avec clustering, recentrage par ville)
- Recherche + filtre par catégorie (pills dynamiques dérivées des données)
- Cartes boutique : nom, catégorie, adresse, description, lien externe, partager, supprimer
- FAB "Ajouter une boutique" → modale avec validation (nom requis)

### 6. Profil
- Header : avatar, nom (police display), badge niveau, discipline, stats (posts/abonnés/abonnements)
- Onglets Posts / Portfolio
- Portfolio : grille de cellules avec zone image (placeholder photo) + légende superposée en dégradé
- Bibliothèque privée (grille similaire, cadenas visuel)
- Bio, réseaux sociaux (icônes + handles)

### 7. Paramètres du compte
- Cartes sections : Informations (nom/email/ville), **Langue** (FR/EN/EL), Profil public (toggle), Notifications par type d'événement (toggles), Déconnexion (avec confirmation), Suppression de compte (avec confirmation)

## Interactions & Behavior
- **Auth gate** : toute l'app est masquée tant que `isAuthenticated` est faux
- **Hover sync liste↔carte** : survol d'une carte met à jour l'état `hoveredId`/`hoveredShopId`, qui grossit/colore le marker correspondant
- **Toast** : confirmation "Événement/Boutique ajouté ✓" et "Lien copié ✓", auto-dismiss 2.6s, position fixed bottom-center
- **Animations** : fade-slide 150-180ms sur les popovers (filtres, notifications) ; scale(.96-.97) sur press des boutons primaires ; pulse sur les skeletons
- **Focus clavier** : `outline: 2px solid #c06722` sur `:focus-visible` pour tous les éléments interactifs
- **Confirmations natives** : `window.confirm` avant déconnexion et suppression de compte
- **Validation formulaire** : champ requis affiche un message d'erreur inline sous le champ, effacé à la fermeture/réouverture de la modale
- **Responsive** : mobile <900px (nav en onglets bas, vue liste/carte togglée), tablette 900–1199px (colonnes ajustées), desktop ≥1200px

## State Management
Champs d'état clés à répliquer :
- `isAuthenticated`, `authView` (login/signup)
- `screen` (events/community/calendar/profile/settings/shop), `isMobile`, `isTablet`
- `events[]`, `shops[]`, `messages[]`, `notifications[]`, `notifPrefs{}` (par catégorie)
- Filtres : `eventFilterCity/Category/Discipline/Cost`, `shopCategoryFilter`, `eventSearchQuery`, `shopSearchQuery`, `communitySearchQuery`, `artistSearchQuery`
- `hoveredId`, `hoveredShopId` (sync carte/liste)
- `matchIndex`, `matchHistory[]` — **persistés en localStorage** (`kamissa_matchIndex`, `kamissa_matchHistory`)
- `eventsVisibleCount`, `shopsVisibleCount` (pagination, pas de 6)
- `accountLanguage` (fr/en/el)
- `showToast`/`toastMessage`, `isLoading` (skeleton initial ~650ms)

## Design Tokens

### Couleurs
- Fond principal (crème) : `#f9f6f0`
- Fond carte/panneau : `#efe8d8`
- Bordures : `#ddd2ba`
- Texte principal : `#201c16`
- Texte secondaire : `#6b655c`
- Accent primaire (caramel brûlé) : `#c06722` (hover `#a95a1c` / `#8f3e00`)
- Accent secondaire (sauge) : `#3f6b52`
- Rouge d'alerte/notif : `#c1502f`
- Badges catégories : voir constantes `BADGE` et `COST` dans le fichier source (couleurs pastel par catégorie d'événement)

### Typographie
- ⚠️ ACTUEL : **Caprasimo** (titres) + **Figtree** (corps), Noto Sans en secours pour le grec. Ancien texte ci-dessous conservé pour mémoire.
- Police unique : **Fraunces** (serif variable, optical sizing) — chargée via Google Fonts `Fraunces:opsz,wght@9..144,400..900`
- Titres/headings : Fraunces weight 900
- Corps de texte : Fraunces weight 400-600
- Tailles : titres de section 22px, titres de carte 16-18px, corps 13-14px, labels 11-12px

### Radius & Shadows
- Boutons/pills : `border-radius: 999px`
- Cartes : 20-24px
- Modales : 24px
- Ombre légère (hover carte) : `0 8px 24px rgba(192,103,34,.12)` (événements) / `rgba(63,107,82,.14)` (boutiques)
- Ombre modale : `0 20px 60px rgba(32,28,22,.25)`

## Assets
- Aucune image bitmap propriétaire — le portfolio utilise des zones d'image à remplir par l'utilisateur (placeholders drag-and-drop)
- Icônes : SVG inline dessinés à la main (style Lucide-like, stroke 2px)
- Cartes : Leaflet.js + tuiles CARTO Voyager (`basemaps.cartocdn.com/rastertiles/voyager`), clustering via `leaflet.markercluster`

## Files
- `Kamissa App.dc.html` — fichier source unique contenant tout le prototype (template + logique + styles inline)
- `screenshots/` — captures d'écran de chaque vue principale (auth, événements, calendrier, boutiques, profil posts/portfolio, communauté, artistes, matching)
