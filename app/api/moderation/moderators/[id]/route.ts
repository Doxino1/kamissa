import { NextRequest, NextResponse } from "next/server";
import { requireModerator } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Nommer ou retirer un modérateur. is_moderator n'est modifiable que par la
// clé de service (migration 0011) : cette route est le seul chemin, et
// seulement pour un modérateur. On ne change jamais son propre rôle, pour ne
// pas se retirer par erreur le dernier accès à la modération.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { moderator?: unknown } | null;
  if (typeof body?.moderator !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("profiles")
    .update({ is_moderator: body.moderator })
    .eq("id", id)
    .select("id, nom, ville, is_moderator")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile: data });
}
