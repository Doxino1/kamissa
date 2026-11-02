"use client";

import { CalendarPlus, Download } from "lucide-react";
import { ArtEvent } from "@/lib/types";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import { useLocale } from "@/lib/i18n/context";

export function CalendarButtons({ event }: { event: ArtEvent }) {
  const { locale, t } = useLocale();

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={googleCalendarUrl(event, locale)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-10 items-center gap-1.5 rounded-full border border-foreground px-4 text-xs font-semibold uppercase tracking-[0.08em] transition hover:bg-surface-hover"
      >
        <CalendarPlus size={14} strokeWidth={1.75} />
        {t.eventDetail.addToGoogleCalendar}
      </a>
      <button
        type="button"
        onClick={() => downloadIcs(event, locale)}
        className="flex min-h-10 items-center gap-1.5 rounded-full border border-foreground px-4 text-xs font-semibold uppercase tracking-[0.08em] transition hover:bg-surface-hover"
      >
        <Download size={14} strokeWidth={1.75} />
        {t.eventDetail.addToAppleCalendar}
      </button>
    </div>
  );
}
