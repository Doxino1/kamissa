-- Enregistre les "je propose un échange" du matching swipe pour pouvoir
-- détecter un match mutuel (les deux parties ont proposé) et l'annoncer.
create table public.matching_proposals (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint no_self_proposal check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);

alter table public.matching_proposals enable row level security;

-- Lecture par les deux parties seulement, nécessaire pour détecter un match
-- mutuel côté client (existe-t-il une proposition réciproque ?).
create policy "matching_proposals_select_own" on public.matching_proposals
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "matching_proposals_owner_write" on public.matching_proposals
  for insert with check (auth.uid() = from_user_id);
create policy "matching_proposals_owner_delete" on public.matching_proposals
  for delete using (auth.uid() = from_user_id);
