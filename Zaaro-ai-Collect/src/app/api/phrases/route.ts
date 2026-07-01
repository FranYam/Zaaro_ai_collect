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

    // Find IDs already recorded by this user (in this language)
    const recorded = await prisma.recording.findMany({
      where: { userId: session.user.id, ...(language ? { language } : {}) },
      select: { phraseId: true },
    })
    const recordedIds = recorded.map((r) => r.phraseId)

    // Fetch all PENDING phrases for this domain not yet done by this user
    const available = await prisma.phrase.findMany({
      where: {
        domain,
        status: "PENDING",
        ...(recordedIds.length > 0 ? { id: { notIn: recordedIds } } : {}),
      },
      select: { id: true, text: true, recordingCount: true },
    })

    if (available.length === 0) {
      return NextResponse.json({
        done: true,
        message: "Bravo ! Vous avez enregistré toutes les phrases disponibles pour ce domaine.",
      })
    }

    // Pick one at random
    const phrase = available[Math.floor(Math.random() * available.length)]

    return NextResponse.json({ phrase })

  } catch (error) {
    console.error("Phrases fetch error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
