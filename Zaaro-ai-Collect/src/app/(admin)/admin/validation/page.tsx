"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Users } from "lucide-react"

type Recording = {
  id: string; status: string; language: string; duration: number
  createdAt: string; userId: string; audioUrl: string; audioUrl2?: string | null
  user: { name: string; email: string }
  phrase: { text: string; domain: string }
}

const statusBadge: Record<string, string> = {
  VALIDATED: "text-green-600 bg-green-50 border border-green-200",
  PENDING: "text-yellow-600 bg-yellow-50 border border-yellow-200",
  REJECTED: "text-red-600 bg-red-50 border border-red-200",
}
const statusLabel: Record<string, string> = { VALIDATED: "Validé", PENDING: "En attente", REJECTED: "Rejeté" }

const DOMAIN_LABELS: Record<string, string> = {
  sante: "Santé", administration: "Administration", agriculture: "Agriculture", finance: "Finance"
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}min`
  if (m > 0) return `${m}min ${s.toString().padStart(2, "0")}s`
  return `${s}s`
}

export default function AdminValidationPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [validationFilter, setValidationFilter] = useState<"pending" | "all">("pending")

  useEffect(() => {
    fetch("/api/admin/recordings").then(r => r.json()).then(d => {
      setRecordings(d.recordings)
      setLoading(false)
    })
  }, [])

  const handleStatus = async (id: string, status: "VALIDATED" | "REJECTED") => {
    const res = await fetch("/api/admin/recordings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordingId: id, status }),
    })
    if (res.ok) {
      setRecordings(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  const displayed = validationFilter === "pending"
    ? recordings.filter(r => r.status === "PENDING")
    : recordings

  if (loading) return <div className="animate-pulse p-8">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">File de validation</h1>
          <p className="text-muted-foreground mt-1">Validez ou rejetez les enregistrements des contributeurs</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={validationFilter === "pending" ? "default" : "outline"} onClick={() => setValidationFilter("pending")}>
            En attente
          </Button>
          <Button size="sm" variant={validationFilter === "all" ? "default" : "outline"} onClick={() => setValidationFilter("all")}>
            Tous ({recordings.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {displayed.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {validationFilter === "pending" ? "✅ Aucun enregistrement en attente." : "Aucun enregistrement."}
            </div>
          ) : (
            <div className="divide-y">
              {displayed.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{r.phrase.text}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded font-medium">
                          <Users className="w-3 h-3" /> {r.user.name}
                        </span>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded capitalize">{DOMAIN_LABELS[r.phrase.domain]}</span>
                        <span className="text-xs text-muted-foreground">{r.language}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground font-medium">{formatDuration(r.duration)}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {(r.audioUrl || r.audioUrl2) && (
                        <div className="mt-3 space-y-2">
                          {r.audioUrl && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Prise 1</p>
                              <audio controls src={r.audioUrl} className="h-8 w-full max-w-md" />
                            </div>
                          )}
                          {r.audioUrl2 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Prise 2</p>
                              <audio controls src={r.audioUrl2} className="h-8 w-full max-w-md" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status !== "PENDING" ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[r.status]}`}>
                          {statusLabel[r.status]}
                        </span>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 gap-1"
                            onClick={() => handleStatus(r.id, "VALIDATED")}>
                            <CheckCircle className="w-3.5 h-3.5" /> Valider
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                            onClick={() => handleStatus(r.id, "REJECTED")}>
                            <XCircle className="w-3.5 h-3.5" /> Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
