"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Trash2 } from "lucide-react"

type User = {
  id: string; name: string; email: string; role: string; createdAt: string
  _count: { recordings: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      setUsers(d.users)
      setLoading(false)
    })
  }, [])

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN"
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      const d = await res.json()
      alert(d.error)
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Supprimer l'utilisateur "${name}" et tous ses enregistrements ?`)) return
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
  }

  if (loading) return <div className="animate-pulse p-8">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground mt-1">Gérez les comptes, les rôles et les accès</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes enregistrés ({users.length})</CardTitle>
          <CardDescription>Tous les contributeurs et administrateurs de la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors flex-wrap">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{u.name}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      u.role === "ADMIN" ? "bg-yellow-100 text-yellow-700" : "bg-secondary text-muted-foreground"
                    }`}>{u.role === "ADMIN" ? "Admin" : "Contributeur"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-sm font-bold">{u._count.recordings}</p>
                  <p className="text-xs text-muted-foreground">enreg.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Inscrit le</p>
                  <p className="text-xs font-medium">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline"
                    className={u.role === "ADMIN" ? "text-slate-600" : "text-yellow-600 border-yellow-200 hover:bg-yellow-50"}
                    onClick={() => handleRoleToggle(u.id, u.role)}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    {u.role === "ADMIN" ? "Rétrograder" : "Promouvoir Admin"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteUser(u.id, u.name)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
