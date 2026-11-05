-- Mémoire de l'import automatique : une fiche déjà proposée ne revient pas,
-- même si un modérateur l'a refusée (donc supprimée de events). Table interne,
-- écrite par la clé de service seulement : RLS active et aucune policy.
create table public.import_log (
  source text not null,
  external_id text not null,
  imported_at timestamptz not null default now(),
  primary key (source, external_id)
);

alter table public.import_log enable row level security;
revoke all on public.import_log from anon, authenticated;
