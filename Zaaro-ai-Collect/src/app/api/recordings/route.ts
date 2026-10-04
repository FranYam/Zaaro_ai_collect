import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import prisma from "@/server/prisma"
import { isSupabaseConfigured } from "@/server/supabase/admin"
import {
  deleteRecordingFiles,
  uploadRecordingFile,
} from "@/server/supabase/storage"

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
 *  3. Garde anti-doublon : l'utilisateur ne doit pas avoir déjà enregistré
 *     cette phrase dans cette langue (contrainte @@unique en base, vérifiée
 *     ici en amont pour renvoyer un message clair).
 *  4. Réservation atomique d'un créneau : UPDATE conditionnel qui incrémente
 *     recordingCount uniquement si la phrase est PENDING et sous le seuil.
 *     C'est cette atomicité au niveau base qui élimine la course entre deux
 *     soumissions simultanées (plus jamais plus de 10 enregistrements).
 *  5. Lecture du compteur réservé pour numéromer les fichiers audio.
 *  6. Upload des deux fichiers audio dans Supabase Storage.
 *  7. Création du Recording en base. En cas d'échec (y compris doublon
 *     concurrent → P2002), les fichiers uploadés sont supprimés et le
 *     créneau réservé est libéré (décrément compensatoire).
 *  8. Passage idempotent en "DONE" si le seuil MAX_RECORDINGS est atteint.
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
    const userId = session.user.id

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

    // ── Garde anti-doublon ────────────────────────────────────────────────────
    // Un contributeur = un enregistrement par phrase et par langue. La contrainte
    // @@unique([userId, phraseId, language]) en base garantit ce règle même en
    // cas de soumissions concurrentes ; ce contrôle en amont renvoie simplement
    // un message clair plutôt qu'une erreur technique.
    const existing = await prisma.recording.findFirst({
      where: { userId, phraseId, language },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà enregistré cette phrase dans cette langue." },
        { status: 409 }
      )
    }

    // ── Réservation atomique d'un créneau ────────────────────────────────────
    // UPDATE ... WHERE status = 'PENDING' AND recordingCount < MAX :
    //  - l'incrérement { increment: 1 } est calculé par PostgreSQL, pas en JS ;
    //  - deux requêtes concurrentes ne peuvent jamais dépasser le seuil ;
    //  - si count === 0, la phrase est introuvable, DONE, ou déjà complète.
    const reserved = await prisma.phrase.updateMany({
      where: {
        id: phraseId,
        status: "PENDING",
        recordingCount: { lt: MAX_RECORDINGS },
      },
      data: { recordingCount: { increment: 1 } },
    })

    if (reserved.count === 0) {
      // Distinguer "phrase introuvable" (404) de "phrase complète" (409)
      const phrase = await prisma.phrase.findUnique({
        where: { id: phraseId },
        select: { status: true },
      })
      if (!phrase) {
        return NextResponse.json({ error: "Phrase introuvable" }, { status: 404 })
      }
      return NextResponse.json(
        { error: "Cette phrase a déjà atteint le nombre maximum d'enregistrements." },
        { status: 409 }
      )
    }

    // Compensation en cas d'échec après la réservation (upload ou création) :
    // libère le créneau réservé. Best-effort — ne masque pas l'erreur d'origine.
    const releaseSlot = async () => {
      try {
        await prisma.phrase.update({
          where: { id: phraseId },
          data: { recordingCount: { decrement: 1 } },
        })
      } catch (e) {
        console.error("Slot release error:", e)
      }
    }

    // ── Lecture du numéro réservé ─────────────────────────────────────────────
    // Sert uniquement à numéromer les fichiers (cosmétique). Deux réservations
    // concurrentes peuvent lire le même numéro, sans collision possible car le
    // chemin inclut le userId.
    const phraseAfterReserve = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { recordingCount: true },
    })
    const newCount = phraseAfterReserve?.recordingCount ?? MAX_RECORDINGS

    // ── Construction des chemins de fichiers numérotés ────────────────────────
    const path1 = buildNumberedPath(userId, phraseId, 1, newCount)
    const path2 = buildNumberedPath(userId, phraseId, 2, newCount)

    // ── Upload Supabase Storage ───────────────────────────────────────────────
    // Si l'un des uploads échoue, on supprime les fichiers déjà uploadés
    // (best-effort), on libère le créneau réservé et on retourne une erreur
    // 502 pour inviter l'utilisateur à réessayer.
    try {
      await uploadRecordingFile(audio1, path1)
      await uploadRecordingFile(audio2, path2)
    } catch (uploadError) {
      console.error("Supabase upload error:", uploadError)
      await deleteRecordingFiles([path1, path2])
      await releaseSlot()
      return NextResponse.json(
        { error: "Impossible d'enregistrer les fichiers audio. Réessayez." },
        { status: 502 }
      )
    }

    // ── Création du Recording ─────────────────────────────────────────────────
    // La contrainte d'unicité peut encore rejeter un doublon concurrent
    // (deux onglets / double-clic passés la garde anti-doublon) : P2002 → 409.
    const recordingId = crypto.randomUUID()
    let recording
    try {
      recording = await prisma.recording.create({
        data: {
          id: recordingId,
          audioUrl: path1,
          audioUrl2: path2,
          duration: duration || 0,
          language,
          userId,
          phraseId,
          status: "PENDING",
        },
      })
    } catch (createError) {
      console.error("Recording create error:", createError)
      await deleteRecordingFiles([path1, path2])
      await releaseSlot()
      const isDuplicate =
        (createError as { code?: string }).code === "P2002"
      if (isDuplicate) {
        return NextResponse.json(
          { error: "Vous avez déjà enregistré cette phrase dans cette langue." },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    // ── Passage idempotent en "DONE" ──────────────────────────────────────────
    // UPDATE ... WHERE status = 'PENDING' AND recordingCount >= MAX :
    // sans danger si exécuté plusieurs fois ou en parallèle.
    await prisma.phrase.updateMany({
      where: {
        id: phraseId,
        status: "PENDING",
        recordingCount: { gte: MAX_RECORDINGS },
      },
      data: { status: "DONE" },
    })

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
