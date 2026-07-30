"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n/context";

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
    <div className="fixed inset-0 z-[1050] flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 py-8 md:items-center">
      <div className="w-full max-w-md rounded-2xl bg-background p-5 shadow-modal">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modal.close}
            title={t.modal.close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted transition hover:text-foreground"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
