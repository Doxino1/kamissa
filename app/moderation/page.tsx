"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LinkifiedText } from "@/components/LinkifiedText";
import { formatInVille } from "@/lib/timezone";
import { useLocale } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { EventTypeBadge } from "@/components/EventTypeBadge";
import { EventType, Ville } from "@/lib/types";
import { PageHeader, TAB_NUMBER } from "@/components/PageHeader";
import { META, SECONDARY_BUTTON, TEXT_ACTION } from "@/lib/form-styles";
import { ModeratorsSection } from "@/components/ModeratorsSection";
import { createClient } from "@/lib/supabase/client";

const REPORT_LABELS: Record<Report["motif"], (t: Dictionary) => string> = {
  spam: (t) => t.safety.reportReasonSpam,
  comportement: (t) => t.safety.reportReasonBehavior,
  usurpation: (t) => t.safety.reportReasonImpersonation,
  autre: (t) => t.safety.reportReasonOther,
};

const CARD = "flex flex-col gap-2 border-b border-border py-6";
const ITEM_TITLE = "font-display text-[30px] leading-tight";
const PUBLISH =
  "min-h-10 rounded-full bg-foreground px-[18px] text-xs font-semibold uppercase tracking-[0.1em] text-background transition hover:bg-accent-hover disabled:opacity-50";
const REJECT =
  "min-h-10 rounded-full border border-danger px-[18px] text-xs font-semibold uppercase tracking-[0.1em] text-danger transition hover:bg-danger hover:text-white disabled:opacity-50";
const SECTION_HEADING =
  "mt-10 flex items-baseline gap-2.5 border-b border-foreground pb-4 font-display text-[28px] md:text-[40px]";

interface PendingEvent {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  discipline: string | null;
  ville: Ville;
  date: string;
  date_fin: string | null;
  lieu: string | null;
  cout_type: "gratuit" | "payant" | null;
  cout_detail: string | null;
  source: string;
  profiles: { nom: string } | null;
}

interface Report {
  id: string;
  motif: "spam" | "comportement" | "usurpation" | "autre";
  description: string | null;
  created_at: string;
  reported_user_id: string;
  reported: { nom: string } | null;
  reporter: { nom: string } | null;
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
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      createClient()
        .auth.getUser()
        .then(({ data }) => {
          if (active) setCurrentUserId(data.user?.id ?? null);
        });

      const [eventsRes, shopsRes, reportsRes] = await Promise.all([
        fetch("/api/moderation/events"),
        fetch("/api/moderation/shops"),
        fetch("/api/moderation/reports"),
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
      if (reportsRes.ok) setReports((await reportsRes.json()).reports);
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

  async function handleResolveReport(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/moderation/reports/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) setReports((prev) => (prev ?? []).filter((r) => r.id !== id));
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
    <div className="pb-16">
      <PageHeader title={t.moderation.title} />
      <main className="mx-auto max-w-[1360px] px-4 md:px-10">
        <h2 className={SECTION_HEADING}>
          <span className={TAB_NUMBER}>( 01 )</span>
          {t.nav.evenements}
        </h2>
        {error && <p className="mt-6 text-sm text-danger">{t.moderation.loadError(error)}</p>}
        {events === null && !error && <p className="mt-6 text-sm text-foreground-muted">{t.common.loading}</p>}
        {events !== null && events.length === 0 && (
          <p className="mt-6 text-sm text-foreground-muted">{t.moderation.empty}</p>
        )}

        <div className="flex max-w-[860px] flex-col">
          {(events ?? []).map((event) => (
            <div key={event.id} className={CARD}>
              <div className={`flex items-center justify-between gap-2 ${META}`}>
                <EventTypeBadge type={event.type as EventType} />
                <span>
                  {formatInVille(
                    event.date,
                    event.ville,
                    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                    locale
                  )}
                  {event.date_fin &&
                    ` → ${formatInVille(event.date_fin, event.ville, { day: "numeric", month: "short", year: "numeric" }, locale)}`}
                </span>
              </div>
              <h3 className={ITEM_TITLE}>{event.titre}</h3>
              <p className="text-sm text-foreground-muted">
                {t.villeLabels[event.ville]} ·{" "}
                {event.discipline ? (t.disciplineLabels[event.discipline] ?? event.discipline) : ""} · {event.lieu}
                {event.cout_type && ` · ${t.coutLabels[event.cout_type]}`}
                {event.cout_detail && ` (${event.cout_detail})`}
              </p>
              {event.description && (
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-text-soft">
                  <LinkifiedText text={event.description} />
                </p>
              )}
              <p className={META}>{t.moderation.submittedBy(event.profiles?.nom ?? "—")}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === event.id}
                  onClick={() => handlePublish(event.id)}
                  className={PUBLISH}
                >
                  {t.moderation.publish}
                </button>
                <button
                  type="button"
                  disabled={busyId === event.id}
                  onClick={() => handleReject(event.id)}
                  className={REJECT}
                >
                  {t.moderation.reject}
                </button>
                <Link href={`/evenements/${event.id}/modifier`} className={`${SECONDARY_BUTTON} min-h-10`}>
                  {t.moderation.edit}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <h2 className={SECTION_HEADING}>
          <span className={TAB_NUMBER}>( 02 )</span>
          {t.moderation.shops.title}
        </h2>
        {shops !== null && shops.length === 0 && (
          <p className="mt-4 text-sm text-foreground-muted">{t.moderation.shops.empty}</p>
        )}

        <div className="flex max-w-[860px] flex-col">
          {(shops ?? []).map((shop) => (
            <div key={shop.id} className={CARD}>
              <div className={`flex items-center justify-between gap-2 ${META}`}>
                <span>{t.villeLabels[shop.ville]}</span>
                {shop.discipline && <span>{t.disciplineLabels[shop.discipline] ?? shop.discipline}</span>}
              </div>
              <h3 className={ITEM_TITLE}>{shop.nom}</h3>
              {shop.adresse && <p className="text-sm text-foreground-muted">{shop.adresse}</p>}
              {shop.description && <p className="text-[15px] leading-relaxed text-text-soft">{shop.description}</p>}
              {shop.lien && (
                <a
                  href={shop.lien}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm underline underline-offset-4 hover:text-foreground"
                >
                  {shop.lien}
                </a>
              )}
              <p className={META}>{t.moderation.submittedBy(shop.profiles?.nom ?? "—")}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === shop.id}
                  onClick={() => handlePublishShop(shop.id)}
                  className={PUBLISH}
                >
                  {t.moderation.publish}
                </button>
                <button
                  type="button"
                  disabled={busyId === shop.id}
                  onClick={() => handleRejectShop(shop.id)}
                  className={REJECT}
                >
                  {t.moderation.reject}
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className={SECTION_HEADING}>
          <span className={TAB_NUMBER}>( 03 )</span>
          {t.moderation.reports.title}
        </h2>
        {reports !== null && reports.length === 0 && (
          <p className="mt-6 text-sm text-foreground-muted">{t.moderation.reports.empty}</p>
        )}
        <div className="flex max-w-[860px] flex-col">
          {(reports ?? []).map((report) => (
            <div key={report.id} className={CARD}>
              <div className={`flex items-center justify-between gap-2 ${META}`}>
                <span>{REPORT_LABELS[report.motif](t)}</span>
                <span>{formatInVille(report.created_at, "Paris", { day: "numeric", month: "short" }, locale)}</span>
              </div>
              <p className="text-sm text-foreground-muted">
                {t.moderation.reports.reported} :{" "}
                <Link
                  href={`/artistes/${report.reported_user_id}`}
                  className="font-semibold text-foreground underline underline-offset-4"
                >
                  {report.reported?.nom ?? "—"}
                </Link>{" "}
                {t.moderation.reports.by(report.reporter?.nom ?? "—")}
              </p>
              {report.description && <p className="text-[15px] leading-relaxed text-text-soft">{report.description}</p>}
              <div className="mt-2">
                <button
                  type="button"
                  disabled={busyId === report.id}
                  onClick={() => handleResolveReport(report.id)}
                  className={TEXT_ACTION}
                >
                  {t.moderation.reports.resolve}
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className={SECTION_HEADING}>
          <span className={TAB_NUMBER}>( 04 )</span>
          {t.moderation.moderators.title}
        </h2>
        <ModeratorsSection currentUserId={currentUserId} />
      </main>
    </div>
  );
}
