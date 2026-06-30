import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const recordings = await prisma.recording.findMany({
    where: { userId: session.user.id },
    select: { duration: true, status: true, createdAt: true, language: true }
  })

  const totalSeconds = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return NextResponse.json({
    totalRecordings: recordings.length,
    totalDuration: `${hours}h ${minutes.toString().padStart(2, "0")}min`,
    validated: recordings.filter(r => r.status === "VALIDATED").length,
    pending: recordings.filter(r => r.status === "PENDING").length,
    rejected: recordings.filter(r => r.status === "REJECTED").length,
  })
}
