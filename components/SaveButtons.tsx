"use client";

import { SavedStatus } from "@/lib/types";
import { useT } from "@/lib/i18n/context";

interface SaveButtonsProps {
  status?: SavedStatus;
  onChange: (status: SavedStatus | null) => void;
}

export function SaveButtons({ status, onChange }: SaveButtonsProps) {
  const t = useT();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(status === "sauvegarde" ? null : "sauvegarde")}
        className={`rounded-lg border px-3 py-1 text-sm transition ${
          status === "sauvegarde"
            ? "border-accent-secondary bg-accent-secondary text-accent-secondary-foreground"
            : "border-foreground/20 hover:border-foreground/40"
        }`}
      >
        {status === "sauvegarde" ? t.saveButtons.sauvegarde : t.saveButtons.sauvegarder}
      </button>
      <button
        type="button"
        onClick={() => onChange(status === "je_viens" ? null : "je_viens")}
        className={`rounded-lg border px-3 py-1 text-sm transition ${
          status === "je_viens"
            ? "border-accent bg-accent text-accent-foreground"
            : "border-foreground/20 hover:border-foreground/40"
        }`}
      >
        {status === "je_viens" ? t.saveButtons.jeViensActif : t.saveButtons.jeViens}
      </button>
    </div>
  );
}
