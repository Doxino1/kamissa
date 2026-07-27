import type { Locale } from "./i18n/dictionary";

interface LocalizableTitle {
  titre: string;
  titreEn?: string | null;
  titreEl?: string | null;
}

interface LocalizableDescription {
  description: string;
  descriptionEn?: string | null;
  descriptionEl?: string | null;
}

// Retombe toujours sur le texte original (français) si aucune traduction
// n'est disponible pour la langue courante — un événement jamais traduit
// (DEEPL_API_KEY absente, traduction en attente, échec d'appel) reste donc
// toujours lisible, jamais vide.
export function localizedTitle(event: LocalizableTitle, locale: Locale): string {
  if (locale === "en" && event.titreEn) return event.titreEn;
  if (locale === "el" && event.titreEl) return event.titreEl;
  return event.titre;
}

export function localizedDescription(event: LocalizableDescription, locale: Locale): string {
  if (locale === "en" && event.descriptionEn) return event.descriptionEn;
  if (locale === "el" && event.descriptionEl) return event.descriptionEl;
  return event.description;
}
