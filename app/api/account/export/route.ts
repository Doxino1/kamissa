import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Export RGPD des données personnelles : profil, posts publiés, événements
// soumis, événements sauvegardés. Tout passe par le client normal (pas
// besoin de service_role) puisque RLS autorise déjà chacune de ces lectures
// pour son propre compte.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: profile }, { data: posts }, { data: submittedEvents }, { data: savedEvents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("posts").select("id, image, video, legende, date").eq("user_id", user.id),
      supabase
        .from("events")
        .select("id, titre, description, type, discipline, ville, date, lieu, statut")
        .eq("soumis_par", user.id),
      supabase
        .from("saved_events")
        .select("statut, created_at, events(id, titre, date, ville)")
        .eq("user_id", user.id),
    ]);

  const payload = {
    export_genere_le: new Date().toISOString(),
    compte: { id: user.id, email: user.email },
    profil: profile,
    posts_publies: posts ?? [],
    evenements_soumis: submittedEvents ?? [],
    evenements_sauvegardes: savedEvents ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mes-donnees-${user.id}.json"`,
    },
  });
}
