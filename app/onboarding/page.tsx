"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/context";
import { pillClass } from "@/components/EventFilterBar";
import { META, PRIMARY_BUTTON, TEXT_ACTION } from "@/lib/form-styles";
import { DISCIPLINES, MATCHING_TAGS, MatchingTag, PROFILE_TYPES, ProfileType, Ville } from "@/lib/types";

const VILLES: Ville[] = ["Paris", "Athènes"];
const TOTAL_STEPS = 5;

const STEP_TITLE = "font-display text-[clamp(2.5rem,8vw,4.5rem)] leading-none";
const STEP_HINT = "mt-3 text-[15px] text-text-soft";
const OPTION_LIST = "mt-7 flex flex-col border-t border-foreground";

// Choix unique (ville, type de profil) : lignes séparées par des filets, en
// grand serif ; l'option retenue passe en italique soulignée, comme un onglet.
function optionClass(active: boolean) {
  return `flex min-h-16 items-center border-b border-border text-left font-display text-[28px] transition md:text-[34px] ${
    active
      ? "italic text-foreground underline decoration-1 underline-offset-8"
      : "text-muted-strong hover:text-foreground"
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
    <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-8 md:px-10 md:pt-14">
      <p className={META}>{t.onboarding.stepLabel(step, TOTAL_STEPS)}</p>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-[3px] flex-1 ${i < step ? "bg-foreground" : "bg-border"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="mt-10">
          <h1 className={STEP_TITLE}>{t.onboarding.step1Title}</h1>
          <p className={STEP_HINT}>{t.onboarding.step1Hint}</p>
          <div className={OPTION_LIST}>
            {VILLES.map((v) => (
              <button key={v} type="button" onClick={() => setVille(v)} className={optionClass(ville === v)}>
                {t.villeLabels[v]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10">
          <h1 className={STEP_TITLE}>{t.onboarding.step2Title}</h1>
          <p className={STEP_HINT}>{t.onboarding.step2Hint}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {DISCIPLINES.map((d) => (
              <button key={d} type="button" onClick={() => toggleDiscipline(d)} className={pillClass(disciplines.includes(d))}>
                {t.disciplineLabels[d]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-10">
          <h1 className={STEP_TITLE}>{t.onboarding.step3Title}</h1>
          <div className={OPTION_LIST}>
            {PROFILE_TYPES.map((pt) => (
              <button key={pt} type="button" onClick={() => setTypeProfil(pt)} className={optionClass(typeProfil === pt)}>
                {t.profileTypeLabels[pt]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-10">
          <h1 className={STEP_TITLE}>{t.onboarding.step4Title}</h1>
          <p className={STEP_HINT}>{t.onboarding.step4Hint}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {MATCHING_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleMatchingTag(tag)} className={pillClass(matchingTags.includes(tag))}>
                {t.matchingTagLabels[tag]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="mt-10">
          <h1 className={STEP_TITLE}>{t.onboarding.step5Title}</h1>
          <p className={STEP_HINT}>{t.onboarding.step5Intro}</p>
          <div className="mt-7 border-l border-foreground pl-5">
            <p className="text-xs uppercase tracking-[0.1em] text-foreground-muted">
              {t.weeklyEmail.subject(3, t.villeLabels[ville])}
            </p>
            <p className="mt-3 font-display text-2xl">{t.weeklyEmail.greeting(nom || "…")}</p>
            <p className="mt-2 text-sm text-text-soft">{t.weeklyEmail.intro(t.villeLabels[ville])}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {t.onboarding.step5ExampleEvents.map((line) => (
                <li key={line} className="text-sm">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && <p className="mt-5 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        {step > 1 ? (
          <button type="button" onClick={goBack} className={TEXT_ACTION}>
            ‹ {t.onboarding.back}
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-5">
          {step === 4 && (
            <button type="button" onClick={goNext} className={TEXT_ACTION}>
              {t.onboarding.skip}
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 2 && disciplines.length === 0}
              className={`${PRIMARY_BUTTON} disabled:opacity-40`}
            >
              {t.onboarding.next}
            </button>
          ) : (
            <button type="button" onClick={finish} disabled={saving} className={PRIMARY_BUTTON}>
              {saving ? "…" : t.onboarding.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
