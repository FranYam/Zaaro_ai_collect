import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { isSupabaseConfigured } from "@/lib/supabase/admin"
import {
  deleteRecordingFiles,
  uploadRecordingFile,
} from "@/lib/supabase/storage"

/**
 * Nombre maximum d'enregistrements acceptés par texte.
 * Quand un texte atteint cette valeur, son statut passe à "DONE" et il
 * n'est plus proposé aux contributeurs.
 */
const MAX_RECORDINGS = 10

/**
 * Construit un chemin de stockage Supabase numéroté pour un enregistrement.
 *
 * Convention de nommage :
 *   <userId>/<phraseId>/text_<n>_take<1|2>.webm
 *
 * Exemple : abc123/xyz456/text_3_take1.webm
 *   → 3ème enregistrement de la phrase xyz456, première prise
 *
 * @param userId    - ID de l'utilisateur qui enregistre
 * @param phraseId  - ID de la phrase/texte enregistré
 * @param take      - Numéro de prise (1 ou 2, deux prises par session)
 * @param count     - Numéro d'ordre de l'enregistrement pour cette phrase
 */
function buildNumberedPath(
  userId: string,
  phraseId: string,
  take: 1 | 2,
  count: number
): string {
  return `${userId}/${phraseId}/text_${count}_take${take}.webm`
}

/**
 * POST /api/recordings
 *
 * Soumet une contribution audio pour un texte donné.
 * Chaque contribution comprend deux prises audio (take1 et take2).
 *
 * Flux d'exécution :
 *  1. Vérification de l'authentification et de la configuration Supabase.
 *  2. Lecture du FormData (phraseId, language, duration, audio1, audio2).
 *  3. Vérification que la phrase existe et est encore PENDING.
 *  4. Calcul du nouveau numéro d'ordre (recordingCount + 1).
 *  5. Upload des deux fichiers audio dans Supabase Storage avec nommage numéroté.
 *  6. Transaction Prisma atomique :
 *     - Création de l'enregistrement en base (Recording)
 *     - Mise à jour du compteur de la phrase (Phrase.recordingCount)
 *     - Passage en "DONE" si le seuil MAX_RECORDINGS est atteint
 *
 * Corps FormData :
 *   phraseId  - ID de la phrase à enregistrer
 *   language  - Langue dans laquelle le texte est lu (ex: "Mooré")
 *   duration  - Durée totale en secondes (float)
 *   audio1    - Blob audio, première prise
 *   audio2    - Blob audio, deuxième prise
 *
 * Réponse JSON :
 *   { success, recording, phraseCompleted, recordingNumber }
 *
 * Accès : utilisateur connecté (tout rôle).
 */
export async function POST(req: Request) {
  try {
    // ── Authentification ─────────────────────────────────────────────────────
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // ── Vérification de la configuration Supabase Storage ────────────────────
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Stockage Supabase non configuré. Vérifiez les variables d'environnement." },
        { status: 503 }
      )
    }

    // ── Lecture du FormData ───────────────────────────────────────────────────
    const formData = await req.formData()
    const phraseId = formData.get("phraseId") as string
    const language = formData.get("language") as string
    const durationValue = parseFloat(formData.get("duration") as string)
    const duration = Number.isFinite(durationValue) ? durationValue : 0
    const audio1 = formData.get("audio1") as File
    const audio2 = formData.get("audio2") as File

    if (!phraseId || !language || !audio1 || !audio2) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 })
    }

    // ── Vérification de l'état de la phrase ──────────────────────────────────
    // On récupère le compteur actuel avant l'upload pour :
    //  a) S'assurer que la phrase est encore PENDING
    //  b) Calculer le numéro du prochain enregistrement
    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { id: true, recordingCount: true, status: true },
    })

    if (!phrase) {
      return NextResponse.json({ error: "Phrase introuvable" }, { status: 404 })
    }
    if (phrase.status === "DONE") {
      // La phrase a déjà atteint MAX_RECORDINGS — on refuse l'upload
      return NextResponse.json(
        { error: "Cette phrase a déjà atteint le nombre maximum d'enregistrements." },
        { status: 409 }
      )
    }

    // Numéro du prochain enregistrement (1-indexé)
    const newCount = phrase.recordingCount + 1

    // ── Construction des chemins de fichiers numérotés ────────────────────────
    const path1 = buildNumberedPath(session.user.id, phraseId, 1, newCount)
    const path2 = buildNumberedPath(session.user.id, phraseId, 2, newCount)

    // ── Upload Supabase Storage ───────────────────────────────────────────────
    // Si l'un des uploads échoue, on supprime les fichiers déjà uploadés (best-effort)
    // et on retourne une erreur 502 pour inviter l'utilisateur à réessayer.
    try {
      await uploadRecordingFile(audio1, path1)
      await uploadRecordingFile(audio2, path2)
    } catch (uploadError) {
      console.error("Supabase upload error:", uploadError)
      await deleteRecordingFiles([path1, path2])
      return NextResponse.json(
        { error: "Impossible d'enregistrer les fichiers audio. Réessayez." },
        { status: 502 }
      )
    }

    const recordingId = crypto.randomUUID()

    // ── Transaction Prisma atomique ───────────────────────────────────────────
    // Les deux opérations (création Recording + mise à jour Phrase) s'exécutent
    // ensemble : si l'une échoue, l'autre est annulée, garantissant la cohérence
    // entre le compteur de la phrase et le nombre réel d'enregistrements en base.
    const [recording] = await prisma.$transaction([
      // 1. Créer l'enregistrement (statut PENDING → en attente de validation admin)
      prisma.recording.create({
        data: {
          id: recordingId,
          audioUrl: path1,
          audioUrl2: path2,
          duration: duration || 0,
          language,
          userId: session.user.id,
          phraseId,
          status: "PENDING",
        },
      }),
      // 2. Incrémenter le compteur et éventuellement passer la phrase en DONE
      prisma.phrase.update({
        where: { id: phraseId },
        data: {
          recordingCount: newCount,
          // Passage en "DONE" quand le seuil est atteint → plus proposée aux contributeurs
          ...(newCount >= MAX_RECORDINGS ? { status: "DONE" } : {}),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      recording,
      phraseCompleted: newCount >= MAX_RECORDINGS, // true si c'était le 10ème enregistrement
      recordingNumber: newCount,                    // numéro de cet enregistrement (1-10)
    })

  } catch (error) {
    console.error("Recording save error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
