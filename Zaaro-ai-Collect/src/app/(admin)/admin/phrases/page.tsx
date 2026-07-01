"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

type Phrase = {
  id: string
  text: string
  domain: string
  createdAt: string
  recordingCount: number
  status: string
  _count: { recordings: number }
}

const DOMAIN_LABELS: Record<string, string> = {
  sante: "Santé",
  administration: "Administration",
  agriculture: "Agriculture",
  finance: "Finance",
}
const DOMAIN_BADGE: Record<string, string> = {
  sante: "bg-red-100 text-red-700",
  administration: "bg-blue-100 text-blue-700",
  agriculture: "bg-green-100 text-green-700",
  finance: "bg-yellow-100 text-yellow-700",
}

export default function AdminPhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)

  // Manual add
  const [newPhraseText, setNewPhraseText] = useState("")
  const [newPhraseDomain, setNewPhraseDomain] = useState("sante")
  const [addingPhrase, setAddingPhrase] = useState(false)
  const [phraseSuccess, setPhraseSuccess] = useState("")

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success?: boolean
    inserted?: number
    duplicates?: number
    errors?: string[]
    message?: string
    error?: string
  } | null>(null)

  // Filter
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "DONE">("ALL")
  const [filterDomain, setFilterDomain] = useState("ALL")

  useEffect(() => {
    fetch("/api/admin/phrases")
      .then((r) => r.json())
      .then((d) => {
        setPhrases(d.phrases ?? [])
        setLoading(false)
      })
  }, [])

  // ── Manual add ────────────────────────────────────────────────────────────
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
      setPhrases((prev) => [
        { ...d.phrase, recordingCount: 0, status: "PENDING", _count: { recordings: 0 } },
        ...prev,
      ])
      setNewPhraseText("")
      setPhraseSuccess("Texte ajouté avec succès !")
      setTimeout(() => setPhraseSuccess(""), 3000)
    }
    setAddingPhrase(false)
  }

  // ── CSV import ────────────────────────────────────────────────────────────
  const handleImportCSV = async () => {
    if (!csvFile) return
    setImporting(true)
    setImportResult(null)
    const form = new FormData()
    form.append("file", csvFile)
    try {
      const res = await fetch("/api/admin/phrases/import", { method: "POST", body: form })
      const data = await res.json()
      setImportResult(data)
      if (data.success && data.inserted > 0) {
        // Refresh list
        const r2 = await fetch("/api/admin/phrases")
        const d2 = await r2.json()
        setPhrases(d2.phrases ?? [])
      }
    } catch {
      setImportResult({ error: "Erreur lors de l'importation." })
    } finally {
      setImporting(false)
      setCsvFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeletePhrase = async (phraseId: string, text: string) => {
    if (!confirm(`Supprimer "${text.substring(0, 60)}" ?`)) return
    const res = await fetch(`/api/admin/phrases?phraseId=${phraseId}`, { method: "DELETE" })
    if (res.ok) {
      setPhrases((prev) => prev.filter((p) => p.id !== phraseId))
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = phrases.filter((p) => {
    const domainOk = filterDomain === "ALL" || p.domain === filterDomain
    const statusOk = filterStatus === "ALL" || p.status === filterStatus
    return domainOk && statusOk
  })

  const doneCount = phrases.filter((p) => p.status === "DONE").length
  const pendingCount = phrases.filter((p) => p.status === "PENDING").length

  if (loading)
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Chargement...
      </div>
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Corpus de textes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les mots, expressions et phrases que les contributeurs devront lire
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium">
            {pendingCount} en attente
          </span>
          <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
            {doneCount} complétés
          </span>
        </div>
      </div>

      {/* ── Manual add ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter manuellement
          </CardTitle>
          <CardDescription>
            Ajoutez un mot, une expression ou une phrase complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPhrase} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Mot, expression ou phrase à enregistrer..."
              value={newPhraseText}
              onChange={(e) => setNewPhraseText(e.target.value)}
              className="flex-1"
              required
            />
            <select
              value={newPhraseDomain}
              onChange={(e) => setNewPhraseDomain(e.target.value)}
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
          {phraseSuccess && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {phraseSuccess}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── CSV import ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> Importer un fichier CSV
          </CardTitle>
          <CardDescription>
            Format attendu : deux colonnes <code className="text-xs bg-secondary px-1 rounded">text,domain</code> (domaines valides : sante, administration, agriculture, finance). Les doublons sont ignorés automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3 border-2 border-dashed border-input rounded-md px-4 py-3 hover:border-primary/50 transition-colors">
                <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {csvFile ? csvFile.name : "Cliquez pour choisir un fichier CSV…"}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  setCsvFile(e.target.files?.[0] ?? null)
                  setImportResult(null)
                }}
              />
            </label>
            <Button
              onClick={handleImportCSV}
              disabled={!csvFile || importing}
              className="gap-2 shrink-0"
              variant="outline"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importation...</>
              ) : (
                <><Upload className="w-4 h-4" /> Importer</>
              )}
            </Button>
          </div>

          {importResult && (
            <div
              className={`rounded-md p-3 text-sm space-y-1 ${
                importResult.error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {importResult.error ? (
                <p className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {importResult.error}
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {importResult.message}
                  </p>
                  {(importResult.duplicates ?? 0) > 0 && (
                    <p className="text-xs opacity-80">
                      {importResult.duplicates} doublon(s) ignoré(s)
                    </p>
                  )}
                  {(importResult.errors?.length ?? 0) > 0 && (
                    <details className="text-xs opacity-80 mt-1">
                      <summary className="cursor-pointer">{importResult.errors!.length} ligne(s) ignorée(s) — voir détails</summary>
                      <ul className="mt-1 space-y-0.5 list-disc pl-4">
                        {importResult.errors!.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── List ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">
              Tous les textes ({filtered.length} / {phrases.length})
            </CardTitle>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 focus-visible:outline-none"
              >
                <option value="ALL">Tous les domaines</option>
                <option value="sante">Santé</option>
                <option value="administration">Administration</option>
                <option value="agriculture">Agriculture</option>
                <option value="finance">Finance</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "ALL" | "PENDING" | "DONE")}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 focus-visible:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="DONE">Complétés</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun texte correspondant aux filtres sélectionnés.
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-4 hover:bg-secondary/40 transition-colors"
                >
                  {/* Domain badge */}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded mt-0.5 shrink-0 ${
                      DOMAIN_BADGE[p.domain] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {DOMAIN_LABELS[p.domain] ?? p.domain}
                  </span>

                  {/* Text */}
                  <p className="flex-1 text-sm">{p.text}</p>

                  {/* Count + status + delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Recording count progress */}
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.recordingCount}/10
                    </span>

                    {/* Status pill */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === "DONE"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {p.status === "DONE" ? "Complété" : "En attente"}
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                      onClick={() => handleDeletePhrase(p.id, p.text)}
                      title="Supprimer"
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
