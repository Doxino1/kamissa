"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm, EventFormValues } from "@/components/EventForm";
import { BackLink, PageHeader } from "@/components/PageHeader";
import { DANGER_ACTION } from "@/lib/form-styles";
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
  // Événement d'un autre membre ou importé, ouvert par un modérateur : lecture
  // et enregistrement passent par /api/moderation/events/[id].
  const [asModerator, setAsModerator] = useState(false);

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
          "titre, description, type, sous_type, discipline, ville, date, date_fin, lieu, soumis_par, cout_type, cout_detail, statut"
        )
        .eq("id", id)
        .single();

      let row = !error && data && data.soumis_par === user.id ? data : null;
      let viaModeration = false;
      if (!row) {
        const res = await fetch(`/api/moderation/events/${id}`);
        if (res.ok) {
          row = (await res.json()).event;
          viaModeration = true;
        }
      }

      if (!active) return;

      if (!row) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }
      const data2 = row;
      setAsModerator(viaModeration);

      const ville = data2.ville as Ville;
      const { date, time } = utcIsoToZonedParts(data2.date, VILLE_TIMEZONES[ville]);

      setWasPublished(data2.statut === "publie");
      setInitial({
        titre: data2.titre,
        description: data2.description ?? "",
        type: data2.type as EventType,
        sousType: (data2.sous_type as AnnouncementSubtype) ?? "oeuvre",
        discipline: data2.discipline ?? DISCIPLINES[0],
        ville,
        date,
        heure: time,
        dateFin: data2.date_fin ? utcIsoToZonedParts(data2.date_fin, VILLE_TIMEZONES[ville]).date : "",
        lieu: data2.lieu ?? "",
        coutType: (data2.cout_type as CoutType) ?? "",
        coutDetail: data2.cout_detail ?? "",
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
    const payload = {
      titre: values.titre,
      description: values.description,
      type: values.type,
      sous_type: values.type === "annonce" ? values.sousType : null,
      discipline: values.discipline,
      ville: values.ville,
      date: dateIso,
      date_fin:
        values.type === "expo" && values.dateFin
          ? zonedTimeToUtcIso(values.dateFin, "23:59", VILLE_TIMEZONES[values.ville])
          : null,
      lieu: values.lieu,
      cout_type: costEligible ? values.coutType || null : null,
      cout_detail: costEligible ? values.coutDetail || null : null,
    };

    if (asModerator) {
      const res = await fetch(`/api/moderation/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { error: res.ok ? null : ((await res.json()).error ?? "Error") };
    }

    const { error } = await supabase.from("events").update(payload).eq("id", id);

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
    if (asModerator) {
      const res = await fetch(`/api/moderation/events/${id}`, { method: "DELETE" });
      setWithdrawing(false);
      if (res.ok) router.push("/moderation");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    setWithdrawing(false);
    if (!error) router.push("/");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1360px] px-4 py-10 md:px-10">
        <p className="text-sm text-foreground-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (notAllowed || !initial) {
    return (
      <div className="mx-auto w-full max-w-[1360px] px-4 py-10 md:px-10">
        <p className="text-sm text-danger">404</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <PageHeader title={t.evenements.editLink} eyebrow={<BackLink href="/">{t.eventDetail.back}</BackLink>} />
      <main className="mx-auto max-w-[1360px] px-4 pt-8 md:px-10">
        <div className="max-w-[640px]">
          {asModerator && (
            <p className="mb-6 border-l-2 border-accent-secondary pl-4 text-sm text-text-soft">
              {t.moderation.editingAsModerator}
            </p>
          )}
          <EventForm
            initial={initial}
            submitLabel={t.profil.save}
            successMessage={t.moderation.saved}
            onSubmit={handleSubmit}
            extra={
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawing}
                className={`${DANGER_ACTION} mt-1 self-start disabled:opacity-50`}
              >
                {withdrawing ? "…" : t.evenements.withdrawLink}
              </button>
            }
          />
        </div>
      </main>
    </div>
  );
}
