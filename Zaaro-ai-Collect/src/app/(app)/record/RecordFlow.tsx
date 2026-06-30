"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import AudioRecorder from "@/components/ui/audio-recorder"
import { HeartPulse, Building2, Wheat, Wallet, CheckCircle2 } from "lucide-react"

type Step = "SELECT" | "RECORD" | "SUCCESS"
type Domain = "sante" | "administration" | "agriculture" | "finance"

const DOMAINS = [
  { id: "sante", label: "Santé", icon: HeartPulse, color: "text-red-500" },
  { id: "administration", label: "Administration", icon: Building2, color: "text-blue-500" },
  { id: "agriculture", label: "Agriculture", icon: Wheat, color: "text-green-500" },
  { id: "finance", label: "Finance", icon: Wallet, color: "text-yellow-500" },
]

export default function RecordFlow({ userLanguage }: { userLanguage: string }) {
  const [step, setStep] = useState<Step>("SELECT")
  const [domain, setDomain] = useState<Domain | null>(null)
  const [language, setLanguage] = useState<string>(userLanguage || "Mooré")
  const [phrase, setPhrase] = useState<{ id: string; text: string } | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [recording1, setRecording1] = useState<{ blob: Blob; duration: number } | null>(null)
  const [recording2, setRecording2] = useState<{ blob: Blob; duration: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPhrase = async (selectedDomain: string, selectedLanguage: string) => {
    setIsLoadingPhrase(true)
    setError(null)
    setPhrase(null)
    try {
      const res = await fetch(`/api/phrases?domain=${selectedDomain}&language=${encodeURIComponent(selectedLanguage)}`)
      const data = await res.json()
      if (data.done) {
        setError("Bravo ! Vous avez enregistré toutes les phrases disponibles pour ce domaine.")
      } else if (data.phrase) {
        setPhrase(data.phrase)
      } else {
        setError("Impossible de charger une phrase. Réessayez.")
      }
    } catch {
      setError("Erreur de connexion au serveur.")
    } finally {
      setIsLoadingPhrase(false)
    }
  }

  const handleStartRecording = async () => {
    if (!domain || !language) return
    setRecording1(null)
    setRecording2(null)
    await fetchPhrase(domain, language)
    setStep("RECORD")
  }

  const handleSubmitContribution = async () => {
    if (!recording1 || !recording2 || !phrase) return
    setIsSubmitting(true)
    setError(null)
    try {
      const totalDurationSeconds = Math.round((recording1.duration || 0) + (recording2.duration || 0))
      const formData = new FormData()
      formData.append("audio1", recording1.blob, "audio1.webm")
      formData.append("audio2", recording2.blob, "audio2.webm")
      formData.append("phraseId", phrase.id)
      formData.append("language", language)
      formData.append("duration", totalDurationSeconds.toString())

      const res = await fetch("/api/recordings", { method: "POST", body: formData })
      if (res.ok) {
        setStep("SUCCESS")
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de l'envoi.")
      }
    } catch {
      setError("Erreur de connexion au serveur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextPhrase = async () => {
    setRecording1(null)
    setRecording2(null)
    setStep("RECORD")
    if (domain) await fetchPhrase(domain, language)
  }

  // SUCCESS SCREEN
  if (step === "SUCCESS") {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Contribution enregistrée !</h2>
          <p className="text-muted-foreground mt-2">Merci pour votre contribution à la préservation des langues locales.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleNextPhrase} size="lg">Phrase suivante</Button>
          <Button variant="outline" size="lg" onClick={() => setStep("SELECT")}>Changer de domaine</Button>
        </div>
      </div>
    )
  }

  // SELECT SCREEN
  if (step === "SELECT") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Nouvelle contribution</h1>
          <p className="text-muted-foreground">Choisissez un domaine et une langue pour commencer</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choisir un domaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DOMAINS.map((d) => {
                const Icon = d.icon
                return (
                  <button
                    key={d.id}
                    onClick={() => setDomain(d.id as Domain)}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                      domain === d.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-secondary hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-2 ${d.color}`} />
                    <span className="font-medium">{d.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choisir une langue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Mooré", "Dioula", "Gourounsi", "Fulfulde"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`py-3 px-4 rounded-lg border text-center font-medium transition-all ${
                    language === l
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-secondary"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progression dans ce domaine</span>
              <span className="text-sm text-muted-foreground">0 / 1000 phrases</span>
            </div>
            <Progress value={0} />
            <Button
              className="w-full mt-6"
              size="lg"
              disabled={!domain || !language}
              onClick={handleStartRecording}
            >
              Continuer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // RECORD SCREEN
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Domaine :</span>
          <span className="capitalize">{domain}</span>
          <span>•</span>
          <span className="font-medium text-foreground">Langue :</span>
          <span>{language}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setStep("SELECT")}>Quitter</Button>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-2">
          <CardDescription>Lisez la phrase suivante à haute voix</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {isLoadingPhrase ? (
            <div className="py-10 text-muted-foreground animate-pulse">Chargement de la phrase...</div>
          ) : error && !phrase ? (
            <div className="py-6 text-destructive text-sm">{error}</div>
          ) : (
            <h2 className="text-2xl md:text-3xl font-bold py-6 px-4">{phrase?.text}</h2>
          )}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleNextPhrase} disabled={isLoadingPhrase}>
              Passer cette phrase
            </Button>
          </div>
        </CardContent>
      </Card>

      {phrase && (
        <div className="space-y-4">
          <AudioRecorder
            label="1"
            onRecordingComplete={(blob, duration) => setRecording1({ blob, duration })}
          />
          <AudioRecorder
            label="2"
            onRecordingComplete={(blob, duration) => setRecording2({ blob, duration })}
          />

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button
            className="w-full mt-4"
            size="lg"
            disabled={!recording1 || !recording2 || isSubmitting}
            onClick={handleSubmitContribution}
          >
            {isSubmitting ? "Envoi en cours..." : "Soumettre la contribution"}
          </Button>
        </div>
      )}
    </div>
  )
}
