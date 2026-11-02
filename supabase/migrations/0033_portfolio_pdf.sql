-- Portfolio PDF : beaucoup d'artistes ont déjà un portfolio mis en page.
-- On le joint tel quel au profil plutôt que de leur faire ressaisir chaque
-- œuvre. Il suit le réglage portfolio_public, comme les portfolio_items.

-- Chemin dans le bucket "portfolios" ({user_id}/xxx.pdf), pas une URL : le
-- bucket est privé et le fichier se lit par URL signée, que la policy de
-- lecture ci-dessous n'accorde que si le portfolio est public.
alter table public.profiles add column portfolio_pdf text;

-- Grant additif (la colonne est nouvelle) : on ne touche pas aux colonnes
-- déjà accordées par 0011/0015/0019/0020/0029/0032.
grant update (portfolio_pdf) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolios', 'portfolios', false, 20971520, array['application/pdf']) -- 20 Mo
on conflict (id) do nothing;

create policy "portfolios_read_public_or_own" on storage.objects
  for select using (
    bucket_id = 'portfolios' and (
      (storage.foldername(name))[1] = auth.uid()::text or
      exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(name))[1] and p.portfolio_public
      )
    )
  );

create policy "portfolios_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'portfolios' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portfolios_owner_update" on storage.objects
  for update using (
    bucket_id = 'portfolios' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portfolios_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'portfolios' and (storage.foldername(name))[1] = auth.uid()::text
  );
