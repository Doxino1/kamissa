import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/admin";

// Signalements d'utilisateurs : la RLS ne permet que de les écrire, ils ne se
// lisent que par ici, pour un modérateur.
export async function GET() {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select(
      "id, motif, description, created_at, reported_user_id, reported:profiles!reports_reported_user_id_fkey(nom), reporter:profiles!reports_reporter_id_fkey(nom)"
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
