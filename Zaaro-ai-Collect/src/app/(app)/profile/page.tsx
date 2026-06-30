"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => {
      setProfile(d)
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setProfile({ ...profile, ...data.user })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError("Erreur lors de la mise à jour.")
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-muted-foreground animate-pulse">Chargement du profil...</div>
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Ces informations aident à qualifier vos contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">Profil mis à jour avec succès ✓</div>
            )}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" defaultValue={profile?.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (non modifiable)</Label>
              <Input id="email" value={profile?.email} disabled className="opacity-60" />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Rôle</span>
                <span className="font-medium">{profile?.role === "ADMIN" ? "Administrateur" : "Contributeur"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Membre depuis</span>
                <span className="font-medium">{new Date(profile?.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
