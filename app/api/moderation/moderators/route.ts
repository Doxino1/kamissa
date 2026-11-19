import { NextRequest, NextResponse } from "next/server";
import { requireModerator } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/admin";

// Modérateurs actuels, et recherche d'un membre par son nom (jamais par
// e-mail : les adresses ne sortent pas de la base).
export async function GET(req: NextRequest) {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: moderators, error } = await admin
    .from("profiles")
    .select("id, nom, ville")
    .eq("is_moderator", true)
    .order("nom");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().replace(/[%_,()]/g, "");
  let results: { id: string; nom: string | null; ville: string | null; is_moderator: boolean }[] = [];
  if (q.length >= 2) {
    const { data, error: searchError } = await admin
      .from("profiles")
      .select("id, nom, ville, is_moderator")
      .ilike("nom", `%${q}%`)
      .order("nom")
      .limit(10);
    if (searchError) return NextResponse.json({ error: searchError.message }, { status: 500 });
    results = data ?? [];
  }

  return NextResponse.json({ moderators, results });
}
