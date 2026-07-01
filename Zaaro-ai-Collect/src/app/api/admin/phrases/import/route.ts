import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

/**
 * Domaines valides pour le corpus.
 * À mettre à jour ici si de nouveaux domaines sont ajoutés.
 */
const VALID_DOMAINS = ["sante", "administration", "agriculture", "finance"]

/**
 * POST /api/admin/phrases/import
 *
 * Permet à un administrateur d'importer en masse des textes (mots, expressions,
 * phrases) via un fichier CSV.
 *
 * Format CSV attendu (2 colonnes) :
 *   text,domain
 *   bonjour,sante
 *   le marché,finance
 *
 * Règles d'import :
 * - La première ligne est ignorée si elle commence par "text" (ligne d'en-tête).
 * - Les lignes vides et les lignes mal formatées sont ignorées et rapportées.
 * - Le domaine doit appartenir à VALID_DOMAINS (insensible à la casse).
 * - Les textes identiques à des entrées existantes (comparaison insensible à la
 *   casse et aux espaces) sont ignorés silencieusement (dédupliqués).
 * - L'insertion est réalisée en une seule requête (createMany + skipDuplicates).
 *
 * Réponse JSON :
 *   { success, inserted, duplicates, errors, message }
 *
 * Accès : ADMIN uniquement.
 */
export async function POST(req: Request) {
  // ── Authentification & autorisation ────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  // ── Lecture du fichier CSV depuis le FormData ───────────────────────────────
  let csvText: string
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni (champ 'file' manquant)" },
        { status: 400 }
      )
    }
    csvText = await file.text()
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 400 })
  }

  // ── Découpage et nettoyage des lignes ──────────────────────────────────────
  const lines = csvText
    .split(/\r?\n/)       // supporte CRLF (Windows) et LF (Unix)
    .map((l) => l.trim())
    .filter(Boolean)      // supprime les lignes vides

  // Ignorer la ligne d'en-tête si elle commence par "text"
  const startIndex =
    lines.length > 0 && lines[0].toLowerCase().startsWith("text") ? 1 : 0

  const rows: { text: string; domain: string }[] = []
  const errors: string[] = [] // lignes ignorées avec leur raison

  // ── Parsing ligne par ligne ────────────────────────────────────────────────
  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(",")

    if (cols.length < 2) {
      errors.push(`Ligne ${i + 1}: format invalide (attendu: text,domain)`)
      continue
    }

    // Le texte peut contenir des virgules → on prend tout sauf la dernière colonne
    const text = cols.slice(0, cols.length - 1).join(",").trim()
    const domain = cols[cols.length - 1].trim().toLowerCase()

    if (!text) {
      errors.push(`Ligne ${i + 1}: texte vide`)
      continue
    }
    if (!VALID_DOMAINS.includes(domain)) {
      errors.push(
        `Ligne ${i + 1}: domaine invalide "${domain}" (attendu: ${VALID_DOMAINS.join(", ")})`
      )
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

  // ── Déduplication contre la base existante (insensible à la casse) ─────────
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

  // ── Insertion en masse ─────────────────────────────────────────────────────
  // skipDuplicates : sécurité supplémentaire au niveau DB (contrainte unique éventuelle)
  const result = await prisma.phrase.createMany({
    data: toInsert.map((r) => ({
      text: r.text,
      domain: r.domain,
      recordingCount: 0,    // commence à 0 enregistrements
      status: "PENDING",    // disponible immédiatement pour les contributeurs
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
