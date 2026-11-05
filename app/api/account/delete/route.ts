import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// Fichiers rangés par lib/upload.ts : images/{userId}/{portfolio|posts|bibliotheque}/…,
// videos/{userId}/posts/…, library/{userId}/… et portfolios/{userId}/….
const STORAGE_FOLDERS: { bucket: string; prefix: (userId: string) => string }[] = [
  { bucket: "images", prefix: (id) => `${id}/portfolio` },
  { bucket: "images", prefix: (id) => `${id}/posts` },
  { bucket: "images", prefix: (id) => `${id}/bibliotheque` },
  { bucket: "videos", prefix: (id) => `${id}/posts` },
  { bucket: "library", prefix: (id) => id },
  { bucket: "portfolios", prefix: (id) => id },
];

const PAGE = 1000;

async function removeFolder(admin: AdminClient, bucket: string, prefix: string) {
  // list() n'est pas récursif et pagine : on relit la première page jusqu'à
  // ce qu'elle soit vide, puisque chaque passe supprime ce qu'elle a lu.
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: PAGE });
    if (error) throw new Error(error.message);
    const files = (data ?? []).filter((f) => f.id !== null).map((f) => `${prefix}/${f.name}`);
    if (files.length === 0) return;
    const { error: removeError } = await admin.storage.from(bucket).remove(files);
    if (removeError) throw new Error(removeError.message);
  }
}

// Suppression définitive du compte, à la demande de l'utilisateur
// lui-même (RGPD). On efface d'abord ses fichiers (photos, PDF de
// portfolio), que la base ne supprime pas en cascade, puis la ligne
// auth.users, qui cascade vers profiles (on delete cascade) puis vers tout
// le reste (posts, comments, portfolio_items, library_items, saved_events,
// matching_tags, follows, group_messages, blocks) — déjà en place depuis le
// schéma initial. events.soumis_par passe à null (on delete set null) : les
// événements déjà publiés restent visibles à la communauté.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    for (const { bucket, prefix } of STORAGE_FOLDERS) {
      await removeFolder(admin, bucket, prefix(user.id));
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
