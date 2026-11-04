-- Une exposition durait le temps de sa date d'ouverture : l'app masque les
-- événements passés, donc Louvre Photo (ouverte jusqu'en mai 2027) disparaissait
-- le lendemain de son ouverture. date_fin est facultative : sans elle, un
-- événement reste ponctuel, comme avant.
alter table public.events add column date_fin timestamptz;

alter table public.events add constraint date_fin_after_date check (
  date_fin is null or date_fin >= date
);

-- Grants additifs (colonne nouvelle) : on ne touche pas aux colonnes déjà
-- accordées par 0024.
grant insert (date_fin) on public.events to authenticated;
grant update (date_fin) on public.events to authenticated;
