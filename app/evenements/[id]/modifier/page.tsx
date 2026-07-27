"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, EventFormValues } from "@/components/EventForm";
import { createClient } from "@/lib/supabase/client";
import { VILLE_TIMEZONES, utcIsoToZonedParts, zonedTimeToUtcIso } from "@/lib/timezone";
import { useT } from "@/lib/i18n/context";
import { AnnouncementSubtype, CoutType, DISCIPLINES, EventType, EVENT_TYPES_WITH_COST, Ville } from "@/lib/types";

export default function ModifierEvenementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [initial, setInitial] = useState<EventFormValues | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [wasPublished, setWasPublished] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select(
          "titre, description, type, sous_type, discipline, ville, date, lieu, soumis_par, cout_type, cout_detail, statut"
        )
        .eq("id", id)
        .single();

      if (!active) return;

      if (error || !data || data.soumis_par !== user.id) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      const ville = data.ville as Ville;
      const { date, time } = utcIsoToZonedParts(data.date, VILLE_TIMEZONES[ville]);

      setWasPublished(data.statut === "publie");
      setInitial({
        titre: data.titre,
        description: data.description ?? "",
        type: data.type as EventType,
        sousType: (data.sous_type as AnnouncementSubtype) ?? "oeuvre",
        discipline: data.discipline ?? DISCIPLINES[0],
        ville,
        date,
        heure: time,
        lieu: data.lieu ?? "",
        coutType: (data.cout_type as CoutType) ?? "",
        coutDetail: data.cout_detail ?? "",
      });
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [id, router]);

  async function handleSubmit(values: EventFormValues) {
    const supabase = createClient();
    const dateIso = zonedTimeToUtcIso(values.date, values.heure, VILLE_TIMEZONES[values.ville]);
    const costEligible = EVENT_TYPES_WITH_COST.includes(values.type);

    const { error } = await supabase
      .from("events")
      .update({
        titre: values.titre,
        description: values.description,
        type: values.type,
        sous_type: values.type === "annonce" ? values.sousType : null,
        discipline: values.discipline,
        ville: values.ville,
        date: dateIso,
        lieu: values.lieu,
        cout_type: costEligible ? values.coutType || null : null,
        cout_detail: costEligible ? values.coutDetail || null : null,
      })
      .eq("id", id);

    if (!error && wasPublished) {
      fetch("/api/events/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      }).catch(() => {});
    }

    return { error: error ? error.message : null };
  }

  async function handleWithdraw() {
    if (!window.confirm(t.evenements.withdrawConfirm)) return;
    setWithdrawing(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    setWithdrawing(false);
    if (!error) router.push("/");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-8">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (notAllowed || !initial) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-8">
        <p className="text-sm text-red-600">404</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <h1 className="text-xl font-semibold">{t.evenements.editLink}</h1>

      <EventForm
        initial={initial}
        submitLabel={t.profil.save}
        successMessage={t.profil.saved}
        onSubmit={handleSubmit}
        extra={
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="mt-1 self-start text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {withdrawing ? "…" : t.evenements.withdrawLink}
          </button>
        }
      />
    </div>
  );
}
