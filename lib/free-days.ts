import { VILLE_TIMEZONES } from "./timezone.ts";
import type { Ville } from "./types.ts";

// Gratuités récurrentes pour tous. Chaque règle vient de la page officielle du
// lieu, lue le 06/11/2026 : à revoir une ou deux fois par an. N'ajouter que ce
// qui est confirmé par le lieu lui-même, jamais depuis un guide (ils se
// contredisent, notamment pour Athènes, où rien n'a pu être confirmé).
export interface FreeDayRule {
  ville: Ville;
  lieu: string;
  weekday: number; // 0 = dimanche, 5 = vendredi : le premier du mois
  months?: number[]; // 1-12, tous les mois si absent
  fromHour?: number; // gratuit à partir de cette heure seulement
  reservation?: "required" | "recommended";
  url: string;
}

const SUNDAY = 0;
const FRIDAY = 5;

export const FREE_DAY_RULES: FreeDayRule[] = [
  {
    ville: "Paris",
    lieu: "Musée de l'Orangerie",
    weekday: SUNDAY,
    reservation: "required",
    url: "https://www.musee-orangerie.fr/fr/visite/tarifs-orangerie",
  },
  {
    ville: "Paris",
    lieu: "Musée Rodin",
    weekday: SUNDAY,
    months: [10, 11, 12, 1, 2, 3],
    url: "https://www.musee-rodin.fr/preparer-sa-visite/informations-pratiques/avez-vous-droit-gratuite",
  },
  {
    ville: "Paris",
    lieu: "Musée Picasso",
    weekday: SUNDAY,
    url: "https://www.museepicassoparis.fr/fr/tarifs",
  },
  {
    ville: "Paris",
    lieu: "Musée du quai Branly",
    weekday: SUNDAY,
    url: "https://www.quaibranly.fr/fr/informations-pratiques/venir/horaires-acces-et-tarifs/tarifs",
  },
  {
    ville: "Paris",
    lieu: "Musée Guimet",
    weekday: SUNDAY,
    url: "https://www.guimet.fr/fr/tarifs",
  },
  {
    ville: "Paris",
    lieu: "Musée du Louvre",
    weekday: FRIDAY,
    months: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
    fromHour: 18,
    reservation: "recommended",
    url: "https://www.louvre.fr/visiter/horaires-tarifs",
  },
];

export interface FreeDay {
  date: string; // midi UTC du jour concerné, pour formatInVille
  rule: FreeDayRule;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function zonedParts(time: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(new Date(time));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
  };
}

// Gratuités des `days` prochains jours (aujourd'hui compris), par date croissante.
export function upcomingFreeDays(ville: Ville, now: number, days = 7): FreeDay[] {
  const result: FreeDay[] = [];
  for (let i = 0; i < days; i += 1) {
    const { year, month, day, weekday } = zonedParts(now + i * DAY_MS, VILLE_TIMEZONES[ville]);
    if (day > 7) continue; // le « premier » jour d'une semaine tombe entre le 1er et le 7
    const date = new Date(Date.UTC(year, month - 1, day, 12)).toISOString();
    for (const rule of FREE_DAY_RULES) {
      if (rule.ville === ville && rule.weekday === weekday && (!rule.months || rule.months.includes(month))) {
        result.push({ date, rule });
      }
    }
  }
  return result;
}

// Regroupe par jour : un dimanche compte plusieurs lieux.
export function groupFreeDays(freeDays: FreeDay[]): { date: string; rules: FreeDayRule[] }[] {
  const groups: { date: string; rules: FreeDayRule[] }[] = [];
  for (const { date, rule } of freeDays) {
    const group = groups.find((g) => g.date === date);
    if (group) group.rules.push(rule);
    else groups.push({ date, rules: [rule] });
  }
  return groups;
}

export interface FreeDayLabels {
  fromHour: (hour: number) => string;
  reservationRequired: string;
  reservationRecommended: string;
}

// Précisions à afficher après le nom du lieu (heure, réservation).
export function freeDayNote(rule: FreeDayRule, labels: FreeDayLabels): string {
  const notes: string[] = [];
  if (rule.fromHour) notes.push(labels.fromHour(rule.fromHour));
  if (rule.reservation === "required") notes.push(labels.reservationRequired);
  if (rule.reservation === "recommended") notes.push(labels.reservationRecommended);
  return notes.join(", ");
}
