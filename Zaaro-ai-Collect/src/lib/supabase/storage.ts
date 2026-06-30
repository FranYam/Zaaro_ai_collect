import { createSupabaseAdmin } from "./admin"

export const RECORDINGS_BUCKET = "recordings"
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 heure

export function buildRecordingPath(userId: string, recordingId: string, take: 1 | 2) {
  return `${userId}/${recordingId}/take${take}.webm`
}

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
      upsert: false,
    })

  if (error) {
    throw new Error(`Échec upload Supabase (${storagePath}): ${error.message}`)
  }

  return storagePath
}

/** Supprime les fichiers d'un enregistrement (best-effort). */
export async function deleteRecordingFiles(paths: string[]) {
  const validPaths = paths.filter(Boolean)
  if (validPaths.length === 0) return

  const supabase = createSupabaseAdmin()
  await supabase.storage.from(RECORDINGS_BUCKET).remove(validPaths)
}

function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
}

/** Résout un chemin storage ou une URL legacy en URL de lecture. */
export async function resolvePlaybackUrl(storedValue: string | null | undefined): Promise<string | null> {
  if (!storedValue) return null
  if (isExternalUrl(storedValue)) return storedValue

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

export async function resolveRecordingPlaybackUrls<T extends { audioUrl: string; audioUrl2?: string | null }>(
  recording: T
): Promise<T & { audioUrl: string; audioUrl2: string | null }> {
  const [url1, url2] = await Promise.all([
    resolvePlaybackUrl(recording.audioUrl),
    resolvePlaybackUrl(recording.audioUrl2),
  ])

  return {
    ...recording,
    audioUrl: url1 ?? recording.audioUrl,
    audioUrl2: url2,
  }
}
