"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, RotateCcw } from "lucide-react"

interface AudioRecorderProps {
  label: string
  onRecordingComplete: (blob: Blob, duration: number) => void
}

export default function AudioRecorder({ label, onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [displayDuration, setDisplayDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveform, setWaveform] = useState<number[]>(() => Array(36).fill(18))
  const [isPulsing, setIsPulsing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const durationRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
  }

  const startVisualization = (stream: MediaStream) => {
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return

    const context = new AudioContextConstructor()
    const analyser = context.createAnalyser()
    analyser.fftSize = 256

    const source = context.createMediaStreamSource(stream)
    source.connect(analyser)

    audioContextRef.current = context
    analyserRef.current = analyser
    sourceRef.current = source

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const animate = () => {
      analyser.getByteFrequencyData(dataArray)

      const nextBars = Array.from({ length: 36 }, (_, index) => {
        const start = Math.floor((index / 36) * dataArray.length)
        const end = Math.floor(((index + 1) / 36) * dataArray.length)
        let sum = 0
        for (let i = start; i < end; i += 1) {
          sum += dataArray[i]
        }
        const average = sum / Math.max(1, end - start)
        return Math.max(12, Math.min(100, Math.round(average / 2.55 + 8)))
      })

      setWaveform(nextBars)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      durationRef.current = 0
      setDisplayDuration(0)
      setWaveform(Array(36).fill(18))

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        onRecordingComplete(audioBlob, durationRef.current)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPulsing(true)
      startVisualization(stream)

      timerRef.current = setInterval(() => {
        durationRef.current += 1
        setDisplayDuration(durationRef.current)
      }, 1000)
    } catch (err) {
      console.error("Erreur d'accès au microphone", err)
      alert("Impossible d'accéder au microphone. Veuillez vérifier vos permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      stopVisualization()
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      setIsPulsing(false)
    }
  }

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDisplayDuration(0)
    setWaveform(Array(36).fill(18))
    durationRef.current = 0
    setIsPlaying(false)
    setIsPulsing(false)
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      stopVisualization()
    }
  }, [])

  return (
    <div className="rounded-[28px] border border-border/60 bg-gradient-to-br from-white to-slate-50/90 p-5 shadow-sm">
      <div className="flex flex-col items-center gap-4">
        {!isRecording && !audioUrl ? (
          <>
            <button
              onClick={startRecording}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 transition-all duration-200 hover:scale-105"
            >
              <Mic className="h-8 w-8" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-foreground">Appuyez pour enregistrer</p>
              <p className="text-sm text-muted-foreground">Votre voix sera capturée en mode vocal simple et fluide.</p>
            </div>
          </>
        ) : isRecording ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span className={`h-3 w-3 rounded-full bg-red-500 ${isPulsing ? "animate-pulse" : ""}`} />
              <span>Enregistrement en cours</span>
              <span className="text-foreground">• {formatTime(displayDuration)}</span>
            </div>

            <div className="flex h-14 w-full max-w-md items-end justify-center gap-[4px] rounded-full border border-emerald-100 bg-white/80 px-3 py-2 shadow-sm">
              {waveform.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-[5px] rounded-full bg-gradient-to-t from-green-400 via-emerald-300 to-emerald-100"
                  style={{ height: `${Math.max(12, height / 1.5)}%`, minHeight: "8px" }}
                />
              ))}
            </div>

            <button
              onClick={stopRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-105"
              aria-label="Arrêter l'enregistrement"
            >
              <Square className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex h-14 w-full max-w-md items-end justify-center gap-[4px] rounded-full border border-emerald-100 bg-white/80 px-3 py-2 shadow-sm">
              {waveform.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-[5px] rounded-full bg-gradient-to-t from-green-400 via-emerald-300 to-emerald-100"
                  style={{ height: `${Math.max(12, height / 1.5)}%`, minHeight: "8px" }}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="font-semibold text-foreground">Enregistrement terminé</p>
              <p className="text-sm text-muted-foreground">Durée : {formatTime(displayDuration)}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={togglePlayback} variant="outline" className="sm:min-w-[140px]">
                {isPlaying ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isPlaying ? "Pause" : "Écouter"}
              </Button>
              <Button onClick={resetRecording} variant="ghost" className="sm:min-w-[140px]">
                <RotateCcw className="mr-2 h-4 w-4" />
                Recommencer
              </Button>
            </div>
          </div>
        )}

        <div className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  )
}
