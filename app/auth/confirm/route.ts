import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Liens des emails d'authentification (confirmation d'inscription,
// réinitialisation du mot de passe). Contrairement à /auth/callback, qui
// échange un code PKCE et ne marche que dans le navigateur où la demande a été
// faite, on vérifie ici le jeton de l'email côté serveur : le lien fonctionne
// même ouvert dans un autre navigateur (app Gmail, Safari…). Les modèles
// d'email Supabase pointent vers
// /auth/confirm?token_hash={{ .TokenHash }}&type=…&next=…
const ALLOWED_TYPES: EmailOtpType[] = ["signup", "recovery", "email", "email_change", "invite", "magiclink"];

// N'accepte qu'un chemin interne, pour ne pas servir de redirection ouverte.
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
}
