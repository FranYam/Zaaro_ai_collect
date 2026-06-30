import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { resolveRecordingPlaybackUrls } from "@/lib/supabase/storage"

const LANGUAGES = ["Mooré", "Dioula", "Gourounsi", "Fulfulde"]
const DOMAINS = ["sante", "administration", "agriculture", "finance"]
const GOAL_SECONDS = 100 * 3600

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const [recordings, users] = await Promise.all([
    prisma.recording.findMany({
      include: {
        user: { select: { name: true, email: true } },
        phrase: { select: { text: true, domain: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const totalSeconds = recordings.reduce((s, r) => s + (r.duration || 0), 0)

  const byLanguage = LANGUAGES.map((lang) => {
    const recs = recordings.filter(r => r.language === lang)
    const secs = recs.reduce((s, r) => s + (r.duration || 0), 0)
    const validated = recs.filter(r => r.status === "VALIDATED")
    const validatedSecs = validated.reduce((s, r) => s + (r.duration || 0), 0)
    return {
      language: lang,
      totalRecordings: recs.length,
      totalSeconds: secs,
      totalHours: (secs / 3600).toFixed(2),
      validatedSeconds: validatedSecs,
      validatedHours: (validatedSecs / 3600).toFixed(2),
      progressPct: Math.min(100, Math.round((validatedSecs / GOAL_SECONDS) * 100)),
      pending: recs.filter(r => r.status === "PENDING").length,
      validated: validated.length,
    }
  })

  const byDomain = DOMAINS.map((domain) => {
    const recs = recordings.filter(r => r.phrase.domain === domain)
    const secs = recs.reduce((s, r) => s + (r.duration || 0), 0)
    return {
      domain,
      totalRecordings: recs.length,
      totalSeconds: secs,
      totalHours: (secs / 3600).toFixed(2),
    }
  })

  const contribMap: Record<string, { name: string; email: string; count: number; seconds: number }> = {}
  for (const r of recordings) {
    if (!contribMap[r.userId]) {
      contribMap[r.userId] = { name: r.user.name, email: r.user.email, count: 0, seconds: 0 }
    }
    contribMap[r.userId].count++
    contribMap[r.userId].seconds += r.duration || 0
  }
  const topContributors = Object.values(contribMap)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5)

  const recordingsWithUrls = await Promise.all(
    recordings.map((recording) => resolveRecordingPlaybackUrls(recording))
  )

  return NextResponse.json({
    recordings: recordingsWithUrls,
    users,
    byLanguage,
    byDomain,
    topContributors,
    stats: {
      totalRecordings: recordings.length,
      totalUsers: users.length,
      totalSeconds,
      totalHours: (totalSeconds / 3600).toFixed(1),
      pending: recordings.filter(r => r.status === "PENDING").length,
      validated: recordings.filter(r => r.status === "VALIDATED").length,
      rejected: recordings.filter(r => r.status === "REJECTED").length,
      validationRate: recordings.length > 0
        ? Math.round((recordings.filter(r => r.status === "VALIDATED").length / recordings.length) * 100)
        : 0,
    }
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }
  const body = await req.json()
  const { recordingId, status } = body
  if (!recordingId || !["PENDING", "VALIDATED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }
  const updated = await prisma.recording.update({
    where: { id: recordingId },
    data: { status },
  })
  return NextResponse.json({ success: true, recording: updated })
}
