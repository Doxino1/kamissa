"use client";

import { useT } from "@/lib/i18n/context";
import { EventType } from "@/lib/types";

export const EVENT_TYPE_BADGE_STYLES: Record<EventType, string> = {
  vernissage: "bg-badge-vernissage-bg text-badge-vernissage-fg",
  workshop: "bg-badge-workshop-bg text-badge-workshop-fg",
  open_call: "bg-badge-open-call-bg text-badge-open-call-fg",
  expo: "bg-badge-expo-bg text-badge-expo-fg",
  residency: "bg-badge-residency-bg text-badge-residency-fg",
  annonce: "bg-badge-annonce-bg text-badge-annonce-fg",
};

export function EventTypeBadge({ type }: { type: EventType }) {
  const t = useT();
  const label = t.eventTypeLabels[type] ?? type;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${EVENT_TYPE_BADGE_STYLES[type] ?? "bg-surface text-foreground-muted"}`}
    >
      {label}
    </span>
  );
}
