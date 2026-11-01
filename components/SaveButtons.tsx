"use client";

import { SavedStatus } from "@/lib/types";
import { useT } from "@/lib/i18n/context";

interface SaveButtonsProps {
  status?: SavedStatus;
  onChange: (status: SavedStatus | null) => void;
}

const PILL = "min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.08em] transition";

export function SaveButtons({ status, onChange }: SaveButtonsProps) {
  const t = useT();

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        type="button"
        aria-pressed={status === "sauvegarde"}
        onClick={() => onChange(status === "sauvegarde" ? null : "sauvegarde")}
        className={`${PILL} ${
          status === "sauvegarde"
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-transparent text-foreground hover:border-foreground"
        }`}
      >
        {status === "sauvegarde" ? t.saveButtons.sauvegarde : t.saveButtons.sauvegarder}
      </button>
      <button
        type="button"
        aria-pressed={status === "je_viens"}
        onClick={() => onChange(status === "je_viens" ? null : "je_viens")}
        className={`${PILL} ${
          status === "je_viens"
            ? "border-accent-secondary bg-accent-secondary text-accent-secondary-foreground"
            : "border-border bg-transparent text-foreground hover:border-foreground"
        }`}
      >
        {status === "je_viens" ? t.saveButtons.jeViensActif : t.saveButtons.jeViens}
      </button>
    </div>
  );
}
