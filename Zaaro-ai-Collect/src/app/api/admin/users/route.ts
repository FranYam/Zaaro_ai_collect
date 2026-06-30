import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

// GET all users
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true,
      role: true, createdAt: true,
      _count: { select: { recordings: true } }
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ users })
}

// PATCH: update user role
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const { userId, role } = body

  if (!userId || !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  // Prevent self-demotion
  if (userId === session.user.id && role === "USER") {
    return NextResponse.json({ error: "Vous ne pouvez pas retirer vos propres droits admin" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true }
  })

  return NextResponse.json({ success: true, user: updated })
}

// DELETE: remove a user and their recordings
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })
  if (userId === session.user.id) return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 })

  // Delete recordings first (foreign key constraint)
  await prisma.recording.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
