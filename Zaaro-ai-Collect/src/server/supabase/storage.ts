import { createSupabaseAdmin } from "./admin"

/**
 * Nom du bucket Supabase Storage utilisé pour tous les fichiers audio.
 * Ce bucket doit exister dans le projet Supabase et être configuré en accès privé.
 */
export const RECORDINGS_BUCKET = "recordings"

/**
 * Durée de validité (en secondes) des URLs signées générées pour la lecture.
 * Passé ce délai, l'URL expire et une nouvelle doit être générée.
 * Valeur actuelle : 1 heure.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 heure

/**
 * [LEGACY] Construit un chemin de stockage simple pour un enregistrement.
 *
 * @deprecated Utilisez buildNumberedPath() dans recordings/route.ts à la place,
 * qui génère des chemins numérotés (text_<n>_take<1|2>.webm).
 *
 * @param userId      - ID de l'utilisateur
 * @param recordingId - UUID unique de l'enregistrement
 * @param take        - Numéro de prise (1 ou 2)
 */
export function buildRecordingPath(userId: string, recordingId: string, take: 1 | 2) {
  return `${userId}/${recordingId}/take${take}.webm`
}

/**
 * Uploade un fichier audio dans le bucket Supabase Storage.
 *
 * Le fichier est converti en Buffer avant l'upload (compatible avec l'API
 * Supabase côté serveur Next.js).
 *
 * @param file        - Objet File reçu du FormData
 * @param storagePath - Chemin cible dans le bucket (ex: "userId/phraseId/text_1_take1.webm")
 * @returns Le chemin de stockage passé en paramètre (pour référence)
 * @throws Error si l'upload Supabase échoue
 */
export async function uploadRecordingFile(
  file: File,
  storagePath: string
): Promise<string> {
  const supabase = createSupabaseAdmin()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "audio/webm",
      upsert: false, // ne pas écraser si le fichier existe déjà
    })

  if (error) {
    throw new Error(`Échec upload Supabase (${storagePath}): ${error.message}`)
  }

  return storagePath
}

/**
 * Supprime un ou plusieurs fichiers du bucket Supabase Storage.
 *
 * Cette fonction est "best-effort" : elle ne lève pas d'erreur si la suppression
 * échoue (les fichiers orphelins peuvent être nettoyés manuellement depuis la console).
 * Utilisée principalement pour le nettoyage en cas d'erreur après un upload partiel.
 *
 * @param paths - Liste des chemins à supprimer dans le bucket
 */
export async function deleteRecordingFiles(paths: string[]) {
  const validPaths = paths.filter(Boolean)
  if (validPaths.length === 0) return

  const supabase = createSupabaseAdmin()
  await supabase.storage.from(RECORDINGS_BUCKET).remove(validPaths)
}

/**
 * Détermine si une valeur est déjà une URL externe (http/https).
 * Utilisé pour distinguer les anciens enregistrements (URLs directes) des
 * nouveaux (chemins Supabase Storage).
 */
function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
}

/**
 * Résout un chemin Supabase Storage ou une URL legacy en URL de lecture signée.
 *
 * Les anciens enregistrements peuvent stocker des URLs directes (http/https) ;
 * les nouveaux stockent un chemin relatif dans le bucket. Cette fonction gère
 * les deux cas de manière transparente.
 *
 * @param storedValue - Chemin bucket ou URL stockée dans la colonne audioUrl / audioUrl2
 * @returns URL signée valide pour 1 heure, ou null si le chemin est invalide
 */
export async function resolvePlaybackUrl(
  storedValue: string | null | undefined
): Promise<string | null> {
  if (!storedValue) return null

  // Cas legacy : URL directe déjà utilisable
  if (isExternalUrl(storedValue)) return storedValue

  // Cas courant : chemin relatif → génération d'une URL signée temporaire
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .createSignedUrl(storedValue, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error?.message)
    return null
  }

  return data.signedUrl
}

/**
 * Résout les URLs de lecture pour les deux prises d'un enregistrement.
 *
 * Fonction utilitaire qui appelle resolvePlaybackUrl() sur audioUrl et audioUrl2
 * en parallèle et retourne l'objet Recording enrichi avec des URLs de lecture.
 *
 * @param recording - Objet Recording avec audioUrl (et audioUrl2 optionnel)
 * @returns Le même objet avec les URLs résolues (signées ou directes)
 */
export async function resolveRecordingPlaybackUrls<
  T extends { audioUrl: string; audioUrl2?: string | null }
>(recording: T): Promise<T & { audioUrl: string; audioUrl2: string | null }> {
  const [url1, url2] = await Promise.all([
    resolvePlaybackUrl(recording.audioUrl),
    resolvePlaybackUrl(recording.audioUrl2),
  ])

  return {
    ...recording,
    audioUrl: url1 ?? recording.audioUrl, // fallback sur la valeur originale si erreur
    audioUrl2: url2,
  }
}
