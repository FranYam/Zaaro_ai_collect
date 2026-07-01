import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

/**
 * Schéma de validation pour la création manuelle d'un texte.
 * - text  : min 1 caractère (accepte les mots courts comme "eau", "non", etc.)
 * - domain: valeur parmi les 4 domaines du projet
 */
const phraseSchema = z.object({
  text: z.string().min(1),
  domain: z.enum(["sante", "administration", "agriculture", "finance"]),
})

/**
 * GET /api/admin/phrases
 *
 * Retourne la liste complète des textes du corpus avec le nombre
 * d'enregistrements reçus, triés par statut (PENDING en premier) puis
 * par date de création décroissante.
 *
 * Accès : ADMIN uniquement.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const phrases = await prisma.phrase.findMany({
    include: {
      // Nombre d'enregistrements liés à chaque phrase (pour l'affichage admin)
      _count: { select: { recordings: true } },
    },
    orderBy: [
      { status: "asc" },      // DONE passe en bas, PENDING reste en haut
      { createdAt: "desc" },  // Plus récents d'abord dans chaque groupe
    ],
  })

  return NextResponse.json({ phrases })
}

/**
 * POST /api/admin/phrases
 *
 * Crée un nouveau texte dans le corpus manuellement.
 * Le texte est trimé avant insertion.
 * Le statut est initialisé à "PENDING" et le compteur à 0.
 *
 * Corps JSON attendu : { text: string, domain: string }
 *
 * Accès : ADMIN uniquement.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { text, domain } = phraseSchema.parse(body)

    const phrase = await prisma.phrase.create({
      data: {
        text: text.trim(),
        domain,
        recordingCount: 0,   // aucun enregistrement au départ
        status: "PENDING",   // disponible pour les contributeurs
      },
    })
    return NextResponse.json({ success: true, phrase })
  } catch {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/phrases?phraseId=<id>
 *
 * Supprime un texte et tous ses enregistrements associés.
 * Les enregistrements sont supprimés en premier pour éviter une violation
 * de contrainte de clé étrangère.
 *
 * Accès : ADMIN uniquement.
 */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const phraseId = searchParams.get("phraseId")

  if (!phraseId) return NextResponse.json({ error: "phraseId requis" }, { status: 400 })

  // Suppression des enregistrements liés d'abord (intégrité référentielle)
  await prisma.recording.deleteMany({ where: { phraseId } })
  await prisma.phrase.delete({ where: { id: phraseId } })

  return NextResponse.json({ success: true })
}
