"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatInVille } from "@/lib/timezone";
import { useLocale } from "@/lib/i18n/context";
import { EventTypeBadge } from "@/components/EventTypeBadge";
import { EventType, Ville } from "@/lib/types";

interface PendingEvent {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  discipline: string | null;
  ville: Ville;
  date: string;
  lieu: string | null;
  profiles: { nom: string } | null;
}

interface PendingShop {
  id: string;
  nom: string;
  ville: Ville;
  adresse: string | null;
  description: string | null;
  lien: string | null;
  discipline: string | null;
  profiles: { nom: string } | null;
}

export default function ModerationPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [events, setEvents] = useState<PendingEvent[] | null>(null);
  const [shops, setShops] = useState<PendingShop[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const [eventsRes, shopsRes] = await Promise.all([
        fetch("/api/moderation/events"),
        fetch("/api/moderation/shops"),
      ]);

      if (eventsRes.status === 403 || shopsRes.status === 403) {
        router.push("/");
        return;
      }

      const eventsBody = await eventsRes.json();
      const shopsBody = await shopsRes.json();
      if (!active) return;

      if (!eventsRes.ok) {
        setError(eventsBody.error ?? "Error");
        return;
      }
      if (!shopsRes.ok) {
        setError(shopsBody.error ?? "Error");
        return;
      }

      setEvents(eventsBody.events);
      setShops(shopsBody.shops);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handlePublish(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/moderation/events/${id}`, { method: "PATCH" });
    setBusyId(null);
    if (res.ok) setEvents((prev) => (prev ?? []).filter((e) => e.id !== id));
  }

  async function handleReject(id: string) {
    if (!window.confirm(t.moderation.rejectConfirm)) return;
    setBusyId(id);
    const res = await fetch(`/api/moderation/events/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) setEvents((prev) => (prev ?? []).filter((e) => e.id !== id));
  }

  async function handlePublishShop(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/moderation/shops/${id}`, { method: "PATCH" });
    setBusyId(null);
    if (res.ok) setShops((prev) => (prev ?? []).filter((s) => s.id !== id));
  }

  async function handleRejectShop(id: string) {
    if (!window.confirm(t.moderation.shops.rejectConfirm)) return;
    setBusyId(id);
    const res = await fetch(`/api/moderation/shops/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) setShops((prev) => (prev ?? []).filter((s) => s.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-xl font-black">{t.moderation.title}</h1>

      {error && <p className="mt-6 text-sm text-red-600">{t.moderation.loadError(error)}</p>}
      {events === null && !error && <p className="mt-6 text-sm text-foreground-muted">{t.common.loading}</p>}
      {events !== null && events.length === 0 && (
        <p className="mt-6 text-sm text-foreground-muted">{t.moderation.empty}</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {(events ?? []).map((event) => (
          <div key={event.id} className="rounded-lg bg-surface p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
              <EventTypeBadge type={event.type as EventType} />
              <span>
                {formatInVille(
                  event.date,
                  event.ville,
                  { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                  locale
                )}
              </span>
            </div>
            <h3 className="mt-2 font-medium">{event.titre}</h3>
            <p className="mt-1 text-sm text-foreground-muted">
              {t.villeLabels[event.ville]} ·{" "}
              {event.discipline ? (t.disciplineLabels[event.discipline] ?? event.discipline) : ""} ·{" "}
              {event.lieu}
            </p>
            {event.description && <p className="mt-2 text-sm">{event.description}</p>}
            <p className="mt-2 text-xs text-foreground/40">
              {t.moderation.submittedBy(event.profiles?.nom ?? "—")}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyId === event.id}
                onClick={() => handlePublish(event.id)}
                className="rounded-lg bg-accent px-3 py-1 text-sm text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
              >
                {t.moderation.publish}
              </button>
              <button
                type="button"
                disabled={busyId === event.id}
                onClick={() => handleReject(event.id)}
                className="rounded-lg border border-red-600/40 px-3 py-1 text-sm text-red-600 transition hover:border-red-600 disabled:opacity-50"
              >
                {t.moderation.reject}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">{t.moderation.shops.title}</h2>
      {shops !== null && shops.length === 0 && (
        <p className="mt-4 text-sm text-foreground-muted">{t.moderation.shops.empty}</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {(shops ?? []).map((shop) => (
          <div key={shop.id} className="rounded-lg bg-surface p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
              <span>{t.villeLabels[shop.ville]}</span>
              {shop.discipline && <span>{t.disciplineLabels[shop.discipline] ?? shop.discipline}</span>}
            </div>
            <h3 className="mt-2 font-medium">{shop.nom}</h3>
            {shop.adresse && <p className="mt-1 text-sm text-foreground-muted">{shop.adresse}</p>}
            {shop.description && <p className="mt-2 text-sm">{shop.description}</p>}
            {shop.lien && (
              <a
                href={shop.lien}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm underline hover:text-foreground"
              >
                {shop.lien}
              </a>
            )}
            <p className="mt-2 text-xs text-foreground/40">
              {t.moderation.submittedBy(shop.profiles?.nom ?? "—")}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyId === shop.id}
                onClick={() => handlePublishShop(shop.id)}
                className="rounded-lg bg-accent px-3 py-1 text-sm text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
              >
                {t.moderation.publish}
              </button>
              <button
                type="button"
                disabled={busyId === shop.id}
                onClick={() => handleRejectShop(shop.id)}
                className="rounded-lg border border-red-600/40 px-3 py-1 text-sm text-red-600 transition hover:border-red-600 disabled:opacity-50"
              >
                {t.moderation.reject}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
