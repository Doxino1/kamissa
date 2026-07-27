import { createAdminClient } from "./supabase/admin";

type DeeplTargetLang = "EN" | "EL";

async function translateText(text: string, targetLang: DeeplTargetLang): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey || !text.trim()) return null;

  const endpoint = apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";

  try {
    const res = await fetch(`${endpoint}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [text], target_lang: targetLang }),
    });

    if (!res.ok) {
      console.error(`DeepL translation failed (${res.status}): ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    return data.translations?.[0]?.text ?? null;
  } catch (err) {
    console.error("DeepL translation error:", err);
    return null;
  }
}

// Traduit une seule fois le titre/la description (partagés par toutes les
// occurrences d'un même envoi récurrent) puis applique le résultat à tous les
// ids fournis — évite de multiplier les appels DeepL pour un événement
// hebdomadaire répété jusqu'à 12 fois. Best-effort : n'échoue jamais, se
// contente de laisser les colonnes de traduction à null si DEEPL_API_KEY
// n'est pas configurée ou si l'appel API échoue.
export async function translateEventBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  if (!process.env.DEEPL_API_KEY) return;

  try {
    const admin = createAdminClient();
    const { data: event } = await admin
      .from("events")
      .select("titre, description")
      .eq("id", ids[0])
      .single();

    if (!event) return;

    const [titreEn, titreEl, descriptionEn, descriptionEl] = await Promise.all([
      translateText(event.titre, "EN"),
      translateText(event.titre, "EL"),
      event.description ? translateText(event.description, "EN") : Promise.resolve(null),
      event.description ? translateText(event.description, "EL") : Promise.resolve(null),
    ]);

    await admin
      .from("events")
      .update({
        titre_en: titreEn,
        titre_el: titreEl,
        description_en: descriptionEn,
        description_el: descriptionEl,
      })
      .in("id", ids);
  } catch (err) {
    console.error("translateEventBatch error:", err);
  }
}
