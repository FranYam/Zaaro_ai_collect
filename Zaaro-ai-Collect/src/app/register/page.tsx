"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  
  const isPasswordValid = Object.values(validations).every(Boolean)
  const isFormValid = isPasswordValid && password === passwordConfirm && password !== ""

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas tous les critères")
      setLoading(false)
      return
    }

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
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Critères de mot de passe */}
            <div className="space-y-1 text-sm bg-white p-3 rounded-md border border-slate-200">
              <p className="font-semibold text-slate-700 mb-2 text-xs">Le mot de passe doit contenir :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`flex items-center gap-2 ${validations.length ? "text-brand-green" : "text-slate-500"}`}>
                  {validations.length ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>Au moins 8 caractères</span>
                </div>
                <div className={`flex items-center gap-2 ${validations.uppercase ? "text-brand-green" : "text-slate-500"}`}>
                  {validations.uppercase ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>Une majuscule</span>
                </div>
                <div className={`flex items-center gap-2 ${validations.lowercase ? "text-brand-green" : "text-slate-500"}`}>
                  {validations.lowercase ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>Une minuscule</span>
                </div>
                <div className={`flex items-center gap-2 ${validations.number ? "text-brand-green" : "text-slate-500"}`}>
                  {validations.number ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>Un chiffre</span>
                </div>
                <div className={`flex items-center gap-2 ${validations.special ? "text-brand-green" : "text-slate-500"}`}>
                  {validations.special ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>Un caractère spécial</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-slate-700 font-semibold">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input 
                  id="passwordConfirm" 
                  name="passwordConfirm" 
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-base py-6 disabled:opacity-50" disabled={loading || !isFormValid}>
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
