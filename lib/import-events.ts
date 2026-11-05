import { createClient } from "@supabase/supabase-js";

// Import hebdomadaire des événements parisiens depuis l'open data « Que faire
// à Paris » (Ville de Paris, licence ODbL, créditée dans les mentions légales).
// Tout arrive en attente dans la modération : events_moderation_gate ne publie
// jamais un événement sans auteur, et la traduction se fait à la publication.
const API = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records";
const SOURCE = "que-faire-a-paris";
const PAGE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

const MAX_EXPOS = 12;
const MAX_ATELIERS = 6;
const WINDOW_PAST_DAYS = 7;
const WINDOW_FUTURE_DAYS = 21;
const DESCRIPTION_MAX = 420;

// Poids de chaque thème : les places sont limitées, les arts visuels passent
// devant les expositions de photo documentaire.
const ART_TAG_SCORES: { [tag: string]: number } = {
  Peinture: 3,
  Sculpture: 3,
  "Art contemporain": 2,
  "Street-art": 2,
  Photo: 1,
};
const EXCLUDED_TAGS = ["Enfants", "Conférence", "Théâtre", "Danse", "Concert", "Sport", "Sciences"];
const ART_WORKSHOP = /peinture|dessin|sculpture|céramique|poterie|gravure|linogravure|aquarelle|modelage|broderie|croquis/i;

interface QfapRecord {
  id: string;
  url: string | null;
  title: string | null;
  lead_text: string | null;
  date_start: string | null;
  date_end: string | null;
  address_name: string | null;
  address_street: string | null;
  address_zipcode: string | null;
  lat_lon: { lat: number; lon: number } | null;
  price_type: string | null;
  price_detail: string | null;
  qfap_tags: string | null;
}

function tagsOf(record: QfapRecord): string[] {
  return (record.qfap_tags ?? "").split(";");
}

function plainText(html: string | null): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max)).trimEnd()}…`;
}

function artScore(record: QfapRecord): number {
  return tagsOf(record).reduce((score, tag) => score + (ART_TAG_SCORES[tag] ?? 0), 0);
}

// Titre réduit à ses lettres, sans le mot « exposition » : repère les doublons
// malgré une ponctuation ou une formulation différente.
function titleKey(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(exposition|atelier)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const MIN_TITLE_KEY = 8;

function isDuplicate(key: string, known: string[]): boolean {
  if (key.length < MIN_TITLE_KEY) return false;
  return known.some((other) => other.length >= MIN_TITLE_KEY && (key.includes(other) || other.includes(key)));
}

function kindOf(record: QfapRecord): "expo" | "workshop" | null {
  const tags = tagsOf(record);
  if (tags.some((t) => EXCLUDED_TAGS.includes(t))) return null;
  const isWorkshop = tags.includes("Atelier") || /\batelier\b/i.test(record.title ?? "");
  if (tags.includes("Expo") && !isWorkshop && artScore(record) > 0) return "expo";
  if (tags.includes("Atelier") && ART_WORKSHOP.test(record.title ?? "")) return "workshop";
  return null;
}

function disciplineOf(record: QfapRecord): string {
  const tags = tagsOf(record);
  if (tags.includes("Peinture") || /peinture|aquarelle/i.test(record.title ?? "")) return "Peinture";
  if (tags.includes("Sculpture") || /sculpt|modelage|céramique|poterie/i.test(record.title ?? "")) return "Sculpture";
  return "Multidisciplinaire";
}

// Le jeu de données met minuit quand il n'y a pas d'horaire : 10 h à Paris.
function startDate(iso: string): string {
  const date = new Date(iso);
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) date.setUTCHours(9);
  return date.toISOString();
}

function toEvent(record: QfapRecord, kind: "expo" | "workshop") {
  const title = (record.title ?? "").trim();
  const prefix = kind === "expo" ? "Exposition" : "Atelier";
  const lead = truncate(plainText(record.lead_text), DESCRIPTION_MAX);
  const date = startDate(record.date_start!);

  return {
    titre: new RegExp(`^${prefix}\\b`, "i").test(title) ? title : `${prefix} — ${title}`,
    description: [lead, record.url && `Source : ${record.url}`].filter(Boolean).join("\n"),
    type: kind,
    discipline: disciplineOf(record),
    ville: "Paris",
    date,
    date_fin: record.date_end && record.date_end > date ? record.date_end : null,
    lieu: [record.address_name, record.address_street, record.address_zipcode && `${record.address_zipcode} Paris`]
      .filter(Boolean)
      .join(", "),
    lat: record.lat_lon?.lat ?? null,
    lng: record.lat_lon?.lon ?? null,
    // « gratuit sous condition » reste sans prix : souvent payant pour un adulte.
    cout_type: record.price_type === "gratuit" || record.price_type === "payant" ? record.price_type : null,
    cout_detail: truncate(plainText(record.price_detail), 120) || null,
    source: "scraper",
  };
}

async function fetchRecords(now: number): Promise<QfapRecord[]> {
  const from = new Date(now - WINDOW_PAST_DAYS * DAY_MS).toISOString().slice(0, 10);
  const to = new Date(now + WINDOW_FUTURE_DAYS * DAY_MS).toISOString().slice(0, 10);
  const records: QfapRecord[] = [];

  for (let offset = 0; ; offset += PAGE) {
    const query = new URLSearchParams({
      limit: String(PAGE),
      offset: String(offset),
      where: `date_end >= now() and date_start >= date'${from}' and date_start <= date'${to}'`,
      order_by: "date_start",
    });
    const res = await fetch(`${API}?${query}`);
    if (!res.ok) throw new Error(`Que faire à Paris : ${res.status}`);
    const { results } = (await res.json()) as { results: QfapRecord[] };
    records.push(...results);
    if (results.length < PAGE) return records;
  }
}

export interface ImportOptions {
  dryRun: boolean;
  onLog?: (line: string) => void;
}

export async function importParisEvents({ dryRun, onLog }: ImportOptions) {
  const log = onLog ?? (() => {});
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  const supabase = createClient(url, serviceKey);

  const records = await fetchRecords(Date.now());
  const { data: seen, error: seenError } = await supabase
    .from("import_log")
    .select("external_id")
    .eq("source", SOURCE);
  if (seenError) throw seenError;
  const seenIds = new Set((seen ?? []).map((row) => row.external_id));

  const { data: existing, error: existingError } = await supabase.from("events").select("titre").eq("ville", "Paris");
  if (existingError) throw existingError;
  const knownTitles = (existing ?? []).map((row) => titleKey(row.titre));

  const usable = records.filter(
    (r) => !seenIds.has(r.id) && r.title && r.date_start && r.address_zipcode?.startsWith("75")
  );
  const pick = (kind: "expo" | "workshop", max: number) => {
    const picked: { record: QfapRecord; kind: "expo" | "workshop" }[] = [];
    const candidates = usable
      .filter((r) => kindOf(r) === kind)
      .sort((a, b) => artScore(b) - artScore(a));
    for (const record of candidates) {
      if (picked.length === max) break;
      const key = titleKey(record.title!);
      if (isDuplicate(key, knownTitles)) continue;
      knownTitles.push(key);
      picked.push({ record, kind });
    }
    return picked;
  };
  const selected = [...pick("expo", MAX_EXPOS), ...pick("workshop", MAX_ATELIERS)];

  let imported = 0;
  for (const { record, kind } of selected) {
    const event = toEvent(record, kind);
    if (dryRun) {
      log(`[dry-run] ${event.date.slice(0, 10)} ${event.discipline} ${event.cout_type ?? "?"} | ${event.titre}`);
      imported += 1;
      continue;
    }

    // Le trigger refuse les doublons par une exception : on passe au suivant.
    const { error } = await supabase.from("events").insert(event);
    if (error) log(`Ignoré (${error.message}) : ${event.titre}`);
    else imported += 1;

    const { error: logError } = await supabase.from("import_log").insert({ source: SOURCE, external_id: record.id });
    if (logError) throw logError;
  }

  log(`${records.length} fiches lues, ${imported} événement(s) ${dryRun ? "à importer" : "en attente de modération"}.`);
  return { read: records.length, imported, dryRun };
}
