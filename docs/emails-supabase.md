# Modèles d'email Supabase (Kamissa)

À coller dans le tableau de bord Supabase : **Authentication → Emails → Templates**.
Les emails partent par Resend (SMTP personnalisé, « Kamissa » `<no-reply@kamissa.app>`).

## Principe

- **Langue** : Supabase n'a qu'un modèle par type d'email. Chaque modèle contient donc les trois langues et choisit d'après `user_metadata.langue` (`fr`, `en`, `el`). Cette valeur est renseignée à l'inscription avec la langue affichée, puis mise à jour quand la personne change de langue dans l'app (`lib/i18n/context.tsx`). Sans valeur, c'est le français.
- **Lien** : les liens pointent vers `/auth/confirm` avec `token_hash`. La route vérifie le jeton côté serveur (`app/auth/confirm/route.ts`) : le lien marche même ouvert dans un autre navigateur que celui de la demande (app Gmail, Safari…). Un lien expiré ou déjà utilisé renvoie vers `/login?error=lien_invalide`, qui l'explique.
- `{{ .SiteURL }}` vaut `https://www.kamissa.app` (Authentication → URL Configuration).

---

## Reset Password

**Subject**

```
{{ $l := or .Data.langue "fr" }}{{ if eq $l "en" }}Reset your Kamissa password{{ else if eq $l "el" }}Επαναφορά κωδικού Kamissa{{ else }}Réinitialise ton mot de passe Kamissa{{ end }}
```

**Message body (HTML)**

```html
{{ $l := or .Data.langue "fr" }}
<div style="background:#fdfcf9;padding:40px 20px;font-family:Helvetica,Arial,sans-serif;color:#12110e;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:30px;">Kamissa</p>
    <p style="margin:0 0 28px;font-size:0;line-height:0;">
      <span style="display:inline-block;width:8px;height:8px;background:#cb9a56;"></span>
      <span style="display:inline-block;width:8px;height:8px;background:#5f8763;margin-left:5px;"></span>
      <span style="display:inline-block;width:8px;height:8px;background:#5a7580;margin-left:5px;"></span>
    </p>
    {{ if eq $l "en" }}
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Reset your password</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a34;">You asked to reset your Kamissa password. Click the button below to choose a new one. The link works once and expires after one hour.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password" style="display:inline-block;padding:16px 30px;border-radius:999px;background:#12110e;color:#fdfcf9;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">Choose a new password</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6e6a61;">If you didn't ask for this, you can ignore this email: your password won't change.</p>
    {{ else if eq $l "el" }}
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Επαναφορά κωδικού</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a34;">Ζήτησες επαναφορά του κωδικού σου στο Kamissa. Πάτησε το κουμπί για να επιλέξεις νέο κωδικό. Ο σύνδεσμος λειτουργεί μία φορά και λήγει σε μία ώρα.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password" style="display:inline-block;padding:16px 30px;border-radius:999px;background:#12110e;color:#fdfcf9;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">Νέος κωδικός</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6e6a61;">Αν δεν το ζήτησες εσύ, αγνόησε αυτό το email: ο κωδικός σου δεν θα αλλάξει.</p>
    {{ else }}
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Réinitialise ton mot de passe</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a34;">Tu as demandé à réinitialiser ton mot de passe Kamissa. Clique sur le bouton ci-dessous pour en choisir un nouveau. Le lien ne fonctionne qu'une fois et expire au bout d'une heure.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password" style="display:inline-block;padding:16px 30px;border-radius:999px;background:#12110e;color:#fdfcf9;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">Choisir un nouveau mot de passe</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6e6a61;">Si tu n'as rien demandé, ignore cet email : ton mot de passe ne changera pas.</p>
    {{ end }}
  </div>
</div>
```

---

## Confirm signup

**Subject**

```
{{ $l := or .Data.langue "fr" }}{{ if eq $l "en" }}Confirm your Kamissa account{{ else if eq $l "el" }}Επιβεβαίωσε τον λογαριασμό σου στο Kamissa{{ else }}Confirme ton compte Kamissa{{ end }}
```

**Message body (HTML)**

```html
{{ $l := or .Data.langue "fr" }}
<div style="background:#fdfcf9;padding:40px 20px;font-family:Helvetica,Arial,sans-serif;color:#12110e;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:30px;">Kamissa</p>
    <p style="margin:0 0 28px;font-size:0;line-height:0;">
      <span style="display:inline-block;width:8px;height:8px;background:#cb9a56;"></span>
      <span style="display:inline-block;width:8px;height:8px;background:#5f8763;margin-left:5px;"></span>
      <span style="display:inline-block;width:8px;height:8px;background:#5a7580;margin-left:5px;"></span>
    </p>
    {{ if eq $l "en" }}
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Welcome to Kamissa</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a34;">One last step: confirm your email address to activate your account.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/" style="display:inline-block;padding:16px 30px;border-radius:999px;background:#12110e;color:#fdfcf9;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">Confirm my email</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6e6a61;">If you didn't create an account, you can ignore this email.</p>
    {{ else if eq $l "el" }}
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Καλώς ήρθες στο Kamissa</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a34;">Ένα τελευταίο βήμα: επιβεβαίωσε τη διεύθυνση email σου για να ενεργοποιήσεις τον λογαριασμό σου.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/" style="display:inline-block;padding:16px 30px;border-radius:999px;background:#12110e;color:#fdfcf9;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">Επιβεβαίωση email</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6e6a61;">Αν δεν δημιούργησες λογαριασμό, αγνόησε αυτό το email.</p>
    {{ else }}
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.1;">Bienvenue chez Kamissa</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3d3a34;">Dernière étape : confirme ton adresse email pour activer ton compte.</p>
    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/" style="display:inline-block;padding:16px 30px;border-radius:999px;background:#12110e;color:#fdfcf9;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;">Confirmer mon email</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6e6a61;">Si tu n'as pas créé de compte, ignore cet email.</p>
    {{ end }}
  </div>
</div>
```
