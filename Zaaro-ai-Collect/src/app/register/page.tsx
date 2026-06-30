"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const passwordConfirm = formData.get("passwordConfirm") as string

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription")
        setLoading(false)
        return
      }

      // Auto login after registration
      await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("Erreur de connexion au serveur")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-[#F5F8FA]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-extrabold text-center text-brand-green-dark">Zaaro AI Collect</CardTitle>
          <CardDescription className="text-center text-slate-500 font-medium">
            Créer un compte contributeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="text-sm font-medium text-destructive text-center p-3 bg-destructive/10 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-semibold">Nom complet</Label>
              <Input id="name" name="name" placeholder="Entrez votre nom complet" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Adresse email</Label>
              <Input id="email" name="email" type="email" placeholder="exemple@mail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold">Mot de passe</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-slate-700 font-semibold">Confirmer le mot de passe</Label>
              <Input id="passwordConfirm" name="passwordConfirm" type="password" required />
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-base py-6" disabled={loading}>
                {loading ? "Création en cours..." : "Créer mon compte"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <div className="text-sm font-medium text-slate-500">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-brand-green font-bold hover:underline">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
