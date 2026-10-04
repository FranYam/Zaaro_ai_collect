import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { resolveRecordingPlaybackUrls } from "@/lib/supabase/storage"

const LANGUAGES = ["Mooré", "Dioula", "Gourounsi", "Fulfulde"]
const DOMAINS = ["sante", "administration", "agriculture", "finance"]
const GOAL_SECONDS = 100 * 3600

/** Taille de page maximale acceptée pour la liste des enregistrements. */
const MAX_PAGE_SIZE = 100
/** Taille de page par défaut (utilisée par la page de validation). */
const DEFAULT_PAGE_SIZE = 25

/**
 * GET /api/admin/recordings
 *
 * Renvoie les statistiques de la plateforme ET une page d'enregistrements.
 *
 * Toutes les statistiques sont calculées par PostgreSQL via des agrégations
 * groupBy (résultats bornés), et les URLs signées Supabase ne sont générées
 * que pour les enregistrements de la page demandée — plus jamais pour
 * l'intégralité de la table.
 *
 * Paramètres de requête :
 *   page     - numéro de page (1-indexé, défaut 1)
 *   pageSize - taille de page (défaut 25, max 100) ;
 *              0 = ne pas renvoyer de liste du tout (stats seules, aucune
 *              URL signée — utilisé par la page Langues)
 *   status   - filtre serveur sur le statut : PENDING | VALIDATED | REJECTED
 *              (défaut ALL)
 *
 * Réponse JSON :
 *   { recordings, pagination, byLanguage, byDomain, topContributors, stats }
 *
 * Accès : administrateur.
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // ── Paramètres : pagination + filtre de statut ─────────────────────────────
  const { searchParams } = new URL(req.url)
  const parsedPage = parseInt(searchParams.get("page") ?? "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const parsedSize = parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)
  const pageSize = Number.isFinite(parsedSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(0, parsedSize))
    : DEFAULT_PAGE_SIZE

  const statusParam = searchParams.get("status") ?? "ALL"
  const statusFilter = ["PENDING", "VALIDATED", "REJECTED"].includes(statusParam)
    ? statusParam
    : "ALL"

  const listWhere = statusFilter === "ALL" ? {} : { status: statusFilter }
  const wantList = pageSize > 0

  // ── Agrégations SQL (toutes indépendantes → parallélisées) ────────────────
  const [statusGroups, langGroups, phraseGroups, userGroups, phrases, totalUsers] =
    await Promise.all([
      // Compteurs + durées par statut (stats globales)
      prisma.recording.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { duration: true },
      }),
      // Compteurs + durées par langue ET statut (progression par langue)
      prisma.recording.groupBy({
        by: ["language", "status"],
        _count: { _all: true },
        _sum: { duration: true },
      }),
      // Compteurs + durées par phrase (répartition par domaine)
      prisma.recording.groupBy({
        by: ["phraseId"],
        _count: { _all: true },
        _sum: { duration: true },
      }),
      // Compteurs + durées par contributeur (top contributeurs)
      prisma.recording.groupBy({
        by: ["userId"],
        _count: { _all: true },
        _sum: { duration: true },
      }),
      // Map phraseId → domaine (jointure faite en JS, bornée par le nb de phrases)
      prisma.phrase.findMany({ select: { id: true, domain: true } }),
      prisma.user.count(),
    ])

  // ── Stats globales ─────────────────────────────────────────────────────────
  const totalRecordings = statusGroups.reduce((s, g) => s + g._count._all, 0)
  const totalSeconds = statusGroups.reduce((s, g) => s + (g._sum.duration ?? 0), 0)
  const countByStatus = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0
  const validated = countByStatus("VALIDATED")

  // ── Progression par langue (objectif 100h validées) ────────────────────────
  const byLanguage = LANGUAGES.map((lang) => {
    const groups = langGroups.filter((g) => g.language === lang)
    const secs = groups.reduce((s, g) => s + (g._sum.duration ?? 0), 0)
    const validatedGroup = groups.find((g) => g.status === "VALIDATED")
    const validatedSecs = validatedGroup?._sum.duration ?? 0
    return {
      language: lang,
      totalRecordings: groups.reduce((s, g) => s + g._count._all, 0),
      totalSeconds: secs,
      totalHours: (secs / 3600).toFixed(2),
      validatedSeconds: validatedSecs,
      validatedHours: (validatedSecs / 3600).toFixed(2),
      progressPct: Math.min(100, Math.round((validatedSecs / GOAL_SECONDS) * 100)),
      pending: groups.find((g) => g.status === "PENDING")?._count._all ?? 0,
      validated: validatedGroup?._count._all ?? 0,
    }
  })

  // ── Répartition par domaine ────────────────────────────────────────────────
  const domainOf = new Map(phrases.map((ph) => [ph.id, ph.domain]))
  const byDomain = DOMAINS.map((domain) => {
    const groups = phraseGroups.filter((g) => domainOf.get(g.phraseId) === domain)
    const secs = groups.reduce((s, g) => s + (g._sum.duration ?? 0), 0)
    return {
      domain,
      totalRecordings: groups.reduce((s, g) => s + g._count._all, 0),
      totalSeconds: secs,
      totalHours: (secs / 3600).toFixed(2),
    }
  })

  // ── Top contributeurs (5 premiers par durée totale) ────────────────────────
  const topUsers = [...userGroups]
    .sort((a, b) => (b._sum.duration ?? 0) - (a._sum.duration ?? 0))
    .slice(0, 5)
  const topUserRows = topUsers.length
    ? await prisma.user.findMany({
        where: { id: { in: topUsers.map((u) => u.userId) } },
        select: { id: true, name: true, email: true },
      })
    : []
  const userById = new Map(topUserRows.map((u) => [u.id, u]))
  const topContributors = topUsers
    .map((u) => ({
      name: userById.get(u.userId)?.name ?? "Inconnu",
      email: userById.get(u.userId)?.email ?? "",
      count: u._count._all,
      seconds: u._sum.duration ?? 0,
    }))

  // ── Liste paginée (sautée si pageSize=0 : stats seules) ────────────────────
  let recordingsWithUrls: Awaited<ReturnType<typeof resolveRecordingPlaybackUrls>>[] = []
  let total = 0
  let totalPages = 1

  if (wantList) {
    const [recordings, count] = await Promise.all([
      prisma.recording.findMany({
        where: listWhere,
        include: {
          user: { select: { name: true, email: true } },
          phrase: { select: { text: true, domain: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recording.count({ where: listWhere }),
    ])
    total = count
    totalPages = Math.max(1, Math.ceil(total / pageSize))
    // URLs signées uniquement pour la page courante (≤ 2×pageSize appels)
    recordingsWithUrls = await Promise.all(
      recordings.map((recording) => resolveRecordingPlaybackUrls(recording))
    )
  }

  return NextResponse.json({
    recordings: recordingsWithUrls,
    pagination: { page, pageSize, total, totalPages },
    byLanguage,
    byDomain,
    topContributors,
    stats: {
      totalRecordings,
      totalUsers,
      totalSeconds,
      totalHours: (totalSeconds / 3600).toFixed(1),
      pending: countByStatus("PENDING"),
      validated,
      rejected: countByStatus("REJECTED"),
      validationRate: totalRecordings > 0
        ? Math.round((validated / totalRecordings) * 100)
        : 0,
    },
  })
}

/**
 * PATCH /api/admin/recordings
 *
 * Met à jour le statut d'un enregistrement (validation / rejet).
 *
 * Corps JSON :
 *   recordingId - ID de l'enregistrement
 *   status      - "PENDING" | "VALIDATED" | "REJECTED"
 *
 * Accès : administrateur.
 */
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
