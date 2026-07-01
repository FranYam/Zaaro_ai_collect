"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError("Identifiants invalides")
        setLoading(false)
      } else {
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        if (sessionData?.user?.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
        router.refresh()
      }
    } catch (err) {
      setError("Une erreur est survenue")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 bg-[#F5F8FA]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-8">
          <CardTitle className="text-3xl font-extrabold text-center text-brand-green-dark">Zaaro AI Collect</CardTitle>
          <CardDescription className="text-center text-slate-500 font-medium">
            Connectez-vous pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="text-sm font-medium text-destructive text-center p-3 bg-destructive/10 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Adresse email</Label>
              <Input id="email" name="email" type="email" placeholder="exemple@mail.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Mot de passe</Label>
                <Link href="#" className="text-sm font-bold text-brand-red hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40" />
              <Label htmlFor="remember" className="font-medium text-sm text-slate-600">Se souvenir de moi</Label>
            </div>
            <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-base py-6" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <div className="text-sm font-medium text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-brand-green font-bold hover:underline">
              S'inscrire
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
