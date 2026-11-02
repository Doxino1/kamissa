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
