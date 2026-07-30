"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";

type ReportReason = "spam" | "comportement" | "usurpation" | "autre";

interface BlockReportActionsProps {
  targetUserId: string;
  targetName: string;
  onBlocked?: () => void;
  className?: string;
}

export function BlockReportActions({ targetUserId, targetName, onBlocked, className }: BlockReportActionsProps) {
  const t = useT();
  const [showReport, setShowReport] = useState(false);
  const [motif, setMotif] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleBlock() {
    if (!window.confirm(t.safety.blockConfirm)) return;
    setBusy(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }

    await supabase
      .from("blocks")
      .insert({ blocker_id: user.id, blocked_id: targetUserId, blocked_nom: targetName });
    setBusy(false);
    onBlocked?.();
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }

    await supabase.from("reports").insert({
      reported_user_id: targetUserId,
      reporter_id: user.id,
      motif,
      description: description || null,
    });

    setBusy(false);
    setShowReport(false);
    setDescription("");
    setMessage(t.safety.reportSent);
  }

  return (
    <div className={className}>
      <div className="flex gap-3 text-xs">
        <button type="button" onClick={handleBlock} disabled={busy} className="text-foreground/50 hover:text-red-600">
          {t.safety.block}
        </button>
        <button
          type="button"
          onClick={() => setShowReport((v) => !v)}
          disabled={busy}
          className="text-foreground/50 hover:text-red-600"
        >
          {t.safety.report}
        </button>
      </div>

      {message && <p className="mt-1 text-xs text-green-700">{message}</p>}

      {showReport && (
        <form onSubmit={handleReport} className="mt-2 flex flex-col gap-2 rounded-lg border border-foreground/10 p-2">
          <select
            value={motif}
            onChange={(e) => setMotif(e.target.value as ReportReason)}
            className="rounded-lg border border-foreground/20 bg-transparent px-2 py-1 text-xs"
          >
            <option value="spam">{t.safety.reportReasonSpam}</option>
            <option value="comportement">{t.safety.reportReasonBehavior}</option>
            <option value="usurpation">{t.safety.reportReasonImpersonation}</option>
            <option value="autre">{t.safety.reportReasonOther}</option>
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.safety.reportDescriptionPlaceholder}
            rows={2}
            className="rounded-lg border border-foreground/20 bg-transparent px-2 py-1 text-xs outline-none focus:border-foreground/50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-accent px-3 py-1 text-xs text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? "…" : t.safety.reportSubmit}
            </button>
            <button
              type="button"
              onClick={() => setShowReport(false)}
              className="rounded-lg border border-foreground/20 px-3 py-1 text-xs hover:border-foreground/40"
            >
              {t.safety.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
