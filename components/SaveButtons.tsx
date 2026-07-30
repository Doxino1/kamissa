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
    <div className="flex flex-1 gap-2.5">
      <button
        type="button"
        onClick={() => onChange(status === "sauvegarde" ? null : "sauvegarde")}
        className={`flex-1 rounded-full border-[1.5px] border-accent-secondary px-0 py-2.5 text-sm font-bold transition ${
          status === "sauvegarde"
            ? "bg-accent-secondary text-accent-secondary-foreground"
            : "bg-transparent text-accent-secondary"
        }`}
      >
        {status === "sauvegarde" ? t.saveButtons.sauvegarde : t.saveButtons.sauvegarder}
      </button>
      <button
        type="button"
        onClick={() => onChange(status === "je_viens" ? null : "je_viens")}
        className={`flex-1 rounded-full border-[1.5px] border-accent px-0 py-2.5 text-sm font-bold transition ${
          status === "je_viens" ? "bg-accent text-accent-foreground" : "bg-transparent text-accent"
        }`}
      >
        {status === "je_viens" ? t.saveButtons.jeViensActif : t.saveButtons.jeViens}
      </button>
    </div>
  );
}
