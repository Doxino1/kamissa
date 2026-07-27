import { ArtEvent } from "./types";

interface EventRow {
  id: string;
  titre: string;
  description: string | null;
  type: ArtEvent["type"];
  sous_type: ArtEvent["sousType"] | null;
  discipline: string | null;
  ville: string;
  date: string;
  lieu: string | null;
  lat: number | null;
  lng: number | null;
  cout_type: ArtEvent["coutType"] | null;
  cout_detail: string | null;
  titre_en: string | null;
  titre_el: string | null;
  description_en: string | null;
  description_el: string | null;
}

export function mapEventRow(row: EventRow): ArtEvent {
  return {
    id: row.id,
    titre: row.titre,
    description: row.description ?? "",
    type: row.type,
    sousType: row.sous_type ?? undefined,
    discipline: row.discipline ?? "",
    ville: row.ville as ArtEvent["ville"],
    date: row.date,
    lieu: row.lieu ?? "",
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    coutType: row.cout_type ?? null,
    coutDetail: row.cout_detail ?? null,
    titreEn: row.titre_en,
    titreEl: row.titre_el,
    descriptionEn: row.description_en,
    descriptionEl: row.description_el,
  };
}
