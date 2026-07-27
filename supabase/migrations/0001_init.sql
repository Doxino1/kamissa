-- Kamissa — schéma initial MVP
-- Champ `city` en texte libre partout (pas de tables par ville) pour permettre
-- l'ajout facile de nouvelles villes après Paris/Athènes.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type profile_type as enum ('artiste_pro', 'amateur', 'galerie', 'institution', 'curateur');
create type event_type as enum ('vernissage', 'expo', 'workshop', 'open_call', 'annonce');
create type announcement_subtype as enum ('oeuvre', 'materiel', 'atelier');
create type event_status as enum ('en_attente', 'publie');
create type event_source as enum ('manuel', 'scraper');
create type saved_status as enum ('sauvegarde', 'je_viens');
create type matching_tag_value as enum ('atelier_partage', 'collaborations', 'mentorat');

-- ---------------------------------------------------------------------------
-- profiles (étend auth.users de Supabase)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  ville text not null,
  disciplines text[] not null default '{}',
  type_profil profile_type not null default 'amateur',
  bio text,
  langue_preferee text not null default 'fr',
  portfolio_public boolean not null default true,
  posts_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_ville_idx on public.profiles (ville);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  type event_type not null,
  sous_type announcement_subtype,
  discipline text,
  ville text not null,
  quartier text,
  date timestamptz not null,
  lieu text,
  statut event_status not null default 'en_attente',
  soumis_par uuid references public.profiles (id) on delete set null,
  source event_source not null default 'manuel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sous_type_only_for_annonce check (
    (type = 'annonce' and sous_type is not null) or
    (type <> 'annonce' and sous_type is null)
  )
);

create index events_ville_date_idx on public.events (ville, date);
create index events_type_discipline_idx on public.events (type, discipline);
create index events_statut_idx on public.events (statut);

-- ---------------------------------------------------------------------------
-- saved_events
-- ---------------------------------------------------------------------------

create table public.saved_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  statut saved_status not null default 'sauvegarde',
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- ---------------------------------------------------------------------------
-- matching_tags
-- ---------------------------------------------------------------------------

create table public.matching_tags (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tag matching_tag_value not null,
  created_at timestamptz not null default now(),
  primary key (user_id, tag)
);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint no_self_follow check (follower_id <> followed_id)
);

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image text,
  legende text,
  date timestamptz not null default now()
);

create index posts_user_idx on public.posts (user_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  texte text not null,
  date timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id);

-- ---------------------------------------------------------------------------
-- groups (un seul groupe par ville au lancement)
-- ---------------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  ville text not null unique,
  created_at timestamptz not null default now()
);

insert into public.groups (ville) values ('Paris'), ('Athènes');

-- ---------------------------------------------------------------------------
-- group_messages
-- ---------------------------------------------------------------------------

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  texte text not null,
  date timestamptz not null default now()
);

create index group_messages_group_idx on public.group_messages (group_id, date);

-- ---------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nom, ville)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nom', ''), coalesce(new.raw_user_meta_data ->> 'ville', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.saved_events enable row level security;
alter table public.matching_tags enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.groups enable row level security;
alter table public.group_messages enable row level security;

-- profiles : lecture publique, écriture par le propriétaire
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- events : lecture publique des events publiés, ou de ses propres soumissions ;
-- création par tout utilisateur authentifié ; mise à jour par le soumetteur
create policy "events_select_published_or_own" on public.events
  for select using (statut = 'publie' or soumis_par = auth.uid());
create policy "events_insert_authenticated" on public.events
  for insert with check (auth.uid() = soumis_par);
create policy "events_update_own" on public.events
  for update using (auth.uid() = soumis_par);

-- saved_events : strictement privé au propriétaire
create policy "saved_events_owner_all" on public.saved_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- matching_tags : lecture publique (nécessaire au matching), écriture par le propriétaire
create policy "matching_tags_select_all" on public.matching_tags for select using (true);
create policy "matching_tags_owner_write" on public.matching_tags
  for insert with check (auth.uid() = user_id);
create policy "matching_tags_owner_delete" on public.matching_tags
  for delete using (auth.uid() = user_id);

-- follows : lecture publique, écriture par le follower
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_owner_write" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "follows_owner_delete" on public.follows
  for delete using (auth.uid() = follower_id);

-- posts : lecture si le profil est public ou si on est le propriétaire ; écriture par le propriétaire
create policy "posts_select_public_or_own" on public.posts
  for select using (
    auth.uid() = user_id or
    exists (select 1 from public.profiles p where p.id = posts.user_id and p.posts_public)
  );
create policy "posts_owner_write" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_owner_update" on public.posts
  for update using (auth.uid() = user_id);
create policy "posts_owner_delete" on public.posts
  for delete using (auth.uid() = user_id);

-- comments : lecture si le post parent est lisible ; écriture par tout utilisateur authentifié
create policy "comments_select_if_post_visible" on public.comments
  for select using (
    exists (
      select 1 from public.posts po
      where po.id = comments.post_id
        and (
          auth.uid() = po.user_id or
          exists (select 1 from public.profiles p where p.id = po.user_id and p.posts_public)
        )
    )
  );
create policy "comments_insert_authenticated" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "comments_owner_delete" on public.comments
  for delete using (auth.uid() = user_id);

-- groups : lecture publique, pas d'écriture côté client
create policy "groups_select_all" on public.groups for select using (true);

-- group_messages : lecture et écriture par tout utilisateur authentifié
create policy "group_messages_select_authenticated" on public.group_messages
  for select using (auth.role() = 'authenticated');
create policy "group_messages_insert_authenticated" on public.group_messages
  for insert with check (auth.uid() = user_id);
