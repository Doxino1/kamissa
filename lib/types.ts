export type EventType = "vernissage" | "expo" | "workshop" | "open_call" | "residency" | "annonce";
export type AnnouncementSubtype = "oeuvre" | "materiel" | "atelier";
export type SavedStatus = "sauvegarde" | "je_viens";
export type ProfileType = "artiste_pro" | "amateur" | "galerie" | "institution" | "curateur";
export type MatchingTag = "atelier_partage" | "collaborations" | "mentorat";
export type CoutType = "gratuit" | "payant";

// Types d'événements pour lesquels le champ coût a un sens — les autres
// (vernissage/expo/annonce) ne l'affichent jamais, cf. contrainte SQL
// cout_only_for_paid_types (migration 0024).
export const EVENT_TYPES_WITH_COST: EventType[] = ["workshop", "open_call", "residency"];

export type Ville = "Paris" | "Athènes";

export interface ArtEvent {
  id: string;
  titre: string;
  description: string;
  type: EventType;
  sousType?: AnnouncementSubtype;
  discipline: string;
  ville: Ville;
  date: string; // ISO 8601
  lieu: string;
  lat?: number;
  lng?: number;
  coutType?: CoutType | null;
  coutDetail?: string | null;
  titreEn?: string | null;
  titreEl?: string | null;
  descriptionEn?: string | null;
  descriptionEl?: string | null;
}

// Valeurs canoniques stockées en base — l'affichage localisé vit dans
// lib/i18n/dictionary.ts (eventTypeLabels, disciplineLabels, etc.).
export const EVENT_TYPES: EventType[] = ["vernissage", "expo", "workshop", "open_call", "residency", "annonce"];
export const DISCIPLINES = ["Peinture", "Sculpture", "Performance", "Multidisciplinaire"] as const;
// Catégories des boutiques de matériel : distinctes des disciplines des
// événements (on n'achète pas de matériel de « performance », mais il existe
// des boutiques de poterie, de broderie ou de costumes). Libellés dans
// disciplineLabels, couleurs dans lib/shop-colors.ts.
export const SHOP_CATEGORIES = ["Peinture", "Sculpture", "Poterie", "Broderie", "Costumes", "Multidisciplinaire"] as const;
export const ANNOUNCEMENT_SUBTYPES: AnnouncementSubtype[] = ["oeuvre", "materiel", "atelier"];
export const PROFILE_TYPES: ProfileType[] = [
  "artiste_pro",
  "amateur",
  "galerie",
  "institution",
  "curateur",
];
export const MATCHING_TAGS: MatchingTag[] = ["atelier_partage", "collaborations", "mentorat"];
