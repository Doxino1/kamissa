"use client";

import { useT } from "@/lib/i18n/context";

// Interrupteur Racines : piste noire quand il est actif, gris clair sinon.
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  const label = checked ? t.common.public : t.common.prive;

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-semibold uppercase tracking-[0.1em]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-foreground" : "bg-toggle-off"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-background transition-[left] ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
