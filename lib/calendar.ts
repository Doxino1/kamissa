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

export function googleCalendarUrl(event: ArtEvent, locale: Locale): string {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const dates = `${toIcsUtc(start)}/${toIcsUtc(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: localizedTitle(event, locale),
    dates,
    details: localizedDescription(event, locale),
    location: `${event.lieu}, ${event.ville}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsContent(event: ArtEvent, locale: Locale): string {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kamissa//FR",
    "BEGIN:VEVENT",
    `UID:${event.id}@kamissa`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(localizedTitle(event, locale))}`,
    `DESCRIPTION:${escapeIcsText(localizedDescription(event, locale))}`,
    `LOCATION:${escapeIcsText(`${event.lieu}, ${event.ville}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function downloadIcs(event: ArtEvent, locale: Locale) {
  const blob = new Blob([icsContent(event, locale)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.titre.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "evenement"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
