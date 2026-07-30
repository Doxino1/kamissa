"use client";

import { useT } from "@/lib/i18n/context";

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const t = useT();

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs ${checked ? "text-foreground" : "text-foreground/40"}`}>
        {checked ? t.common.public : t.common.prive}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[26px] w-11 rounded-full transition ${checked ? "bg-accent" : "bg-border"}`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-background shadow-sm transition ${
            checked ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
