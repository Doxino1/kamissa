"use client";

import { useState } from "react";
import { VILLE_TIMEZONES } from "@/lib/timezone";
import { useT } from "@/lib/i18n/context";
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
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <input
        type="text"
        required
        placeholder={t.submission.titre}
        value={values.titre}
        onChange={(e) => set("titre", e.target.value)}
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
      />

      <textarea
        placeholder={t.submission.description}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        rows={3}
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
      />

      <select
        value={values.type}
        onChange={(e) => set("type", e.target.value as EventType)}
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
      >
        {Object.entries(t.eventTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {EVENT_TYPES_WITH_COST.includes(values.type) && (
        <>
          <select
            required
            aria-label={t.submission.coutLabel}
            value={values.coutType}
            onChange={(e) => set("coutType", e.target.value as CoutType)}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
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
            value={values.coutDetail}
            onChange={(e) => set("coutDetail", e.target.value)}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </>
      )}

      {values.type === "annonce" && (
        <>
          <select
            value={values.sousType}
            onChange={(e) => set("sousType", e.target.value as AnnouncementSubtype)}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          >
            {Object.entries(t.announcementSubtypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="rounded-lg bg-foreground/5 px-3 py-2 text-xs text-foreground-muted">
            {t.submission.annonceDisclaimer}
          </p>
        </>
      )}

      <select
        value={values.discipline}
        onChange={(e) => set("discipline", e.target.value)}
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
      >
        {DISCIPLINES.map((d) => (
          <option key={d} value={d}>
            {t.disciplineLabels[d]}
          </option>
        ))}
      </select>

      <select
        value={values.ville}
        onChange={(e) => set("ville", e.target.value as Ville)}
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
      >
        {VILLES.map((v) => (
          <option key={v} value={v}>
            {t.villeLabels[v]}
          </option>
        ))}
      </select>

      <input
        type="text"
        required
        placeholder={t.submission.lieu}
        value={values.lieu}
        onChange={(e) => set("lieu", e.target.value)}
        className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
      />

      <div className="flex gap-2">
        <input
          type="date"
          required
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          className="w-1/2 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
        <input
          type="time"
          required
          value={values.heure}
          onChange={(e) => set("heure", e.target.value)}
          className="w-1/2 rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />
      </div>
      <p className="text-xs text-foreground/50">
        {t.submission.heureLocale(t.villeLabels[values.ville], VILLE_TIMEZONES[values.ville])}
      </p>

      {recurrence && onRecurrenceChange && (
        <div className="rounded-lg border border-foreground/10 p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recurrence.repeatWeekly}
              onChange={(e) => onRecurrenceChange({ ...recurrence, repeatWeekly: e.target.checked })}
            />
            {t.submission.repeatWeekly}
          </label>
          {recurrence.repeatWeekly && (
            <>
              <label className="mt-2 block text-xs text-foreground-muted">
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
                  className="mt-1 w-20 rounded-lg border border-foreground/20 bg-transparent px-2 py-1 text-sm"
                />
              </label>
              <p className="mt-1 text-xs text-foreground/50">{t.submission.repeatHint}</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "…" : submitLabel}
      </button>

      {extra}
    </form>
  );
}
