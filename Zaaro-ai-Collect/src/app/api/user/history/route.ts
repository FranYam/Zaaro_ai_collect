import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const recordings = await prisma.recording.findMany({
    where: { userId: session.user.id },
    include: { phrase: { select: { text: true, domain: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ recordings })
}
