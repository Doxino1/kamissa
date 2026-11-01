"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/context";

// Modale « Racines » : angles droits sur voile sombre, titre en serif au-dessus
// d'un filet noir.
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useT();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1050] flex items-start justify-center overflow-y-auto bg-overlay p-4 py-8 md:items-center md:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[620px] bg-background px-6 pb-8 pt-7 shadow-modal md:px-11 md:pb-11 md:pt-10"
      >
        <div className="flex items-start justify-between gap-4 border-b border-foreground pb-[18px]">
          <h2 className="font-display text-[34px] leading-[0.95] md:text-[44px]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modal.close}
            title={t.modal.close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition hover:border-foreground"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
