"use client";

import { Fragment } from "react";
import { useLocale } from "@/lib/i18n/context";
import { formatInVille } from "@/lib/timezone";
import { freeDayNote, groupFreeDays, upcomingFreeDays } from "@/lib/free-days";
import { Ville } from "@/lib/types";

// Rappel des gratuités récurrentes de la semaine, au-dessus de la liste.
export function FreeDaysNotice({ ville, now }: { ville: Ville; now: number }) {
  const { locale, t } = useLocale();
  const groups = groupFreeDays(upcomingFreeDays(ville, now));
  if (groups.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1360px] border-b border-border px-4 py-3.5 md:px-10">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-secondary">
        {t.freeDays.title}
      </h2>
      {groups.map(({ date, rules }) => (
        <p key={date} className="mt-1 text-sm text-text-soft">
          <span className="inline-block font-semibold text-foreground first-letter:uppercase">
            {formatInVille(date, ville, { weekday: "long", day: "numeric", month: "long" }, locale)}
          </span>
          {" : "}
          {rules.map((rule, i) => {
            const note = freeDayNote(rule, t.freeDays);
            return (
              <Fragment key={rule.lieu}>
                {i > 0 && ", "}
                <a
                  href={rule.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-1 underline-offset-4 hover:text-foreground"
                >
                  {rule.lieu}
                </a>
                {note && ` (${note})`}
              </Fragment>
            );
          })}
        </p>
      ))}
    </section>
  );
}
