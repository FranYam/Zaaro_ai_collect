import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { isSupabaseConfigured } from "@/lib/supabase/admin"
import {
  deleteRecordingFiles,
  uploadRecordingFile,
} from "@/lib/supabase/storage"

const RECORDINGS_BUCKET = "recordings"
const MAX_RECORDINGS = 10

/** Build a numbered path: <userId>/<phraseId>/text_<n>.webm */
function buildNumberedPath(userId: string, phraseId: string, take: 1 | 2, count: number) {
  return `${userId}/${phraseId}/text_${count}_take${take}.webm`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Stockage Supabase non configuré. Vérifiez les variables d'environnement." },
        { status: 503 }
      )
    }

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

    // Fetch current phrase to get the current count and verify it's still PENDING
    const phrase = await prisma.phrase.findUnique({
      where: { id: phraseId },
      select: { id: true, recordingCount: true, status: true },
    })

    if (!phrase) {
      return NextResponse.json({ error: "Phrase introuvable" }, { status: 404 })
    }
    if (phrase.status === "DONE") {
      return NextResponse.json({ error: "Cette phrase a déjà atteint le nombre maximum d'enregistrements." }, { status: 409 })
    }

    const newCount = phrase.recordingCount + 1

    // Build numbered file paths
    const path1 = buildNumberedPath(session.user.id, phraseId, 1, newCount)
    const path2 = buildNumberedPath(session.user.id, phraseId, 2, newCount)

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

    // Create the Recording and update the Phrase counter atomically in a transaction
    const [recording] = await prisma.$transaction([
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
      prisma.phrase.update({
        where: { id: phraseId },
        data: {
          recordingCount: newCount,
          ...(newCount >= MAX_RECORDINGS ? { status: "DONE" } : {}),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      recording,
      phraseCompleted: newCount >= MAX_RECORDINGS,
      recordingNumber: newCount,
    })

  } catch (error) {
    console.error("Recording save error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
