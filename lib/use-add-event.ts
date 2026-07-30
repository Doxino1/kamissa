"use client";

import { useRouter } from "next/navigation";
import { EventFormSubmitResult, EventFormValues, RecurrenceValue } from "@/components/EventForm";
import { createClient } from "@/lib/supabase/client";
import { VILLE_TIMEZONES, zonedTimeToUtcIso } from "@/lib/timezone";
import { geocode } from "@/lib/geocode";
import { useT } from "@/lib/i18n/context";
import { EVENT_TYPES_WITH_COST } from "@/lib/types";

// Logique de soumission partagée entre la page /evenements/nouveau et la
// modale d'ajout rapide déclenchée depuis le FAB de la page Événements.
export function useAddEventSubmit(recurrence: RecurrenceValue) {
  const t = useT();
  const router = useRouter();

  return async function handleSubmit(values: EventFormValues): Promise<EventFormSubmitResult> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return { error: null };
    }

    // L'heure saisie est l'heure locale de la ville de l'événement (pas celle
    // du navigateur qui soumet), convertie en instant UTC pour le stockage.
    const dateIso = zonedTimeToUtcIso(values.date, values.heure, VILLE_TIMEZONES[values.ville]);

    // Géocodage best-effort (Nominatim/OSM, gratuit, sans clé) — un échec ne
    // bloque pas la soumission, l'événement reste publiable sans pin carte.
    const coords = await geocode(`${values.lieu}, ${values.ville}`);

    const occurrences = recurrence.repeatWeekly ? recurrence.count : 1;
    const recurrenceGroupId = occurrences > 1 ? crypto.randomUUID() : null;
    const startDate = new Date(dateIso);
    const costEligible = EVENT_TYPES_WITH_COST.includes(values.type);

    const rows = Array.from({ length: occurrences }, (_, i) => {
      const occurrenceDate = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      return {
        titre: values.titre,
        description: values.description,
        type: values.type,
        sous_type: values.type === "annonce" ? values.sousType : null,
        discipline: values.discipline,
        ville: values.ville,
        date: occurrenceDate.toISOString(),
        lieu: values.lieu,
        soumis_par: user.id,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        recurrence_group_id: recurrenceGroupId,
        cout_type: costEligible ? values.coutType || null : null,
        cout_detail: costEligible ? values.coutDetail || null : null,
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from("events")
      .insert(rows)
      .select("id, statut");

    if (insertError) return { error: insertError.message };

    const autoPublished = inserted?.[0]?.statut === "publie";
    if (autoPublished) {
      fetch("/api/events/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: inserted!.map((r) => r.id) }),
      }).catch(() => {});
    }
    return { error: null, successMessage: autoPublished ? t.submission.submittedTrusted : t.submission.submitted };
  };
}
