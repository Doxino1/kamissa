import { NextRequest, NextResponse } from "next/server";
import { requireModerator } from "@/lib/moderation";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateEventBatch } from "@/lib/translate";
import { DISCIPLINES, EVENT_TYPES, EVENT_TYPES_WITH_COST } from "@/lib/types";

const EVENT_FIELDS =
  "id, titre, description, type, sous_type, discipline, ville, date, date_fin, lieu, cout_type, cout_detail, statut, soumis_par";

// Lecture d'un événement quel que soit son statut ou son auteur, pour la page
// de modification ouverte par un modérateur (la RLS ne lui montre pas les
// événements en attente des autres membres).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { data, error } = await createAdminClient().from("events").select(EVENT_FIELDS).eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: data });
}

// Correction par un modérateur (date, fin, prix, discipline…), y compris d'un
// événement importé, qui n'a pas d'auteur. Seuls ces champs sont modifiables ;
// le statut ne change pas. Retraduit si le texte d'un événement publié change.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : null);
  const iso = (key: string) => {
    const value = text(key);
    return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;
  };

  const type = text("type");
  const discipline = text("discipline");
  const ville = text("ville");
  const titre = text("titre");
  const date = iso("date");
  if (
    !titre ||
    !date ||
    !type ||
    !(EVENT_TYPES as string[]).includes(type) ||
    !discipline ||
    !(DISCIPLINES as readonly string[]).includes(discipline) ||
    (ville !== "Paris" && ville !== "Athènes")
  ) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const costEligible = (EVENT_TYPES_WITH_COST as string[]).includes(type);
  const coutType = text("cout_type");
  const update = {
    titre,
    description: text("description") ?? "",
    type,
    sous_type: type === "annonce" ? text("sous_type") : null,
    discipline,
    ville,
    date,
    date_fin: iso("date_fin"),
    lieu: text("lieu") ?? "",
    cout_type: costEligible && (coutType === "gratuit" || coutType === "payant") ? coutType : null,
    cout_detail: costEligible ? text("cout_detail") || null : null,
  };

  const admin = createAdminClient();
  const { data: before } = await admin.from("events").select("titre, description, statut").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await admin.from("events").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (before.statut === "publie" && (before.titre !== update.titre || before.description !== update.description)) {
    await translateEventBatch([id]);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ statut: "publie" }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await translateEventBatch([id]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireModerator())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
