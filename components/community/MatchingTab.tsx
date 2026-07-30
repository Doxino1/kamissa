"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { Modal } from "@/components/Modal";
import { sendNotification } from "@/lib/notify";
import { MatchingTag, ProfileType, Ville } from "@/lib/types";

interface Suggestion {
  id: string;
  nom: string;
  typeProfil: ProfileType;
  disciplines: string[];
  bio: string;
  sharedTags: MatchingTag[];
}

interface HistoryEntry {
  candidateId: string;
  nom: string;
  action: "pass" | "propose";
}

const INDEX_KEY = "kamissa_matchIndex";
const HISTORY_KEY = "kamissa_matchHistory";
const MAX_HISTORY = 5;

export function MatchingTab() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTags, setMyTags] = useState<MatchingTag[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ville, setVille] = useState<Ville | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [matchIndex, setMatchIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [matched, setMatched] = useState<{ id: string; nom: string } | null>(null);

  useEffect(() => {
    function sync() {
      const storedIndex = window.localStorage.getItem(INDEX_KEY);
      if (storedIndex) setMatchIndex(Number(storedIndex) || 0);
      const storedHistory = window.localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        try {
          setHistory(JSON.parse(storedHistory));
        } catch {
          // ignore un historique corrompu
        }
      }
    }
    sync();
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const [{ data: me, error: meError }, { data: myTagRows }] = await Promise.all([
        supabase.from("profiles").select("ville, disciplines").eq("id", user.id).single(),
        supabase.from("matching_tags").select("tag").eq("user_id", user.id),
      ]);

      if (!active) return;

      if (meError || !me) {
        setError(meError?.message ?? t.common.profileNotFound);
        setLoading(false);
        return;
      }
      setVille(me.ville as Ville);

      const mine = (myTagRows ?? []).map((row) => row.tag as MatchingTag);
      setMyTags(mine);

      const [{ data: candidates, error: candidatesError }, { data: allTags }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nom, type_profil, disciplines, bio")
          .eq("ville", me.ville)
          .neq("id", user.id),
        supabase.from("matching_tags").select("user_id, tag"),
      ]);

      if (!active) return;

      if (candidatesError) {
        setError(candidatesError.message);
        setLoading(false);
        return;
      }

      const tagsByUser = new Map<string, MatchingTag[]>();
      for (const row of allTags ?? []) {
        const list = tagsByUser.get(row.user_id) ?? [];
        list.push(row.tag as MatchingTag);
        tagsByUser.set(row.user_id, list);
      }

      const results: Suggestion[] = [];
      for (const c of candidates ?? []) {
        const candidateDisciplines: string[] = c.disciplines ?? [];
        const candidateTags = tagsByUser.get(c.id) ?? [];
        const sharedDisciplines = candidateDisciplines.filter((d) => me.disciplines.includes(d));
        const sharedTags = candidateTags.filter((tag) => mine.includes(tag));

        if (sharedDisciplines.length > 0 && sharedTags.length > 0) {
          results.push({
            id: c.id,
            nom: c.nom,
            typeProfil: c.type_profil as ProfileType,
            disciplines: candidateDisciplines,
            bio: c.bio ?? "",
            sharedTags,
          });
        }
      }

      setSuggestions(results);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function persistIndex(next: number) {
    setMatchIndex(next);
    window.localStorage.setItem(INDEX_KEY, String(next));
  }

  function persistHistory(next: HistoryEntry[]) {
    setHistory(next);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function handlePass() {
    const current = suggestions[matchIndex];
    if (!current) return;
    persistHistory(
      [...history, { candidateId: current.id, nom: current.nom, action: "pass" as const }].slice(-MAX_HISTORY)
    );
    persistIndex(matchIndex + 1);
  }

  async function handlePropose() {
    const current = suggestions[matchIndex];
    if (!current || !userId) return;

    const supabase = createClient();
    await supabase.from("matching_proposals").insert({ from_user_id: userId, to_user_id: current.id });

    const { data: reciprocal } = await supabase
      .from("matching_proposals")
      .select("id")
      .eq("from_user_id", current.id)
      .eq("to_user_id", userId)
      .maybeSingle();

    persistHistory(
      [...history, { candidateId: current.id, nom: current.nom, action: "propose" as const }].slice(-MAX_HISTORY)
    );
    persistIndex(matchIndex + 1);
    if (reciprocal) {
      setMatched({ id: current.id, nom: current.nom });
      sendNotification({ userId: current.id, actorId: userId, type: "match" }).catch(() => {});
    }
  }

  async function handleUndo() {
    const last = history[history.length - 1];
    if (!last) return;

    if (last.action === "propose" && userId) {
      const supabase = createClient();
      await supabase
        .from("matching_proposals")
        .delete()
        .eq("from_user_id", userId)
        .eq("to_user_id", last.candidateId);
    }

    persistHistory(history.slice(0, -1));
    persistIndex(Math.max(0, matchIndex - 1));
  }

  if (loading) {
    return <p className="text-sm text-foreground-muted">{t.common.loading}</p>;
  }

  const current = suggestions[matchIndex];

  return (
    <div>
      <p className="mb-6 text-sm text-foreground-muted">{t.matching.subtitle}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && myTags.length === 0 && (
        <p className="text-sm text-foreground-muted">{t.matching.needTag}</p>
      )}

      {!error && myTags.length > 0 && !current && (
        <p className="text-sm text-foreground-muted">{t.matching.noMoreCandidates}</p>
      )}

      {current && (
        <div className="mx-auto max-w-[360px]">
          <div className="overflow-hidden rounded-[28px] border border-border bg-surface">
            <div
              className="flex h-[220px] items-center justify-center"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, #fcefd1, #fcefd1 10px, #f5e2ae 10px, #f5e2ae 20px)",
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background/70 text-2xl font-bold">
                {current.nom.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="px-[22px] pb-6 pt-5">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/artistes/${current.id}`} className="text-lg font-bold">
                  {current.nom}
                </Link>
                <span className="text-xs text-foreground-muted">{t.profileTypeLabels[current.typeProfil]}</span>
              </div>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {current.disciplines.map((d) => t.disciplineLabels[d] ?? d).join(", ")}
                {ville ? ` · ${t.villeLabels[ville]}` : ""}
              </p>
              {current.bio && <p className="mt-3 text-sm">{current.bio}</p>}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {current.sharedTags.map((tag) => (
                  <span
                    key={tag}
                    className="mt-2 inline-block rounded-full bg-badge-workshop-bg px-3 py-1 text-xs font-bold text-badge-workshop-fg"
                  >
                    {t.matchingTagLabels[tag]}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={handlePass}
                  className="flex-1 rounded-full border-[1.5px] border-border py-3 text-sm font-bold text-foreground-muted transition"
                >
                  {t.matching.pass}
                </button>
                <button
                  type="button"
                  onClick={handlePropose}
                  className="flex-1 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent-hover"
                >
                  {t.matching.propose}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mx-auto mt-5 max-w-[360px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground-muted">{t.matching.historyTitle}</h2>
            <button type="button" onClick={handleUndo} className="text-xs font-bold text-accent">
              {t.matching.undo}
            </button>
          </div>
          <ul className="mt-1 flex flex-col">
            {[...history].reverse().map((entry, i) => (
              <li
                key={`${entry.candidateId}-${history.length - i}`}
                className="border-b border-border py-1.5 text-sm"
              >
                {entry.action === "pass" ? t.matching.pass : t.matching.propose} — {entry.nom}
              </li>
            ))}
          </ul>
        </div>
      )}

      {matched && (
        <Modal title={t.matching.matchedTitle} onClose={() => setMatched(null)}>
          <p className="text-sm">{t.matching.matchedBody(matched.nom)}</p>
          <Link
            href={`/artistes/${matched.id}`}
            onClick={() => setMatched(null)}
            className="mt-4 inline-block w-full rounded-full bg-accent py-3 text-center text-sm font-bold text-accent-foreground transition hover:bg-accent-hover"
          >
            {t.matching.matchedCta}
          </Link>
        </Modal>
      )}
    </div>
  );
}
