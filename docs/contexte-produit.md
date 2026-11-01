# Kamissa — Contexte produit

Source : « Kamissa — Résumé de migration » (état au 25/09/2026), complété et corrigé d'après le prompt de reprise Claude Code et l'export Claude Design. Les points marqués ⚠️ sont des contradictions entre sources, à trancher (voir `kamissa-a-verifier.md`).

## Objectif

Kamissa (ex-« Assistant pour artistes », renommé le 27/07/2026) est une web app **gratuite** qui aide les artistes à découvrir des événements, se connecter entre eux et participer à des communautés locales. Inspirée par la compagne de Dotian, artiste professionnelle (peinture, sculpture, performance) basée à Paris, avec un fort réseau à Athènes.

Quatre piliers :
1. Agrégation d'événements (open calls, expos, ateliers, vernissages, résidences, annonces)
2. Matching entre artistes
3. Communauté locale par ville
4. Email hebdomadaire personnalisé

Différenciateurs face à ArtConnect, XHBT, CuratorSpace, Res Artis, TransArtists, On the Move, CIPAC, Culture.gouv.fr, Ateliers Médicis : profil qui suit l'artiste d'une ville à l'autre, matching actif, digest hebdo poussé (pas une liste passive), groupes par ville.

MVP développé en solo, 100 % gratuit, sans paiement. **Claude (chat) = partenaire stratégie/produit/design ; Claude Code = construit le code.**

- Repo : github.com/Doxino1/kamissa
- Domaine : kamissa.app (Cloudflare → Vercel) ; ancien : assistant-artiste.vercel.app
- Lancement Paris + Athènes simultané, architecture multi-villes (sélecteur de ville)

## Décisions produit

- **Matching asymétrique** : suggestions façon LinkedIn, sans opt-in mutuel. Basé sur tags « je cherche » (atelier partagé, collaboration, mentorat), ville, discipline. Contact par email ou réseaux (Instagram, TikTok, X) ; messagerie interne plus tard. ⚠️ Le prototype Claude Design montre une carte type « swipe » (Passer / Proposer un échange).
- **Annonces ≠ marketplace** : ventes d'œuvres/matériel et partage d'atelier = sous-type d'événement « Annonce ». Transactions hors plateforme, disclaimer explicite.
- **Annuaire des boutiques** (Rougier & Plé, Boesner…) : couche d'info carte/liste, pas de vente.
- **Communauté** : un seul groupe par ville, pas de sous-groupes par quartier tant que le volume ne le justifie pas.
- **Types d'événements** : Résidence séparée d'Open call ; indicateur Gratuit/Payant pour Atelier, Open call, Résidence, avec filtre.
- **Identité de profil** choisie à l'inscription : artiste pro, amateur, galerie, institution, curateur.
- **Bibliothèque privée** (dépôt non public) distincte de Portfolio/CV (toggle public/privé).
- **IA** : pas de coaching créatif (refus éthique : risque de « productiviser » la création). Éventuel assistant limité à la logistique (planning) — reporté.
- **Monétisation** : aucune. Si signal nécessaire : bouton « intéressé à 1 €/mois » sans paiement réel.
- **Croissance** : bouton de partage d'événement comme levier organique.
- **i18n** : interface FR/EN/EL ; on ne traduit jamais le contenu utilisateur, sauf traduction auto des événements via DeepL.

## Nom

Mayday, Agora, Atelier, Bridge écartés (déjà pris). Kamissa retenu ; renommage fait dans le code, pages légales, métadonnées, repo.

## Historique de la direction visuelle

1. Minimaliste → rejetée après test utilisateur.
2. « Bubbly » : Quicksand/Comfortaa/Nunito, accent terracotta #C4622D, pastels — **remplacée**.
3. Fraunces + Noto Serif — **remplacée**.
4. **Actuelle : Palette C « Argile et sauge », Figtree + Caprasimo** (design system « Organic » de Claude Design). Détails : `kamissa-design.md`.
5. Direction éditoriale/collage (papier déchiré, coups de pinceau) : aspiration future, nécessite de vrais visuels (œuvres de la compagne). Un fichier « Backup Collage » existe dans le projet Claude Design.

## Méthode de travail

- Chaque décision est testée auprès de la compagne (proxy utilisateur) avant validation.
- Chaque fonctionnalité est arbitrée selon l'éthique et le rapport complexité / valeur MVP.
- Décisions consignées dans des fichiers markdown vivants (cahier des charges, direction design).
- Dotian communique en français, préfère des réponses concises, structurées et actionnables.

## État actuel (fin sept. 2026)

Toutes les fonctionnalités du cahier des charges sont construites : flux filtrable, détail d'événement (sauvegarde / « je viens »), communauté + matching, profil (grille type Instagram + portfolio), bibliothèque privée, paramètres, annuaire des boutiques, onboarding, pages légales FR/EN/EL, email hebdo, vue calendrier. Aucun blocage technique connu.

## Prochaines étapes

1. Finir l'alignement écran par écran avec le prototype Claude Design (sous-pages profil : portfolio, posts, bibliothèque, paramètres en desktop large).
2. Test personnel en conditions réelles quelques jours : profil complet, sauvegardes, matching, réception de l'email hebdo.
3. Test avec 5 à 10 vrais utilisateurs, saisie manuelle des événements.
4. Activation de la communauté d'Athènes via le réseau de la compagne.

**Reporté (post-validation)** : pipeline de scraping/automatisation, PWA installable, app native iOS/Android, direction éditoriale/collage, assistant IA logistique, messagerie interne.
