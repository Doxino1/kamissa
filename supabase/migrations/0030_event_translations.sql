-- Colonnes de traduction automatique (DeepL) pour le titre et la description
-- des événements — remplies côté serveur (client admin/service_role) une fois
-- l'événement publié, jamais par l'utilisateur directement. Pas de grant
-- update à ajouter : ces colonnes ne sont jamais modifiées via le client RLS.
alter table events
  add column titre_en text,
  add column titre_el text,
  add column description_en text,
  add column description_el text;
