import { auth } from "@/../auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import prisma from "@/lib/prisma"
import Link from "next/link"

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

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const recordings = await prisma.recording.findMany({
    where: { userId: session.user.id },
    include: { phrase: { select: { text: true, domain: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historique</h1>
        <p className="text-muted-foreground mt-1">{recordings.length} enregistrement(s) au total</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous mes enregistrements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recordings.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              Vous n'avez encore aucun enregistrement.{" "}
              <Link href="/record" className="text-primary hover:underline">Commencer à contribuer →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {recordings.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{r.phrase.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded">{r.phrase.domain}</span>
                      <span className="text-xs text-muted-foreground">{r.language}</span>
                      <span className="text-xs text-muted-foreground">{r.duration.toFixed(1)}s</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-4 shrink-0 ${statusColor[r.status]}`}>
                    {statusLabel[r.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
