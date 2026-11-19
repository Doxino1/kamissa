import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateEventBatch } from "@/lib/translate";

// Déclenché par le client juste après une soumission/modification qui rend
// un événement publié — traduction best-effort, jamais bloquante pour la
// soumission elle-même (voir lib/translate.ts). Gardé par la propriété de
// l'événement plutôt que par son statut. Le texte du premier id est recopié
// sur tout le lot (occurrences d'un événement récurrent) : chaque id doit
// donc appartenir à l'utilisateur, sinon on pourrait écraser les traductions
// des événements des autres.
const MAX_IDS = 20; // un envoi récurrent fait au plus 12 occurrences
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? [...new Set(body.ids)] : [];
  if (ids.length === 0 || ids.length > MAX_IDS || !ids.every((id) => typeof id === "string" && UUID.test(id))) {
    return NextResponse.json({ error: "ids requis" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: events } = await admin.from("events").select("id, soumis_par").in("id", ids);

  if (!events || events.length !== ids.length || events.some((e) => e.soumis_par !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await translateEventBatch(ids as string[]);

  return NextResponse.json({ ok: true });
}
