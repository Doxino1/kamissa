import { createClient } from "@supabase/supabase-js";
import { icsContent, icsFileName } from "@/lib/calendar";
import { mapEventRow } from "@/lib/events";
import { LOCALES, type Locale } from "@/lib/i18n/dictionary";

// Fichier .ics d'un événement publié, servi en « inline » avec le type
// text/calendar : Safari sur iPhone ouvre alors directement « Ajouter au
// calendrier » au lieu d'enregistrer le fichier dans Téléchargements.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = new URL(request.url).searchParams.get("lang");
  const locale: Locale = lang && (LOCALES as string[]).includes(lang) ? (lang as Locale) : "fr";

  // Clé publique : la RLS ne laisse lire que les événements publiés.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, titre, description, type, sous_type, discipline, ville, date, lieu, lat, lng, cout_type, cout_detail, titre_en, titre_el, description_en, description_el"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const event = mapEventRow(data);
  return new Response(icsContent(event, locale), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${icsFileName(event)}"`,
      "Cache-Control": "no-store",
    },
  });
}
