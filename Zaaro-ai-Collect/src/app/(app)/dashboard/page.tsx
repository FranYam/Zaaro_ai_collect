import { auth } from "@/../auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Mic, Clock, CheckCircle, AlertCircle } from "lucide-react"

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`
  }

  return `${secs}s`
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const recordings = await prisma.recording.findMany({
    where: { userId: session.user.id },
    include: { phrase: { select: { text: true, domain: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const totalSeconds = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)

  const validated = recordings.filter(r => r.status === "VALIDATED").length
  const pending = recordings.filter(r => r.status === "PENDING").length
  const goal = 100 * 3600 // 100h in seconds
  const progressPct = Math.min(100, Math.round((totalSeconds / goal) * 100))

  const statusColor: Record<string, string> = {
    VALIDATED: "text-green-600 bg-green-50",
    PENDING: "text-yellow-600 bg-yellow-50",
    REJECTED: "text-red-600 bg-red-50",
  }
  const statusLabel: Record<string, string> = {
    VALIDATED: "Validé",
    PENDING: "En attente",
    REJECTED: "Rejeté",
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-green-dark">Bonjour {session?.user?.name} 👋</h1>
          <p className="text-slate-500 font-medium mt-1">Voici un résumé de votre activité</p>
        </div>
        <Link href="/record">
          <Button size="lg" className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white font-bold shadow-sm">
            <Mic className="w-4 h-4" />
            Contribuer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Temps enregistré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatDuration(totalSeconds)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mic className="w-4 h-4" /> Phrases soumises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{recordings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Validées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{validated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression vers l'objectif 100h</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{formatDuration(totalSeconds)} enregistrées</span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-3" />
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Derniers enregistrements</h2>
          <Link href="/history" className="text-sm text-primary hover:underline">Voir tout</Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {recordings.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Aucun enregistrement pour le moment.{" "}
                <Link href="/record" className="text-primary hover:underline">Commencer à contribuer</Link>
              </div>
            ) : (
              <div className="divide-y">
                {recordings.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{r.phrase.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.phrase.domain} · {r.language} · {new Date(r.createdAt).toLocaleDateString("fr-FR")} · {formatDuration(r.duration || 0)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
