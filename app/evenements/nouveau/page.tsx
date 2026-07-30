"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, EventFormValues, RecurrenceValue } from "@/components/EventForm";
import { createClient } from "@/lib/supabase/client";
import { useAddEventSubmit } from "@/lib/use-add-event";
import { useT } from "@/lib/i18n/context";
import { DISCIPLINES } from "@/lib/types";

const INITIAL: EventFormValues = {
  titre: "",
  description: "",
  type: "vernissage",
  sousType: "oeuvre",
  discipline: DISCIPLINES[0],
  ville: "Paris",
  date: "",
  heure: "19:00",
  lieu: "",
  coutType: "",
  coutDetail: "",
};

export default function NouvelEvenementPage() {
  const t = useT();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [recurrence, setRecurrence] = useState<RecurrenceValue>({ repeatWeekly: false, count: 4 });

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!active) return;
        if (!user) {
          router.push("/login");
          return;
        }
        setCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = useAddEventSubmit(recurrence);

  if (checkingAuth) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-8">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <h1 className="text-xl font-semibold">{t.submission.title}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{t.submission.subtitle}</p>

      <EventForm
        initial={INITIAL}
        submitLabel={t.submission.submit}
        successMessage={t.submission.submitted}
        resetOnSuccess
        onSubmit={handleSubmit}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
      />
    </div>
  );
}
