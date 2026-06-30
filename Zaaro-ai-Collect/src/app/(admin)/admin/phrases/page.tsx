"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

type Phrase = { id: string; text: string; domain: string; createdAt: string; _count: { recordings: number } }

const DOMAIN_LABELS: Record<string, string> = { sante: "Santé", administration: "Administration", agriculture: "Agriculture", finance: "Finance" }
const DOMAIN_COLORS: Record<string, string> = { sante: "bg-red-400", administration: "bg-blue-400", agriculture: "bg-green-400", finance: "bg-yellow-400" }

export default function AdminPhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)
  const [newPhraseText, setNewPhraseText] = useState("")
  const [newPhraseDomain, setNewPhraseDomain] = useState("sante")
  const [addingPhrase, setAddingPhrase] = useState(false)
  const [phraseSuccess, setPhraseSuccess] = useState("")

  useEffect(() => {
    fetch("/api/admin/phrases").then(r => r.json()).then(d => {
      setPhrases(d.phrases)
      setLoading(false)
    })
  }, [])

  const handleAddPhrase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPhraseText.trim()) return
    setAddingPhrase(true)
    const res = await fetch("/api/admin/phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newPhraseText, domain: newPhraseDomain }),
    })
    if (res.ok) {
      const d = await res.json()
      setPhrases(prev => [{ ...d.phrase, _count: { recordings: 0 } }, ...prev])
      setNewPhraseText("")
      setPhraseSuccess("Phrase ajoutée avec succès !")
      setTimeout(() => setPhraseSuccess(""), 3000)
    }
    setAddingPhrase(false)
  }

  const handleDeletePhrase = async (phraseId: string, text: string) => {
    if (!confirm(`Supprimer la phrase "${text.substring(0, 50)}..." ?`)) return
    const res = await fetch(`/api/admin/phrases?phraseId=${phraseId}`, { method: "DELETE" })
    if (res.ok) {
      setPhrases(prev => prev.filter(p => p.id !== phraseId))
    }
  }

  if (loading) return <div className="animate-pulse p-8">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Corpus de phrases</h1>
        <p className="text-muted-foreground mt-1">Gérez les phrases que les contributeurs devront lire</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter une phrase
          </CardTitle>
          <CardDescription>Alimentez le corpus avec de nouvelles phrases par domaine</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPhrase} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Entrez la phrase à enregistrer..."
              value={newPhraseText}
              onChange={e => setNewPhraseText(e.target.value)}
              className="flex-1"
              required
            />
            <select
              value={newPhraseDomain}
              onChange={e => setNewPhraseDomain(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="sante">Santé</option>
              <option value="administration">Administration</option>
              <option value="agriculture">Agriculture</option>
              <option value="finance">Finance</option>
            </select>
            <Button type="submit" disabled={addingPhrase} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              {addingPhrase ? "Ajout..." : "Ajouter"}
            </Button>
          </form>
          {phraseSuccess && <p className="text-sm text-green-600 mt-2">✓ {phraseSuccess}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toutes les phrases ({phrases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {phrases.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Aucune phrase dans le corpus.</div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {phrases.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-4 hover:bg-secondary/40 transition-colors">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded mt-0.5 shrink-0 ${DOMAIN_COLORS[p.domain].replace("bg-", "bg-").replace("-400", "-100")} text-slate-700`}>
                    {DOMAIN_LABELS[p.domain]}
                  </span>
                  <p className="flex-1 text-sm">{p.text}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{p._count.recordings} enreg.</span>
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                      onClick={() => handleDeletePhrase(p.id, p.text)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
