// Un événement a une date de début et, s'il dure (exposition), une date de fin.
interface EventDates {
  date: string;
  dateFin?: string | null;
}

// Fin effective : date_fin, ou la date elle-même pour un événement ponctuel.
export function eventEndTime(event: EventDates): number {
  return new Date(event.dateFin ?? event.date).getTime();
}

// Déjà ouvert et encore en cours : on affiche alors « Jusqu'au … ».
export function isOngoing(event: EventDates, now = Date.now()): boolean {
  return !!event.dateFin && new Date(event.date).getTime() < now && eventEndTime(event) >= now;
}

// Ordre des listes : à venir selon leur début, en cours selon leur clôture.
export function eventSortTime(event: EventDates, now: number): number {
  return isOngoing(event, now) ? eventEndTime(event) : new Date(event.date).getTime();
}
