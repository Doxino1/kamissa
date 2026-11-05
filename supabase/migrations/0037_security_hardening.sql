-- Correctifs issus de l'audit de sécurité du 05/11/2026.

-- ---------------------------------------------------------------------------
-- 1. Stockage : plus de listing public. Les buckets "images" et "videos"
-- restent publics pour leurs URL (/object/public/… ne passe pas par ces
-- policies), mais n'importe qui pouvait énumérer tous les fichiers via l'API.
-- La lecture par l'API reste nécessaire au propriétaire (suppression).
-- ---------------------------------------------------------------------------
drop policy "images_public_read" on storage.objects;
drop policy "videos_public_read" on storage.objects;

create policy "images_owner_read" on storage.objects
  for select using (
    bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "videos_owner_read" on storage.objects
  for select using (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Bibliothèque privée : ses images avaient une URL publique. Bucket privé, lu
-- par URL signée ; library_items.image_url y contient un chemin {user_id}/xxx.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library', 'library', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "library_owner_all" on storage.objects
  for all using (
    bucket_id = 'library' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'library' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 2. Modération : events_moderation_gate ne joue qu'à la création. Un événement
-- publié pouvait ensuite être réécrit librement. Si son texte change : mots
-- interdits refusés, et retour en file sauf utilisateur de confiance (mêmes
-- règles que events_moderation_gate). Les écritures de service (auth.uid()
-- null : traduction, publication par un modérateur) ne sont pas concernées.
-- ---------------------------------------------------------------------------
create function public.events_review_on_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  banned_words text[] := array[
    'viagra', 'casino en ligne', 'crypto pump', 'forex signal',
    'make money fast', 'click here now'
  ];
  word text;
  haystack text := lower(coalesce(new.titre, '') || ' ' || coalesce(new.description, ''));
  is_trusted boolean;
  published_count integer;
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.titre is not distinct from old.titre
     and new.description is not distinct from old.description
     and new.lieu is not distinct from old.lieu then
    return new;
  end if;

  foreach word in array banned_words loop
    if haystack like '%' || word || '%' then
      raise exception 'Ce texte contient un terme non autorisé, corrige et réessaie.';
    end if;
  end loop;

  select p.is_moderator into is_trusted from public.profiles p where p.id = auth.uid();

  if not coalesce(is_trusted, false) then
    select count(*) into published_count
      from public.events e
      where e.soumis_par = auth.uid() and e.statut = 'publie' and e.id <> old.id;
    is_trusted := published_count >= 3;
  end if;

  if not is_trusted then
    new.statut := 'en_attente';
  end if;

  return new;
end;
$$;

create trigger events_review_on_edit
  before update on public.events
  for each row execute function public.events_review_on_edit();

-- Fonctions de trigger : rien à appeler depuis l'API publique.
revoke execute on function public.events_review_on_edit() from public, anon, authenticated;
revoke execute on function public.events_moderation_gate() from public, anon, authenticated;
revoke execute on function public.shops_moderation_gate() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Notifications : l'auteur pouvait en écrire à n'importe qui. Une
-- notification doit désormais correspondre à une action réelle (abonnement,
-- proposition, commentaire) et respecter les préférences du destinataire. Un
-- profil bloqué n'est pas lisible (profiles_select_not_blocked) : la
-- sous-requête échoue aussi dans ce cas.
-- ---------------------------------------------------------------------------
drop policy "notifications_insert_as_actor" on public.notifications;

create policy "notifications_insert_for_real_action" on public.notifications
  for insert with check (
    auth.uid() = actor_id
    and exists (
      select 1 from public.profiles p
      where p.id = notifications.user_id
        and case notifications.type
          when 'follower' then p.notif_followers
          when 'match' then p.notif_matching
          when 'comment' then p.notif_comments
        end
    )
    and (
      (type = 'follower' and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.followed_id = notifications.user_id
      ))
      or (type = 'match' and exists (
        select 1 from public.matching_proposals m
        where m.from_user_id = auth.uid() and m.to_user_id = notifications.user_id
      ))
      or (type = 'comment' and exists (
        select 1 from public.posts po
        join public.comments c on c.post_id = po.id
        where po.id = notifications.post_id
          and po.user_id = notifications.user_id
          and c.user_id = auth.uid()
      ))
    )
  );
