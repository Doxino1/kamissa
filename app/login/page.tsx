"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/context";

type Mode = "connexion" | "inscription" | "mot_de_passe_oublie";

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

    const { error: signUpError } = await supabase.auth.signUp({
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
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("connexion")}
          className={`rounded-lg border px-4 py-1.5 text-sm transition ${
            mode === "connexion"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-foreground/20 hover:border-foreground/40"
          }`}
        >
          {t.auth.seConnecter}
        </button>
        <button
          type="button"
          onClick={() => setMode("inscription")}
          className={`rounded-lg border px-4 py-1.5 text-sm transition ${
            mode === "inscription"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-foreground/20 hover:border-foreground/40"
          }`}
        >
          {t.auth.sInscrire}
        </button>
      </div>

      {mode === "mot_de_passe_oublie" && (
        <p className="mb-3 text-sm text-foreground-muted">{t.auth.resetInstructions}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
        />

        {mode !== "mot_de_passe_oublie" && (
          <input
            type="password"
            required
            minLength={6}
            placeholder={t.auth.motDePasse}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        )}

        {mode === "connexion" && (
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => {
                setMode("mot_de_passe_oublie");
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              {t.auth.motDePasseOublie}
            </button>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="text-sm text-foreground-muted hover:text-foreground disabled:opacity-50"
            >
              {resending ? "…" : t.auth.resendConfirmation}
            </button>
          </div>
        )}

        {mode === "inscription" && (
          <input
            type="text"
            required
            placeholder={t.auth.nom}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        )}

        {mode === "inscription" && (
          <label className="flex items-start gap-2 text-sm text-foreground-muted">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              {t.auth.acceptTermsPrefix}
              <Link href="/cgu" target="_blank" className="underline hover:text-foreground">
                {t.auth.acceptTermsCgu}
              </Link>
              {t.auth.acceptTermsAnd}
              <Link href="/confidentialite" target="_blank" className="underline hover:text-foreground">
                {t.auth.acceptTermsPrivacy}
              </Link>
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
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
    </div>
  );
}
