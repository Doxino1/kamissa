"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { TEXT_ACTION, DANGER_ACTION } from "@/lib/form-styles";

interface Member {
  id: string;
  nom: string | null;
  ville: string | null;
  is_moderator?: boolean;
}

const ROW = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-4";

// Section « Modérateurs » de /moderation : qui l'est, et nommer ou retirer
// un membre (jamais soi-même, la route le refuse aussi).
export function ModeratorsSection({ currentUserId }: { currentUserId: string | null }) {
  const { t } = useLocale();
  const m = t.moderation.moderators;
  const [moderators, setModerators] = useState<Member[] | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const q = query.trim();
    const timer = setTimeout(
      async function load() {
        const res = await fetch(`/api/moderation/moderators${q.length >= 2 ? `?q=${encodeURIComponent(q)}` : ""}`);
        if (!res.ok || !active) return;
        const body = await res.json();
        setModerators(body.moderators);
        setResults(body.results);
      },
      q ? 300 : 0
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  async function setRole(member: Member, moderator: boolean) {
    const nom = member.nom ?? "—";
    if (!window.confirm(moderator ? m.promoteConfirm(nom) : m.demoteConfirm(nom))) return;
    setBusyId(member.id);
    const res = await fetch(`/api/moderation/moderators/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderator }),
    });
    setBusyId(null);
    if (!res.ok) return;
    setModerators((prev) =>
      moderator
        ? [...(prev ?? []), member].sort((a, b) => (a.nom ?? "").localeCompare(b.nom ?? ""))
        : (prev ?? []).filter((x) => x.id !== member.id)
    );
    setResults((prev) => prev.map((x) => (x.id === member.id ? { ...x, is_moderator: moderator } : x)));
  }

  const isModerator = (id: string) => (moderators ?? []).some((x) => x.id === id);

  return (
    <div className="max-w-[860px]">
      <p className="mt-4 text-[15px] text-text-soft">{m.intro}</p>

      <div className="mt-2 flex flex-col">
        {(moderators ?? []).map((mod) => (
          <div key={mod.id} className={ROW}>
            <p className="font-display text-[24px] leading-tight">
              {mod.nom ?? "—"}
              {mod.ville && <span className="ml-2 text-sm text-foreground-muted">{t.villeLabels[mod.ville as "Paris"] ?? mod.ville}</span>}
            </p>
            {mod.id === currentUserId ? (
              <span className="text-xs uppercase tracking-[0.1em] text-foreground-muted">{m.you}</span>
            ) : (
              <button
                type="button"
                disabled={busyId === mod.id}
                onClick={() => setRole(mod, false)}
                className={DANGER_ACTION}
              >
                {m.demote}
              </button>
            )}
          </div>
        ))}
      </div>

      <label className="mt-8 flex min-h-11 items-center gap-2.5 border-b border-foreground">
        <Search size={17} strokeWidth={1.75} className="shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.searchPlaceholder}
          aria-label={m.searchPlaceholder}
          className="w-full bg-transparent font-display text-[22px] outline-none placeholder:text-muted-strong"
        />
      </label>
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-4 text-sm text-foreground-muted">{m.noResult}</p>
      )}
      <div className="flex flex-col">
        {results.map((member) => (
          <div key={member.id} className={ROW}>
            <p className="text-[17px]">
              {member.nom ?? "—"}
              {member.ville && <span className="ml-2 text-sm text-foreground-muted">{t.villeLabels[member.ville as "Paris"] ?? member.ville}</span>}
            </p>
            {isModerator(member.id) ? (
              <span className="text-xs uppercase tracking-[0.1em] text-foreground-muted">{m.already}</span>
            ) : (
              <button
                type="button"
                disabled={busyId === member.id}
                onClick={() => setRole(member, true)}
                className={TEXT_ACTION}
              >
                {m.promote}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
