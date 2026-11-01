"use client";

import { useT } from "@/lib/i18n/context";
import { CoutType } from "@/lib/types";

export function CostBadge({ type }: { type: CoutType }) {
  const t = useT();

  return (
    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground">{t.coutLabels[type]}</span>
  );
}
