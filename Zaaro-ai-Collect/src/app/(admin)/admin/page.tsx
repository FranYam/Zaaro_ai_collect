"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, HardDrive, Clock, TrendingUp, Award } from "lucide-react"

type LangStat = { language: string; totalRecordings: number; totalHours: string; validatedHours: string; progressPct: number; pending: number; validated: number }
type DomainStat = { domain: string; totalRecordings: number; totalHours: string }
type Contributor = { name: string; email: string; count: number; seconds: number }
type Stats = { totalRecordings: number; totalUsers: number; totalHours: string; pending: number; validated: number; rejected: number; validationRate: number }

const DOMAIN_LABELS: Record<string, string> = { sante: "Santé", administration: "Administration", agriculture: "Agriculture", finance: "Finance" }
const DOMAIN_COLORS: Record<string, string> = { sante: "bg-red-400", administration: "bg-blue-400", agriculture: "bg-green-400", finance: "bg-yellow-400" }
const LANG_COLORS = ["bg-purple-500", "bg-indigo-500", "bg-cyan-500", "bg-orange-500"]

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}min`
  if (m > 0) return `${m}min ${s.toString().padStart(2, "0")}s`
  return `${s}s`
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [byLanguage, setByLanguage] = useState<LangStat[]>([])
  const [byDomain, setByDomain] = useState<DomainStat[]>([])
  const [topContributors, setTopContributors] = useState<Contributor[]>([])
  const [recentRecordings, setRecentRecordings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/recordings").then(r => r.json()).then(d => {
      setStats(d.stats)
      setByLanguage(d.byLanguage)
      setByDomain(d.byDomain)
      setTopContributors(d.topContributors)
      setRecentRecordings(d.recordings.slice(0, 8))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="animate-pulse p-8">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-green-dark">Vue d'ensemble</h1>
        <p className="text-slate-500 font-medium mt-1">Résumé des statistiques de la plateforme</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Contributeurs", value: stats.totalUsers, icon: Users, colorBg: "bg-blue-50", colorText: "text-blue-500", sub: "inscrits" },
            { label: "Heures collectées", value: `${stats.totalHours}h`, icon: HardDrive, colorBg: "bg-green-50", colorText: "text-green-600", sub: "objectif 400h" },
            { label: "En attente", value: stats.pending, icon: Clock, colorBg: "bg-yellow-50", colorText: "text-yellow-500", sub: "à valider" },
            { label: "Validation", value: `${stats.validationRate}%`, icon: TrendingUp, colorBg: "bg-primary/10", colorText: "text-primary", sub: `${stats.validated} validés` },
          ].map(({ label, value, icon: Icon, colorBg, colorText, sub }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorBg}`}>
                    <Icon className={`w-5 h-5 ${colorText}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progression par langue vers 100h</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {byLanguage.map((l, i) => (
              <div key={l.language}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{l.language}</span>
                  <span className="text-muted-foreground">{l.validatedHours}h / 100h</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${LANG_COLORS[i]}`}
                    style={{ width: `${Math.max(l.progressPct, l.progressPct > 0 ? 2 : 0)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par domaine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {byDomain.map((d) => {
              const maxRec = Math.max(...byDomain.map(x => x.totalRecordings), 1)
              const pct = Math.round((d.totalRecordings / maxRec) * 100)
              return (
                <div key={d.domain}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{DOMAIN_LABELS[d.domain]}</span>
                    <span className="text-muted-foreground">{d.totalRecordings} enreg. · {d.totalHours}h</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${DOMAIN_COLORS[d.domain]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" /> Top Contributeurs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topContributors.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Aucune contribution.</div>
            ) : (
              <div className="divide-y">
                {topContributors.map((c, i) => (
                  <div key={c.email} className="flex items-center gap-3 p-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? "bg-yellow-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-secondary text-muted-foreground"
                    }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-primary">{formatDuration(c.seconds)}</p>
                      <p className="text-xs text-muted-foreground">{c.count} enreg.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentRecordings.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    r.status === "VALIDATED" ? "bg-green-500" : r.status === "REJECTED" ? "bg-red-500" : "bg-yellow-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{r.phrase.text}</p>
                    <p className="text-xs text-muted-foreground">{r.user.name} · {r.language}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
