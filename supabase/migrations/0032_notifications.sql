-- Notifications in-app : nouvel abonné, match mutuel, nouveau commentaire
-- sur un post. Insérées côté client au moment de l'action (follow, match,
-- commentaire) plutôt que par trigger, pour rester cohérent avec le reste
-- de la base qui n'utilise pas de triggers applicatifs.
create type public.notification_type as enum ('follower', 'match', 'comment');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  actor_id uuid references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
-- L'auteur de l'action (suivi, match, commentaire) insère la notification
-- pour le destinataire — pas de risque au-delà du spam déjà permis par les
-- autres tables (follows, comments).
create policy "notifications_insert_as_actor" on public.notifications
  for insert with check (auth.uid() = actor_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- Préférences de notification par catégorie — défaut à true pour ne pas
-- couper silencieusement les notifications des utilisateurs existants.
alter table public.profiles add column notif_followers boolean not null default true;
alter table public.profiles add column notif_matching boolean not null default true;
alter table public.profiles add column notif_comments boolean not null default true;

-- Union de toutes les colonnes déjà accordées par 0011/0019/0020/0029 — voir
-- feedback_grant_rebuild_regression dans la mémoire du projet.
revoke update on public.profiles from authenticated;

grant update (
  nom, ville, disciplines, type_profil, bio, email_contact,
  portfolio_public, posts_public, langue_preferee,
  instagram_handle, tiktok_handle, twitter_handle,
  onboarding_complete, recoit_email_hebdo,
  notif_followers, notif_matching, notif_comments
) on public.profiles to authenticated;
