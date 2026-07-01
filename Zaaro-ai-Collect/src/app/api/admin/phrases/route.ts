import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const phraseSchema = z.object({
  text: z.string().min(1),
  domain: z.enum(["sante", "administration", "agriculture", "finance"]),
})

// GET all phrases with recording counts
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const phrases = await prisma.phrase.findMany({
    include: {
      _count: { select: { recordings: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ phrases })
}

// POST: create a new phrase / word / expression
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { text, domain } = phraseSchema.parse(body)

    const phrase = await prisma.phrase.create({
      data: { text: text.trim(), domain, recordingCount: 0, status: "PENDING" },
    })
    return NextResponse.json({ success: true, phrase })
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }
}

// DELETE: remove a phrase (only if no recordings attached)
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const phraseId = searchParams.get("phraseId")

  if (!phraseId) return NextResponse.json({ error: "phraseId requis" }, { status: 400 })

  // Delete recordings referencing this phrase first
  await prisma.recording.deleteMany({ where: { phraseId } })
  await prisma.phrase.delete({ where: { id: phraseId } })

  return NextResponse.json({ success: true })
}
