import { createClient } from "@supabase/supabase-js";

// Point de contrôle pour un service de surveillance (UptimeRobot, Better
// Stack…) : 200 si le site répond ET que la base répond, 503 sinon. Interrogé
// toutes les quelques minutes, il empêche aussi Supabase (offre gratuite) de
// se mettre en pause faute d'activité.
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await supabase.from("events").select("id", { head: true, count: "exact" }).limit(1);
    if (error) throw error;
    return Response.json({ ok: true, db_ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
