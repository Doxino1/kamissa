"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";
import { LogoSquares } from "@/components/Logo";

type Mode = "connexion" | "inscription" | "mot_de_passe_oublie";

const FIELD = "flex flex-col gap-1";
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted";
const INPUT =
  "min-h-12 w-full border-0 border-b border-foreground bg-transparent font-display text-[26px] text-foreground outline-none placeholder:text-muted-strong focus:border-b-2";
const SECONDARY_ACTION = "min-h-8 text-xs font-semibold uppercase tracking-[0.1em] text-foreground-muted underline-offset-4 hover:text-foreground hover:underline";

function authTabClass(active: boolean) {
  return `min-h-11 whitespace-nowrap font-display text-[30px] decoration-1 underline-offset-8 transition md:text-[36px] ${
    active ? "italic text-foreground underline" : "text-muted-strong hover:text-foreground"
  }`;
}

export default function LoginPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Arrivée depuis un lien d'email expiré ou déjà utilisé (/auth/confirm ou
  // /auth/callback renvoient ici avec ?error=lien_invalide) : on l'explique
  // plutôt que d'afficher la page de connexion sans un mot.
  useEffect(() => {
    function showLinkError() {
      if (new URLSearchParams(window.location.search).get("error") === "lien_invalide") {
        setError(t.auth.linkInvalid);
      }
    }
    showLinkError();
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "mot_de_passe_oublie") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      setLoading(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setMessage(t.auth.resetEmailSent);
      return;
    }

    if (mode === "connexion") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, langue: locale },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    // Email déjà inscrit et confirmé : Supabase répond sans erreur (pour ne
    // pas révéler quelles adresses existent) mais n'envoie aucun email, et
    // renvoie un utilisateur sans identité. On oriente vers la connexion
    // plutôt que d'annoncer un email de confirmation qui n'arrivera pas.
    if (signUpData.user?.identities?.length === 0) {
      setError(t.auth.accountExists);
      return;
    }
    setMessage(t.auth.accountCreated);
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError(t.auth.email);
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage(t.auth.resendConfirmationSent);
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-wrap">
      {/* Panneau d'accueil : nom en très grand sur des carrés de couleur. */}
      <section
        aria-hidden="true"
        className="relative flex min-h-[260px] min-w-0 flex-[999_1_640px] flex-col items-center justify-center overflow-hidden border-border px-6 py-10 text-center md:min-h-[600px] md:border-r"
      >
        <span className="absolute left-[8%] top-[12%] hidden h-[130px] w-[180px] bg-gradient-to-br from-cat-expo to-[#3f5761] md:block" />
        <span className="absolute right-[10%] top-[8%] hidden h-40 w-[120px] bg-gradient-to-br from-cat-atelier to-[#a87b3e] md:block" />
        <span className="absolute bottom-[14%] left-[14%] hidden h-[180px] w-[140px] bg-gradient-to-br from-cat-residence to-accent-secondary md:block" />
        <span className="absolute bottom-[20%] right-[6%] hidden h-[140px] w-[200px] bg-gradient-to-br from-cat-vernissage to-[#86695f] md:block" />
        <span className="absolute left-[46%] top-[70%] hidden h-[70px] w-[90px] bg-gradient-to-br from-cat-open-call to-[#245d63] md:block" />
        <LogoSquares className="relative mb-6 h-[14px] w-[14px]" />
        <p className="relative font-display text-[clamp(4.5rem,14vw,11.875rem)] uppercase leading-[0.82]">Kamissa</p>
        <p className="relative mt-2.5 font-display text-[clamp(1.5rem,4vw,3.25rem)] italic leading-tight">
          {t.evenements.tagline}
        </p>
      </section>

      <main className="flex w-full flex-[1_1_420px] flex-col justify-center px-6 py-12 md:max-w-[520px] md:px-14 md:py-16">
        <div role="tablist" className="flex gap-8 border-b border-foreground pb-[18px]">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "connexion"}
            onClick={() => setMode("connexion")}
            className={authTabClass(mode === "connexion")}
          >
            {t.auth.seConnecter}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "inscription"}
            onClick={() => setMode("inscription")}
            className={authTabClass(mode === "inscription")}
          >
            {t.auth.sInscrire}
          </button>
        </div>

        {mode === "mot_de_passe_oublie" && (
          <p className="mt-6 text-sm text-text-soft">{t.auth.resetInstructions}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-[22px]">
          {mode === "inscription" && (
            <label className={FIELD}>
              <span className={LABEL}>{t.auth.nom}</span>
              <input
                type="text"
                required
                placeholder={t.auth.nom}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={INPUT}
              />
            </label>
          )}

          <label className={FIELD}>
            <span className={LABEL}>{t.auth.email}</span>
            <input
              type="email"
              required
              placeholder={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
            />
          </label>

          {mode !== "mot_de_passe_oublie" && (
            <label className={FIELD}>
              <span className={LABEL}>{t.auth.motDePasse}</span>
              <input
                type="password"
                required
                minLength={6}
                placeholder={t.auth.motDePasse}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT}
              />
            </label>
          )}

          {mode === "connexion" && (
            <div className="-mt-2 flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("mot_de_passe_oublie");
                  setError(null);
                  setMessage(null);
                }}
                className={SECONDARY_ACTION}
              >
                {t.auth.motDePasseOublie}
              </button>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className={`${SECONDARY_ACTION} disabled:opacity-50`}
              >
                {resending ? "…" : t.auth.resendConfirmation}
              </button>
            </div>
          )}

          {mode === "inscription" && (
            <label className="flex items-start gap-2.5 text-sm text-text-soft">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-foreground"
              />
              <span>
                {t.auth.acceptTermsPrefix}
                <Link href="/cgu" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                  {t.auth.acceptTermsCgu}
                </Link>
                {t.auth.acceptTermsAnd}
                <Link href="/confidentialite" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                  {t.auth.acceptTermsPrivacy}
                </Link>
              </span>
            </label>
          )}

          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          {message && <p className="text-sm font-semibold text-accent-secondary">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 min-h-14 rounded-full bg-foreground text-[13px] font-semibold uppercase tracking-[0.12em] text-background transition hover:bg-accent-hover disabled:opacity-50"
          >
            {loading
              ? "…"
              : mode === "connexion"
                ? t.auth.seConnecter
                : mode === "inscription"
                  ? t.auth.sInscrire
                  : t.auth.envoyerLeLien}
          </button>
        </form>
      </main>
    </div>
  );
}
