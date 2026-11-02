"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, EventFormValues, RecurrenceValue } from "@/components/EventForm";
import { BackLink, PageHeader } from "@/components/PageHeader";
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
  const [recurrence, setRecurrence] = useState<RecurrenceValue>({
    repeatWeekly: false,
    count: 4,
  });

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
      <div className="mx-auto w-full max-w-[1360px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <PageHeader
        title={t.submission.title}
        subtitle={t.submission.subtitle}
        eyebrow={<BackLink href="/">{t.eventDetail.back}</BackLink>}
      />
      <main className="mx-auto max-w-[1360px] px-4 pt-8 md:px-10">
        <div className="max-w-[640px]">
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
      </main>
    </div>
  );
}
