import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const domain = searchParams.get("domain")
    const language = searchParams.get("language")

    if (!domain) {
      return NextResponse.json({ error: "Domaine requis" }, { status: 400 })
    }

    // Get a phrase not yet recorded by this user in this language
    const recorded = await prisma.recording.findMany({
      where: { userId: session.user.id, language: language || undefined },
      select: { phraseId: true }
    })
    const recordedIds = recorded.map((r) => r.phraseId)

    const phrase = await prisma.phrase.findFirst({
      where: {
        domain,
        id: { notIn: recordedIds.length > 0 ? recordedIds : undefined }
      }
    })

    if (!phrase) {
      return NextResponse.json({ done: true, message: "Toutes les phrases ont été enregistrées pour ce domaine !" })
    }

    return NextResponse.json({ phrase })

  } catch (error) {
    console.error("Phrases fetch error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
