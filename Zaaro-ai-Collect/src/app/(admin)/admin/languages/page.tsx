"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type LangStat = { language: string; totalRecordings: number; totalHours: string; validatedHours: string; progressPct: number; pending: number; validated: number }

const LANG_COLORS = ["bg-purple-500", "bg-indigo-500", "bg-cyan-500", "bg-orange-500"]

export default function AdminLanguagesPage() {
  const [byLanguage, setByLanguage] = useState<LangStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/recordings").then(r => r.json()).then(d => {
      setByLanguage(d.byLanguage)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="animate-pulse p-8">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Progression par Langues</h1>
        <p className="text-muted-foreground mt-1">Détail des contributions pour chaque langue cible</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {byLanguage.map((l, i) => (
          <Card key={l.language}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{l.language}</CardTitle>
                <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-full ${LANG_COLORS[i]}`}>{l.progressPct}%</span>
              </div>
              <CardDescription>Progression vers l'objectif 100h audio validées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${LANG_COLORS[i]}`}
                  style={{ width: `${Math.max(l.progressPct, l.progressPct > 0 ? 1 : 0)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xl font-bold">{l.totalRecordings}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-green-600">{l.validated}</p>
                  <p className="text-xs text-muted-foreground">Validés</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-yellow-600">{l.pending}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total collecté</span>
                  <span className="font-medium">{l.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validé</span>
                  <span className="font-medium text-green-600">{l.validatedHours}h / 100h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restant</span>
                  <span className="font-medium text-primary">
                    {Math.max(0, 100 - parseFloat(l.validatedHours)).toFixed(2)}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
