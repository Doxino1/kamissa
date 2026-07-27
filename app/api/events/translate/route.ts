import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateEventBatch } from "@/lib/translate";

// Déclenché par le client juste après une soumission/modification qui rend
// un événement publié — traduction best-effort, jamais bloquante pour la
// soumission elle-même (voir lib/translate.ts). Gardé par la propriété de
// l'événement plutôt que par son statut : le premier id fait toujours foi
// pour un lot récurrent, tous les ids d'un même lot appartiennent au même
// utilisateur.
export async function POST(req: NextRequest) {
  const { ids } = (await req.json()) as { ids?: string[] };
  if (!ids || ids.length === 0) {
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
  const { data: event } = await admin
    .from("events")
    .select("soumis_par")
    .eq("id", ids[0])
    .single();

  if (!event || event.soumis_par !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await translateEventBatch(ids);

  return NextResponse.json({ ok: true });
}
