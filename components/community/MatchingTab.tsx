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
        <div className="mx-auto max-w-sm">
          <div className="overflow-hidden rounded-2xl bg-surface shadow-soft">
            <div className="flex h-36 items-center justify-center bg-accent/20">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-accent-foreground">
                {current.nom.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/artistes/${current.id}`} className="font-medium hover:underline">
                  {current.nom}
                </Link>
                <span className="text-xs text-foreground-muted">{t.profileTypeLabels[current.typeProfil]}</span>
              </div>
              <p className="mt-1 text-sm text-foreground-muted">
                {current.disciplines.map((d) => t.disciplineLabels[d] ?? d).join(", ")}
                {ville ? ` · ${t.villeLabels[ville]}` : ""}
              </p>
              {current.bio && <p className="mt-2 text-sm">{current.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1">
                {current.sharedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground-muted"
                  >
                    {t.matchingTagLabels[tag]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handlePass}
              className="flex-1 rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium transition hover:border-foreground/40"
            >
              {t.matching.pass}
            </button>
            <button
              type="button"
              onClick={handlePropose}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              {t.matching.propose}
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mx-auto mt-8 max-w-sm">
          <h2 className="text-sm font-medium text-foreground-muted">{t.matching.historyTitle}</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[...history].reverse().map((entry, i) => (
              <li
                key={`${entry.candidateId}-${history.length - i}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-foreground-muted">
                  {entry.action === "pass" ? t.matching.pass : t.matching.propose} — {entry.nom}
                </span>
                {i === 0 && (
                  <button type="button" onClick={handleUndo} className="text-xs text-accent hover:underline">
                    {t.matching.undo}
                  </button>
                )}
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
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
          >
            {t.matching.matchedCta}
          </Link>
        </Modal>
      )}
    </div>
  );
}
