import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

const VALID_DOMAINS = ["sante", "administration", "agriculture", "finance"]

/**
 * POST /api/admin/phrases/import
 * Body: multipart/form-data with a "file" field (CSV: text,domain)
 * - Skips header row
 * - Normalises text (trim, collapse whitespace)
 * - Deduplicates case-insensitively against existing DB rows
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  let csvText: string
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni (champ 'file' manquant)" }, { status: 400 })
    }
    csvText = await file.text()
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 400 })
  }

  // Parse CSV rows (skip blank lines and header)
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // Detect and remove header line (if first row contains literal "text")
  const startIndex =
    lines.length > 0 && lines[0].toLowerCase().startsWith("text") ? 1 : 0

  const rows: { text: string; domain: string }[] = []
  const errors: string[] = []

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(",")
    if (cols.length < 2) {
      errors.push(`Ligne ${i + 1}: format invalide (attendu: text,domain)`)
      continue
    }

    const text = cols.slice(0, cols.length - 1).join(",").trim()  // allow commas in text
    const domain = cols[cols.length - 1].trim().toLowerCase()

    if (!text) {
      errors.push(`Ligne ${i + 1}: texte vide`)
      continue
    }
    if (!VALID_DOMAINS.includes(domain)) {
      errors.push(`Ligne ${i + 1}: domaine invalide "${domain}" (attendu: ${VALID_DOMAINS.join(", ")})`)
      continue
    }

    rows.push({ text, domain })
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne valide dans le fichier CSV", details: errors },
      { status: 400 }
    )
  }

  // Fetch existing texts for deduplication (case-insensitive)
  const existing = await prisma.phrase.findMany({ select: { text: true } })
  const existingNormalised = new Set(existing.map((p) => p.text.trim().toLowerCase()))

  const toInsert = rows.filter((r) => !existingNormalised.has(r.text.toLowerCase()))
  const duplicateCount = rows.length - toInsert.length

  if (toInsert.length === 0) {
    return NextResponse.json({
      success: true,
      inserted: 0,
      duplicates: duplicateCount,
      errors,
      message: "Toutes les entrées existent déjà dans la base de données.",
    })
  }

  const result = await prisma.phrase.createMany({
    data: toInsert.map((r) => ({
      text: r.text,
      domain: r.domain,
      recordingCount: 0,
      status: "PENDING",
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({
    success: true,
    inserted: result.count,
    duplicates: duplicateCount,
    errors,
    message: `${result.count} entrée(s) importée(s) avec succès.`,
  })
}
