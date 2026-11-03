-- Vidéos dans les posts : un post porte soit une image (colonne image), soit
-- une vidéo (colonne video), toutes deux des URL publiques du stockage.
-- Les droits sur posts sont accordés au niveau de la table (0001) : la
-- nouvelle colonne est couverte sans grant supplémentaire.
alter table public.posts add column video text;

-- Bucket public comme "images" (les posts suivent déjà posts_public côté
-- table) ; 50 Mo par fichier, la limite de l'offre gratuite de Supabase.
-- Chemin préfixé par l'uuid du propriétaire : {user_id}/posts/xxx.mp4.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "videos_public_read" on storage.objects
  for select using (bucket_id = 'videos');

create policy "videos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "videos_owner_update" on storage.objects
  for update using (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "videos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );
