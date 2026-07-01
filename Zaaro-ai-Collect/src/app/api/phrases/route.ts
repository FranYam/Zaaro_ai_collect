import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/phrases
 *
 * Sélectionne aléatoirement un texte (mot, expression ou phrase) à faire
 * enregistrer par le contributeur connecté.
 *
 * Critères de sélection :
 * 1. Le texte appartient au domaine demandé.
 * 2. Son statut est "PENDING" (moins de 10 enregistrements reçus).
 * 3. Le contributeur courant n'a pas encore enregistré ce texte dans cette langue.
 *
 * Si aucun texte ne satisfait ces critères, la réponse contient { done: true }
 * pour indiquer que le contributeur a complété tous les textes du domaine.
 *
 * Paramètres de requête :
 *   ?domain=sante|administration|agriculture|finance  (obligatoire)
 *   ?language=Mooré|Dioula|...                        (optionnel)
 *
 * Accès : utilisateur connecté (tout rôle).
 */
export async function GET(req: Request) {
  try {
    // ── Authentification ─────────────────────────────────────────────────────
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

    // ── Exclusion des textes déjà enregistrés par cet utilisateur ────────────
    // On cherche tous les phraseId déjà soumis par cet utilisateur (dans cette
    // langue si précisée) pour ne pas les reproposer.
    const recorded = await prisma.recording.findMany({
      where: {
        userId: session.user.id,
        ...(language ? { language } : {}), // filtre langue optionnel
      },
      select: { phraseId: true },
    })
    const recordedIds = recorded.map((r) => r.phraseId)

    // ── Récupération du pool de textes éligibles ──────────────────────────────
    // Seulement les textes PENDING (< 10 enregistrements) du bon domaine,
    // non encore enregistrés par cet utilisateur.
    const available = await prisma.phrase.findMany({
      where: {
        domain,
        status: "PENDING",
        ...(recordedIds.length > 0 ? { id: { notIn: recordedIds } } : {}),
      },
      select: { id: true, text: true, recordingCount: true },
    })

    // Pool vide → tous les textes sont DONE ou déjà enregistrés par l'utilisateur
    if (available.length === 0) {
      return NextResponse.json({
        done: true,
        message: "Bravo ! Vous avez enregistré toutes les phrases disponibles pour ce domaine.",
      })
    }

    // ── Sélection aléatoire ───────────────────────────────────────────────────
    // Math.random() * available.length donne un index aléatoire entre 0 et N-1
    const phrase = available[Math.floor(Math.random() * available.length)]

    return NextResponse.json({ phrase })

  } catch (error) {
    console.error("Phrases fetch error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
