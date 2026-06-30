import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { isSupabaseConfigured } from "@/lib/supabase/admin"
import {
  buildRecordingPath,
  deleteRecordingFiles,
  uploadRecordingFile,
} from "@/lib/supabase/storage"

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

    const recordingId = crypto.randomUUID()
    const path1 = buildRecordingPath(session.user.id, recordingId, 1)
    const path2 = buildRecordingPath(session.user.id, recordingId, 2)

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

    const recording = await prisma.recording.create({
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
    })

    return NextResponse.json({ success: true, recording })

  } catch (error) {
    console.error("Recording save error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
