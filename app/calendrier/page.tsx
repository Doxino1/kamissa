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
    <div className="pb-12">
      <EventCalendar
        events={loading || error ? [] : events}
        ville={ville}
        filterBar={<EventFilterBar filters={filters} />}
        status={
          <>
            {loading && <p className="pt-4 text-sm text-foreground-muted">{t.common.loading}</p>}
            {error && <p className="pt-4 text-sm text-danger">{t.evenements.loadError(error)}</p>}
          </>
        }
      />
    </div>
  );
}
