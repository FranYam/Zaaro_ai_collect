import { NextResponse } from "next/server"
import { auth } from "@/../auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  try {
    const body = await req.json()
    const { name } = body

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true, email: true, role: true }
    })
    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}
