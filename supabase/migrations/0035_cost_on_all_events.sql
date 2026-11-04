-- Le filtre gratuit/payant laissait passer les expositions et vernissages :
-- 0024 leur interdisait le champ coût, et une expo payante (Louvre Photo, 22 €)
-- apparaissait donc sous « Gratuit ». Le coût est désormais possible sur tous
-- les types sauf les annonces (vente de matériel, atelier à louer…).
-- Les droits sur cout_type et cout_detail sont déjà accordés (0024).
alter table public.events drop constraint cout_only_for_paid_types;

alter table public.events add constraint cout_not_on_annonce check (
  type <> 'annonce' or (cout_type is null and cout_detail is null)
);
