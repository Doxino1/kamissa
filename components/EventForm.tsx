"use client";

import { useState } from "react";
import { VILLE_TIMEZONES } from "@/lib/timezone";
import { useT } from "@/lib/i18n/context";
import { FIELD_HINT, FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA, PRIMARY_BUTTON } from "@/lib/form-styles";
import { EVENT_TYPE_SQUARE_STYLES } from "./EventTypeBadge";
import { AnnouncementSubtype, CoutType, DISCIPLINES, EventType, EVENT_TYPES_WITH_COST, Ville } from "@/lib/types";

const VILLES: Ville[] = ["Paris", "Athènes"];

export interface EventFormValues {
  titre: string;
  description: string;
  type: EventType;
  sousType: AnnouncementSubtype;
  discipline: string;
  ville: Ville;
  date: string;
  heure: string;
  lieu: string;
  coutType: CoutType | "";
  coutDetail: string;
}

export interface RecurrenceValue {
  repeatWeekly: boolean;
  count: number;
}

export interface EventFormSubmitResult {
  error: string | null;
  // Permet à l'appelant de personnaliser le message de succès selon le
  // résultat réel de la soumission (ex : publication immédiate pour un
  // contributeur de confiance) plutôt que d'afficher un texte statique
  // potentiellement faux.
  successMessage?: string;
}

interface EventFormProps {
  initial: EventFormValues;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => Promise<EventFormSubmitResult>;
  successMessage?: string;
  resetOnSuccess?: boolean;
  extra?: React.ReactNode;
  recurrence?: RecurrenceValue;
  onRecurrenceChange?: (value: RecurrenceValue) => void;
}

const MAX_RECURRENCE_COUNT = 12;

export function EventForm({
  initial,
  submitLabel,
  onSubmit,
  successMessage,
  resetOnSuccess,
  extra,
  recurrence,
  onRecurrenceChange,
}: EventFormProps) {
  const t = useT();
  const [values, setValues] = useState<EventFormValues>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await onSubmit(values);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const finalMessage = result.successMessage ?? successMessage;
    if (finalMessage) setMessage(finalMessage);
    if (resetOnSuccess) setValues(initial);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
      <input
        type="text"
        required
        placeholder={t.submission.titre}
        aria-label={t.submission.titre}
        value={values.titre}
        onChange={(e) => set("titre", e.target.value)}
        className={FIELD_INPUT}
      />

      <textarea
        placeholder={t.submission.description}
        aria-label={t.submission.description}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        rows={3}
        className={FIELD_TEXTAREA}
      />

      {/* Catégorie en pastilles, chacune précédée de son carré de couleur. */}
      <div role="radiogroup" className="flex flex-wrap gap-2">
        {(Object.entries(t.eventTypeLabels) as [EventType, string][]).map(([value, label]) => {
          const active = values.type === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set("type", value)}
              className={`flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-foreground hover:border-foreground"
              }`}
            >
              <span aria-hidden="true" className={`h-2 w-2 ${EVENT_TYPE_SQUARE_STYLES[value]}`} />
              {label}
            </button>
          );
        })}
      </div>

      {EVENT_TYPES_WITH_COST.includes(values.type) && (
        <div className="grid gap-x-6 gap-y-[22px] sm:grid-cols-2">
          <select
            required
            aria-label={t.submission.coutLabel}
            value={values.coutType}
            onChange={(e) => set("coutType", e.target.value as CoutType)}
            className={FIELD_INPUT}
          >
            <option value="" disabled>
              {t.submission.coutPlaceholder}
            </option>
            {Object.entries(t.coutLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t.submission.coutDetailPlaceholder}
            aria-label={t.submission.coutDetailPlaceholder}
            value={values.coutDetail}
            onChange={(e) => set("coutDetail", e.target.value)}
            className={FIELD_INPUT}
          />
        </div>
      )}

      {values.type === "annonce" && (
        <>
          <select
            value={values.sousType}
            onChange={(e) => set("sousType", e.target.value as AnnouncementSubtype)}
            className={FIELD_INPUT}
          >
            {Object.entries(t.announcementSubtypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="border-l border-foreground pl-3 text-xs text-text-soft">{t.submission.annonceDisclaimer}</p>
        </>
      )}

      <div className="grid gap-x-6 gap-y-[22px] sm:grid-cols-2">
        <select value={values.discipline} onChange={(e) => set("discipline", e.target.value)} className={FIELD_INPUT}>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>
              {t.disciplineLabels[d]}
            </option>
          ))}
        </select>

        <select value={values.ville} onChange={(e) => set("ville", e.target.value as Ville)} className={FIELD_INPUT}>
          {VILLES.map((v) => (
            <option key={v} value={v}>
              {t.villeLabels[v]}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        required
        placeholder={t.submission.lieu}
        aria-label={t.submission.lieu}
        value={values.lieu}
        onChange={(e) => set("lieu", e.target.value)}
        className={FIELD_INPUT}
      />

      <div>
        <div className="grid grid-cols-2 gap-6">
          <input
            type="date"
            required
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
            className={FIELD_INPUT}
          />
          <input
            type="time"
            required
            value={values.heure}
            onChange={(e) => set("heure", e.target.value)}
            className={FIELD_INPUT}
          />
        </div>
        <p className={`mt-2 ${FIELD_HINT}`}>
          {t.submission.heureLocale(t.villeLabels[values.ville], VILLE_TIMEZONES[values.ville])}
        </p>
      </div>

      {recurrence && onRecurrenceChange && (
        <div className="border-t border-border pt-4">
          <label className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.08em]">
            <input
              type="checkbox"
              checked={recurrence.repeatWeekly}
              onChange={(e) => onRecurrenceChange({ ...recurrence, repeatWeekly: e.target.checked })}
              className="h-4 w-4 accent-foreground"
            />
            {t.submission.repeatWeekly}
          </label>
          {recurrence.repeatWeekly && (
            <>
              <label className={`mt-3 flex items-center gap-3 ${FIELD_LABEL}`}>
                {t.submission.repeatCountLabel}
                <input
                  type="number"
                  min={2}
                  max={MAX_RECURRENCE_COUNT}
                  value={recurrence.count}
                  onChange={(e) =>
                    onRecurrenceChange({
                      ...recurrence,
                      count: Math.min(MAX_RECURRENCE_COUNT, Math.max(2, Number(e.target.value) || 2)),
                    })
                  }
                  className="min-h-10 w-20 border-0 border-b border-foreground bg-transparent font-display text-2xl text-foreground outline-none"
                />
              </label>
              <p className={`mt-1.5 ${FIELD_HINT}`}>{t.submission.repeatHint}</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      {message && <p className="text-sm font-semibold text-accent-secondary">{message}</p>}

      <button type="submit" disabled={loading} className={`mt-2.5 ${PRIMARY_BUTTON}`}>
        {loading ? "…" : submitLabel}
      </button>

      {extra}
    </form>
  );
}
