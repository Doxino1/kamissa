import { ArtEvent } from "./types";
import type { Locale } from "./i18n/dictionary";
import { localizedTitle, localizedDescription } from "./localize-event";

// Pas de champ durée en base : on suppose 2h, une estimation raisonnable
// pour un vernissage/atelier/expo (l'utilisateur ajuste dans son propre
// agenda si besoin).
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Beaucoup de lieux contiennent déjà la ville (« Musée du Louvre, Paris »).
function eventLocation(event: ArtEvent): string {
  if (!event.lieu) return event.ville;
  return event.lieu.includes(event.ville) ? event.lieu : `${event.lieu}, ${event.ville}`;
}

export function googleCalendarUrl(event: ArtEvent, locale: Locale): string {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const dates = `${toIcsUtc(start)}/${toIcsUtc(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: localizedTitle(event, locale),
    dates,
    details: localizedDescription(event, locale),
    location: eventLocation(event),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// RFC 5545 : une ligne ne dépasse pas 75 octets, la suite repart sur une
// ligne commençant par une espace. On coupe par caractère pour ne jamais
// scinder un caractère accentué ou grec (plusieurs octets en UTF-8).
function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function icsContent(event: ArtEvent, locale: Locale): string {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kamissa//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@kamissa`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(localizedTitle(event, locale))}`,
    `DESCRIPTION:${escapeIcsText(localizedDescription(event, locale))}`,
    `LOCATION:${escapeIcsText(eventLocation(event))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

export function icsFileName(event: ArtEvent): string {
  return `${event.titre.normalize("NFD").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "evenement"}.ics`;
}

// Fichier servi par app/api/events/[id]/ics : sur iPhone, Safari ne propose
// « Ajouter au calendrier » que pour un vrai lien vers un fichier text/calendar,
// pas pour un fichier fabriqué dans la page et téléchargé.
export function icsUrl(event: ArtEvent, locale: Locale): string {
  return `/api/events/${event.id}/ics?lang=${locale}`;
}
