"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { EventForm, EventFormValues, RecurrenceValue } from "./EventForm";
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

export function AddEventModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [recurrence, setRecurrence] = useState<RecurrenceValue>({ repeatWeekly: false, count: 4 });
  const handleSubmit = useAddEventSubmit(recurrence);

  return (
    <Modal title={t.modal.addEventTitle} onClose={onClose}>
      <EventForm
        initial={INITIAL}
        submitLabel={t.submission.submit}
        successMessage={t.submission.submitted}
        onSubmit={handleSubmit}
        recurrence={recurrence}
        onRecurrenceChange={setRecurrence}
      />
    </Modal>
  );
}
