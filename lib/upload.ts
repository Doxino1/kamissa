"use client";

import { createClient } from "./supabase/client";

// Formats acceptés par le bucket "images" (migration 0010). Les lister dans
// l'attribut `accept` du champ fichier (plutôt que "image/*") pousse l'iPhone
// à fournir une version JPEG compatible au lieu de l'original HEIC ou ProRAW
// (.dng), que le bucket refuse.
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Folder = "portfolio" | "posts" | "bibliotheque";

const MAX_BYTES = 5 * 1024 * 1024; // limite du bucket "images"
// Le portfolio est une vitrine d'œuvres qu'on veut pouvoir regarder de près :
// plus de définition que pour les posts et la bibliothèque.
const MAX_SIDE: Record<Folder, number> = { portfolio: 3000, posts: 2048, bibliotheque: 2048 };
// Essais successifs (qualité JPEG, réduction de taille) jusqu'à passer sous la
// limite du bucket ; la première suffit pour une photo ordinaire.
const ENCODE_ATTEMPTS = [
  { quality: 0.88, scale: 1 },
  { quality: 0.78, scale: 1 },
  { quality: 0.78, scale: 0.75 },
  { quality: 0.72, scale: 0.5 },
];

const DECODE_TIMEOUT_MS = 20_000;

export type UploadErrorCode = "unsupported" | "too_large";

// Message à afficher pour un échec d'envoi : texte traduit pour les cas
// connus, sinon le message renvoyé par le stockage.
export function uploadErrorMessage(
  t: { common: { imageUnsupported: string; imageTooLarge: string } },
  errorCode: UploadErrorCode | null,
  error: string | null
) {
  if (errorCode === "unsupported") return t.common.imageUnsupported;
  if (errorCode === "too_large") return t.common.imageTooLarge;
  return error ?? "Upload failed";
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

// Décode l'image. createImageBitmap applique l'orientation de l'appareil
// photo ; s'il manque (Safari antérieur à iOS 15) ou refuse le fichier, on
// passe par une balise <img>, qui sait parfois lire des formats que
// createImageBitmap refuse (TIFF ou HEIC sous Safari, par exemple).
async function decodeImage(file: File): Promise<Decoded | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // on tente la balise <img> ci-dessous
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    // Événements load/error plutôt que img.decode(), qui peut ne jamais se
    // résoudre selon le navigateur ; délai maximal pour ne jamais laisser le
    // formulaire bloqué sur « … ».
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("délai dépassé")), DECODE_TIMEOUT_MS);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error("illisible"));
      };
      img.src = url;
    });
    if (!img.naturalWidth) throw new Error("image vide");
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

// Les photos des téléphones récents sont en Display P3, une gamme plus large
// que le sRGB du web : on garde cette gamme quand le navigateur sait dessiner
// en P3 (le JPEG produit embarque alors le profil P3), sinon les rouges et
// orangés saturés des œuvres s'affadiraient.
function createCanvasContext(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx =
    canvas.getContext("2d", { colorSpace: "display-p3" } as CanvasRenderingContext2DSettings) ??
    canvas.getContext("2d");
  return { canvas, ctx };
}

function encodeJpeg(decoded: Decoded, maxSide: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
  const { canvas, ctx } = createCanvasContext(
    Math.max(1, Math.round(decoded.width * scale)),
    Math.max(1, Math.round(decoded.height * scale))
  );
  if (!ctx) return Promise.resolve(null);
  // Fond blanc : le JPEG n'a pas de transparence (PNG détourés).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

// Redimensionne et réencode en JPEG avant l'envoi : une photo de téléphone
// (souvent 4 à 12 Mo, voire 25 à 75 Mo en ProRAW) passe ainsi sous la limite
// du bucket. Les GIF sont gardés tels quels pour ne pas perdre l'animation.
async function prepareImage(
  file: File,
  folder: Folder
): Promise<{ file: File | null; errorCode: UploadErrorCode | null }> {
  if (file.type === "image/gif") {
    return file.size <= MAX_BYTES ? { file, errorCode: null } : { file: null, errorCode: "too_large" };
  }

  const decoded = await decodeImage(file);
  if (!decoded) return { file: null, errorCode: "unsupported" };

  try {
    for (const { quality, scale } of ENCODE_ATTEMPTS) {
      const blob = await encodeJpeg(decoded, MAX_SIDE[folder] * scale, quality);
      if (!blob) return { file: null, errorCode: "unsupported" };
      if (blob.size <= MAX_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
        return { file: new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }), errorCode: null };
      }
    }
    return { file: null, errorCode: "too_large" };
  } finally {
    decoded.release();
  }
}

// Chemin préfixé par l'uuid de l'utilisateur : c'est ce que les policies du
// bucket "images" (migration 0009) vérifient pour autoriser l'écriture.
export async function uploadImage(
  userId: string,
  folder: Folder,
  original: File
): Promise<{ url: string | null; error: string | null; errorCode: UploadErrorCode | null }> {
  const { file, errorCode } = await prepareImage(original, folder);
  if (!file) return { url: null, error: null, errorCode };

  const supabase = createClient();
  const ext = file.type === "image/gif" ? "gif" : "jpg";
  const path = `${userId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
  if (error) return { url: null, error: error.message, errorCode: null };

  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(path);

  return { url: publicUrl, error: null, errorCode: null };
}

// ---------------------------------------------------------------------------
// Portfolio complet en PDF (migration 0033) : bucket privé "portfolios", lu
// par URL signée. La policy de lecture n'accorde l'accès qu'au propriétaire
// ou si son portfolio est public : le réglage public / privé s'applique donc
// aussi au fichier, pas seulement à l'affichage du lien.
// ---------------------------------------------------------------------------

export const PDF_ACCEPT = "application/pdf,.pdf";
const PDF_MAX_BYTES = 20 * 1024 * 1024; // limite du bucket "portfolios"
const PDF_URL_TTL_S = 60 * 60;

export type PdfErrorCode = "not_pdf" | "too_large";

// Vérifie la signature "%PDF" plutôt que le seul type MIME, que certains
// navigateurs laissent vide ou déduisent de l'extension.
async function isPdf(file: File) {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...head).startsWith("%PDF");
}

export async function uploadPortfolioPdf(
  userId: string,
  file: File
): Promise<{ path: string | null; error: string | null; errorCode: PdfErrorCode | null }> {
  if (!(await isPdf(file))) return { path: null, error: null, errorCode: "not_pdf" };
  if (file.size > PDF_MAX_BYTES) return { path: null, error: null, errorCode: "too_large" };

  const supabase = createClient();
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage
    .from("portfolios")
    .upload(path, file, { contentType: "application/pdf" });
  if (error) return { path: null, error: error.message, errorCode: null };
  return { path, error: null, errorCode: null };
}

export async function removePortfolioPdf(path: string) {
  await createClient().storage.from("portfolios").remove([path]);
}

// null si le portfolio est privé (et qu'on n'en est pas le propriétaire).
export async function portfolioPdfUrl(path: string): Promise<string | null> {
  const { data } = await createClient().storage.from("portfolios").createSignedUrl(path, PDF_URL_TTL_S);
  return data?.signedUrl ?? null;
}

// ---------------------------------------------------------------------------
// Vidéos des posts (migration 0034) : bucket public "videos", 50 Mo maximum
// (limite par fichier de l'offre gratuite de Supabase). Pas de compression
// dans le navigateur : l'iPhone fournit déjà une version compressée quand on
// choisit une vidéo dans la photothèque.
// ---------------------------------------------------------------------------

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const VIDEO_ACCEPT = VIDEO_TYPES.join(",");
export const POST_MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function isVideoFile(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(file.name);
}

export type VideoErrorCode = "video_unsupported" | "video_too_large";

export function videoErrorMessage(
  t: { common: { videoUnsupported: string; videoTooLarge: string } },
  errorCode: VideoErrorCode | null,
  error: string | null
) {
  if (errorCode === "video_unsupported") return t.common.videoUnsupported;
  if (errorCode === "video_too_large") return t.common.videoTooLarge;
  return error ?? "Upload failed";
}

// Envoi par morceaux (protocole TUS, 6 Mo imposés par Supabase) plutôt qu'en un
// seul bloc : sur réseau mobile, une vidéo met plusieurs minutes à partir. On
// peut ainsi afficher la progression, et une coupure ne fait pas tout
// recommencer. Le client TUS n'est chargé que lorsqu'on envoie une vidéo.
const TUS_CHUNK_BYTES = 6 * 1024 * 1024;
const TUS_RETRY_DELAYS_MS = [0, 3000, 5000, 10000, 20000];

export async function uploadVideo(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string | null; error: string | null; errorCode: VideoErrorCode | null }> {
  // Certains navigateurs laissent le type vide : on le déduit de l'extension.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const contentType =
    file.type || (ext === "mov" ? "video/quicktime" : ext === "webm" ? "video/webm" : "video/mp4");
  if (!VIDEO_TYPES.includes(contentType)) return { url: null, error: null, errorCode: "video_unsupported" };
  if (file.size > VIDEO_MAX_BYTES) return { url: null, error: null, errorCode: "video_too_large" };

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { url: null, error: "Unauthorized", errorCode: null };

  const fileExt = contentType === "video/quicktime" ? "mov" : contentType === "video/webm" ? "webm" : "mp4";
  const path = `${userId}/posts/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  const { Upload } = await import("tus-js-client");

  const uploadError = await new Promise<string | null>((resolve) => {
    new Upload(file, {
      // Hôte direct du stockage : recommandé par Supabase pour les gros fichiers.
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(".supabase.co", ".storage.supabase.co")}/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      chunkSize: TUS_CHUNK_BYTES,
      retryDelays: TUS_RETRY_DELAYS_MS,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: "videos", objectName: path, contentType, cacheControl: "3600" },
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onError: (err) => resolve(err.message),
      onSuccess: () => resolve(null),
    }).start();
  });
  if (uploadError) return { url: null, error: uploadError, errorCode: null };

  const {
    data: { publicUrl },
  } = supabase.storage.from("videos").getPublicUrl(path);
  return { url: publicUrl, error: null, errorCode: null };
}

// Supprime le fichier d'un post supprimé, d'après son URL publique
// (…/storage/v1/object/public/{bucket}/{chemin}). Sans effet sur une URL
// étrangère au stockage du projet.
export async function removeUploadedFile(url: string | null) {
  const match = url?.match(/\/storage\/v1\/object\/public\/(images|videos)\/(.+)$/);
  if (!match) return;
  await createClient().storage.from(match[1]).remove([decodeURIComponent(match[2])]);
}
