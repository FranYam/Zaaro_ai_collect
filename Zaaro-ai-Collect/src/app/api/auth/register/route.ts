import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      }
    })

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Une erreur est survenue lors de l'inscription" }, { status: 500 })
  }
}
