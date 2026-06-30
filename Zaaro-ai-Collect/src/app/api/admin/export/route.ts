import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const recordings = await prisma.recording.findMany({
    include: {
      user: { select: { name: true, email: true } },
      phrase: { select: { text: true, domain: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Build CSV
  const header = ["ID", "Statut", "Langue", "Durée(s)", "Utilisateur", "Email", "Domaine", "Phrase", "Audio Prise 1", "Audio Prise 2", "Date"].join(",")

  const rows = recordings.map(r => [
    r.id,
    r.status,
    r.language,
    r.duration.toFixed(1),
    `"${r.user.name}"`,
    r.user.email,
    r.phrase.domain,
    `"${r.phrase.text.replace(/"/g, '""')}"`,
    r.audioUrl,
    r.audioUrl2 ?? "",
    new Date(r.createdAt).toISOString(),
  ].join(","))

  const csv = [header, ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zaaro-export-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
