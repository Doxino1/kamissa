"use client";

import { useState } from "react";
import { EventCalendar } from "@/components/EventCalendar";
import { EventFilterBar } from "@/components/EventFilterBar";
import { useEvents } from "@/lib/use-events";
import { useEventFilters } from "@/lib/use-event-filters";
import { useT } from "@/lib/i18n/context";

export default function CalendrierPage() {
  const t = useT();
  const { events: allEvents, loading, error } = useEvents();
  const [now] = useState(() => Date.now());
  const filters = useEventFilters(allEvents, now);
  const { ville, events } = filters;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="font-display text-xl font-black">{t.calendar.tab}</h1>

      <div className="mt-4">
        <EventFilterBar filters={filters} />
      </div>

      {loading && <p className="text-sm text-foreground-muted">{t.common.loading}</p>}
      {error && <p className="text-sm text-red-600">{t.evenements.loadError(error)}</p>}
      {!loading && !error && <EventCalendar events={events} ville={ville} />}
    </div>
  );
}
