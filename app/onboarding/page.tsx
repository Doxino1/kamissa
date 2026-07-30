"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { DISCIPLINES, MATCHING_TAGS, MatchingTag, PROFILE_TYPES, ProfileType, Ville } from "@/lib/types";

const VILLES: Ville[] = ["Paris", "Athènes"];
const TOTAL_STEPS = 5;

function chipClass(active: boolean) {
  return `rounded-lg border px-3 py-1 text-sm transition ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border hover:border-foreground/40"
  }`;
}

export default function OnboardingPage() {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ville, setVille] = useState<Ville>("Paris");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [typeProfil, setTypeProfil] = useState<ProfileType>("amateur");
  const [matchingTags, setMatchingTags] = useState<MatchingTag[]>([]);
  const [nom, setNom] = useState<string | null>(null);

  function toggleDiscipline(d: string) {
    setDisciplines((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function toggleMatchingTag(tag: MatchingTag) {
    setMatchingTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

  async function goNext() {
    setError(null);
    if (step === 4) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setNom((await supabase.from("profiles").select("nom").eq("id", user.id).single()).data?.nom ?? "");
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ville,
        disciplines,
        type_profil: typeProfil,
        onboarding_complete: true,
      })
      .eq("id", user.id);

    if (updateError) {
      setSaving(false);
      setError(t.onboarding.saveError);
      return;
    }

    if (matchingTags.length > 0) {
      await supabase.from("matching_tags").insert(matchingTags.map((tag) => ({ user_id: user.id, tag })));
    }

    setSaving(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <p className="text-xs text-foreground/50">{t.onboarding.stepLabel(step, TOTAL_STEPS)}</p>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < step ? "bg-accent" : "bg-foreground/10"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="mt-6">
          <h1 className="font-display text-xl font-medium">{t.onboarding.step1Title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t.onboarding.step1Hint}</p>
          <div className="mt-4 flex flex-col gap-2">
            {VILLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVille(v)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  ville === v
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                {t.villeLabels[v]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <h1 className="font-display text-xl font-medium">{t.onboarding.step2Title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t.onboarding.step2Hint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <button key={d} type="button" onClick={() => toggleDiscipline(d)} className={chipClass(disciplines.includes(d))}>
                {t.disciplineLabels[d]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <h1 className="font-display text-xl font-medium">{t.onboarding.step3Title}</h1>
          <div className="mt-4 flex flex-col gap-2">
            {PROFILE_TYPES.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setTypeProfil(pt)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  typeProfil === pt
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                {t.profileTypeLabels[pt]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-6">
          <h1 className="font-display text-xl font-medium">{t.onboarding.step4Title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t.onboarding.step4Hint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MATCHING_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleMatchingTag(tag)} className={chipClass(matchingTags.includes(tag))}>
                {t.matchingTagLabels[tag]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="mt-6">
          <h1 className="font-display text-xl font-medium">{t.onboarding.step5Title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t.onboarding.step5Intro}</p>
          <div className="mt-4 rounded-lg border border-border p-4">
            <p className="text-xs text-foreground/50">{t.weeklyEmail.subject(3, t.villeLabels[ville])}</p>
            <p className="mt-3 text-sm font-medium">{t.weeklyEmail.greeting(nom || "…")}</p>
            <p className="mt-2 text-sm text-foreground/70">{t.weeklyEmail.intro(t.villeLabels[ville])}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {t.onboarding.step5ExampleEvents.map((line) => (
                <li key={line} className="text-sm text-foreground/80">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-between gap-2">
        {step > 1 ? (
          <button type="button" onClick={goBack} className="text-sm text-foreground-muted hover:text-foreground">
            {t.onboarding.back}
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {step === 4 && (
            <button type="button" onClick={goNext} className="text-sm text-foreground-muted hover:text-foreground">
              {t.onboarding.skip}
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 2 && disciplines.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
            >
              {t.onboarding.next}
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "…" : t.onboarding.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
