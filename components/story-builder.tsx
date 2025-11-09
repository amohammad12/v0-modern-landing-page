"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  Wand2,
  ImageIcon,
  Video,
  Loader2,
  Save,
  Film,
  Edit2,
  RefreshCw,
  ArrowLeft,
  Play,
  Download,
  Mic,
  Volume2,
} from "lucide-react"
import Image from "next/image"

type Step = "input" | "outline" | "storyboard" | "videoComposer" | "complete"

interface StoryStep {
  number: number
  title: string
  description: string
}

interface StoryboardImage {
  url: string
  stepIndex: number
}

interface StoryBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Voice options for ElevenLabs
const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm Female Narrator" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Deep Male Narrator" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Energetic Female" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Warm Male" },
]

export function StoryBuilder({ open, onOpenChange }: StoryBuilderProps) {
  const [step, setStep] = useState<Step>("input")
  const [idea, setIdea] = useState("")
  const [storySteps, setStorySteps] = useState<StoryStep[]>([])
  const [contentType, setContentType] = useState<"ad" | "story">("story")
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [storyboardImage, setStoryboardImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)

  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [useCinematicMode, setUseCinematicMode] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [useBrowserTTS, setUseBrowserTTS] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev
          return prev + 5
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [loading])

  const handleGenerateOutline = async () => {
    setLoading(true)
    setLoadingMessage("Gemini is creating your story outline...")

    try {
      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: idea }),
      })

      if (!response.ok) throw new Error("Failed to generate outline")

      const data = await response.json()

      setStorySteps(data.steps)
      setContentType(data.contentType || "story")
      setLoading(false)
      setStep("outline")
    } catch (error) {
      console.error("[v0] Error generating outline:", error)

      await new Promise((resolve) => setTimeout(resolve, 3500))

      const simulatedSteps: StoryStep[] = [
        {
          number: 1,
          title: "The Awakening",
          description: `${idea}\n\nOur story begins in an unexpected place. The protagonist discovers something that will change everything—a spark of curiosity that cannot be ignored.`,
        },
        {
          number: 2,
          title: "The Journey Begins",
          description:
            "With newfound purpose, the adventure truly starts. Challenges emerge, but so does determination. Every step forward reveals new wonders and obstacles.",
        },
        {
          number: 3,
          title: "The Great Challenge",
          description:
            "The most difficult moment arrives. Doubt creeps in, but resilience prevails. This is where true character is forged in the fires of adversity.",
        },
        {
          number: 4,
          title: "The Revelation",
          description:
            "Everything becomes clear. The pieces of the puzzle fall into place, revealing a truth that was hidden all along. Understanding dawns like a sunrise.",
        },
        {
          number: 5,
          title: "The Triumph",
          description:
            "The journey reaches its climax. All struggles, lessons, and growth culminate in a breathtaking finale. The story comes full circle, transformed and complete.",
        },
      ]

      setStorySteps(simulatedSteps)
      setLoading(false)
      setStep("outline")
    }
  }

  const handleRegenerateStep = async (stepIndex: number) => {
    setLoading(true)
    setLoadingMessage(`Regenerating Step ${stepIndex + 1}...`)

    try {
      const response = await fetch("/api/regenerate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: idea,
          stepNumber: stepIndex + 1,
          currentSteps: storySteps,
        }),
      })

      if (!response.ok) throw new Error("Failed to regenerate step")

      const data = await response.json()

      const updatedSteps = [...storySteps]
      updatedSteps[stepIndex] = data.step
      setStorySteps(updatedSteps)
      setEditingText(data.step.description)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error regenerating step:", error)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newDescriptions = [
        "A fresh perspective emerges, revealing hidden depths in the story. The narrative takes an unexpected turn that captivates and intrigues.",
        "The plot thickens with new developments. Characters face fresh challenges that test their resolve in surprising ways.",
        "An alternative path unfolds, rich with possibility. The story evolves in directions previously unimagined.",
        "New insights illuminate the journey. The narrative deepens, revealing layers of meaning and emotion.",
        "The story transforms, taking on new dimensions. What seemed certain becomes fluid, dynamic, alive.",
      ]

      const updatedSteps = [...storySteps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        description: newDescriptions[stepIndex % newDescriptions.length],
      }
      setStorySteps(updatedSteps)
      setEditingText(updatedSteps[stepIndex].description)
      setLoading(false)
    }
  }

  const handleSaveChanges = () => {
    if (selectedStepIndex !== null) {
      const updatedSteps = [...storySteps]
      updatedSteps[selectedStepIndex].description = editingText
      setStorySteps(updatedSteps)
    }
  }

  const handleSelectStep = (index: number) => {
    setSelectedStepIndex(index)
    setEditingText(storySteps[index].description)
  }

  const handleGenerateStoryboard = async () => {
    setLoading(true)
    setLoadingMessage(
      `Generating ${contentType === "ad" ? "modern advertisement" : "comic-style"} storyboard with Imagen...`,
    )
    setQuotaWarning(null)

    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storySteps, contentType }),
      })

      if (!response.ok) throw new Error("Failed to generate storyboard")

      const data = await response.json()

      setStoryboardImage(data.image)

      if (data.quotaExceeded) {
        setQuotaWarning(
          "⚠️ Google Cloud quota limit reached. The image shown is a placeholder. To generate the actual storyboard:\n1. Visit Google Cloud Console\n2. Request a quota increase for Imagen API\n3. Wait a few minutes and try again",
        )
      }

      setLoading(false)
      setStep("storyboard")
    } catch (error) {
      console.error("[v0] Error generating storyboard:", error)

      await new Promise((resolve) => setTimeout(resolve, 3000))

      setStoryboardImage(
        `/placeholder.svg?height=1200&width=900&query=${encodeURIComponent(`${contentType === "ad" ? "Modern advertisement" : "Comic"} storyboard with ${storySteps.length} panels`)}`,
      )
      setLoading(false)
      setStep("storyboard")
    }
  }

  const handlePreviousStep = () => {
    if (step === "outline") {
      setStep("input")
    } else if (step === "storyboard") {
      setStep("outline")
    } else if (step === "videoComposer") {
      setStep("storyboard")
    }
  }

  const handleGenerateAudio = async () => {
    setLoading(true)
    setLoadingMessage("Generating AI narration...")
    setAudioError(null)

    try {
      const storyText = storySteps.map((step) => `${step.title}. ${step.description}`).join(" ")

      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: storyText, voiceId: selectedVoice }),
      })

      if (!response.ok) throw new Error("Failed to generate audio")

      const data = await response.json()

      if (data.useBrowserTTS) {
        setUseBrowserTTS(true)
        setAudioError(null)
        setAudioUrl(null)
      } else {
        setAudioUrl(data.audioUrl)
        setUseBrowserTTS(false)
      }

      setLoading(false)
    } catch (error) {
      console.error("[v0] Error generating audio:", error)
      setUseBrowserTTS(true)
      setAudioError(null)
      setAudioUrl(null)
      setLoading(false)
    }
  }

  const handleBrowserTTS = () => {
    if ("speechSynthesis" in window) {
      const storyText = storySteps.map((step) => `${step.title}. ${step.description}`).join(" ")
      const utterance = new SpeechSynthesisUtterance(storyText)

      // Configure voice if available
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) => voice.lang.startsWith("en") && (voice.name.includes("Google") || voice.name.includes("Microsoft")),
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0

      if (isPlayingAudio) {
        window.speechSynthesis.cancel()
        setIsPlayingAudio(false)
      } else {
        window.speechSynthesis.speak(utterance)
        setIsPlayingAudio(true)

        utterance.onend = () => {
          setIsPlayingAudio(false)
        }
      }
    } else {
      alert("Text-to-speech is not supported in your browser.")
    }
  }

  const handlePlayAudio = () => {
    if (useBrowserTTS) {
      handleBrowserTTS()
    } else if (audioRef.current && audioUrl) {
      if (isPlayingAudio) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((err) => {
          console.error("[v0] Audio play error:", err)
          setAudioError("Failed to play audio. The audio file may be invalid.")
        })
      }
      setIsPlayingAudio(!isPlayingAudio)
    }
  }

  const handleDownloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement("a")
      link.href = videoUrl
      link.download = "storyspark-video.mp4"
      link.click()
    }
  }

  const handleRegeneratePanel = async () => {
    setLoading(true)
    setLoadingMessage(`Regenerating ${contentType === "ad" ? "advertisement" : "comic"} storyboard...`)

    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storySteps, contentType }),
      })

      if (!response.ok) throw new Error("Failed to regenerate panel")

      const data = await response.json()

      setStoryboardImage(data.image)

      if (data.quotaExceeded) {
        setQuotaWarning(
          "⚠️ Quota limit reached. Please wait a few minutes before trying again, or request a quota increase in Google Cloud Console.",
        )
      } else if (!data.image.includes("placeholder")) {
        setQuotaWarning(null)
      }

      setLoading(false)
    } catch (error) {
      console.error("[v0] Error regenerating panel:", error)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      setStoryboardImage(
        `/placeholder.svg?height=1200&width=900&query=${encodeURIComponent(`${contentType === "ad" ? "Modern advertisement" : "Comic"} storyboard with ${storySteps.length} panels`)}`,
      )
      setLoading(false)
    }
  }

  const handleSave = () => {
    setStep("complete")
  }

  const handleStartOver = () => {
    setStep("input")
    setIdea("")
    setStorySteps([])
    setSelectedStepIndex(null)
    setEditingText("")
    setStoryboardImage(null)
    setAudioUrl(null)
    setVideoUrl(null)
    setUseBrowserTTS(false)
    setAudioError(null)
  }

  const handleComposeVideo = async () => {
    setLoading(true)
    setLoadingMessage(useCinematicMode ? "Creating cinematic video with Veo 3..." : "Composing slideshow video...")

    try {
      const response = await fetch("/api/compose-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardImage,
          audioUrl,
          storySteps,
          useCinematicMode,
        }),
      })

      if (!response.ok) throw new Error("Failed to compose video")

      const data = await response.json()
      setVideoUrl(data.videoUrl)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error composing video:", error)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] h-[95vh] max-w-[95vw] w-[95vw] overflow-y-auto border-white/20 bg-gradient-to-br from-[#5B4B8A]/95 via-[#7B5B8A]/95 to-[#8B6B9A]/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
            <Sparkles className="h-8 w-8 text-red-400 animate-pulse" />
            Story Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 px-2">
          {/* Step 1: Idea Input */}
          {step === "input" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Sparkles className="h-6 w-6 text-red-400" />
                  Enter Your Story Idea
                </h3>
                <p className="mb-4 text-white/80 text-lg">
                  Describe your story concept and let Gemini expand it into a complete narrative outline.
                </p>
                <Textarea
                  placeholder="Enter your story idea (e.g., 'A robot who learns to paint in space')"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[150px] text-lg resize-none border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-red-400"
                />
              </div>
              <Button
                onClick={handleGenerateOutline}
                disabled={!idea.trim() || loading}
                className="w-full bg-red-400 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300"
              >
                {loading ? (
                  <div className="flex w-full flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="animate-pulse">{loadingMessage}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Story Outline
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Story Outline with Horizontal Cards */}
          {step === "outline" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Button
                onClick={handlePreviousStep}
                variant="outline"
                className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Step
              </Button>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Wand2 className="h-6 w-6 text-red-400 animate-pulse" />
                  Your Story Outline
                  <span
                    className={`ml-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      contentType === "ad"
                        ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white"
                        : "bg-gradient-to-r from-red-400 to-orange-400 text-white"
                    }`}
                  >
                    {contentType === "ad" ? "Advertisement Style" : "Story Style"}
                  </span>
                </h3>
                <div className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-300">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Generated by Gemini 2.5 Flash
                </div>

                <div className="mb-6 -mx-6 px-6 overflow-x-auto">
                  <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                    {storySteps.map((storyStep, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectStep(index)}
                        className={`group relative flex w-80 shrink-0 cursor-pointer flex-col rounded-xl border p-6 backdrop-blur-sm transition-all duration-300 ${
                          selectedStepIndex === index
                            ? "border-red-400 bg-red-400/20 shadow-[0_0_25px_rgba(239,68,68,0.6)]"
                            : "border-white/20 bg-white/10 hover:border-red-400/50 hover:bg-white/15 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        }`}
                        style={{
                          animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards`,
                        }}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-lg font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                            {storyStep.number}
                          </div>
                          {selectedStepIndex === index && <Edit2 className="h-5 w-5 text-red-400 animate-pulse" />}
                        </div>
                        <h4 className="mb-2 text-xl font-bold text-white">{storyStep.title}</h4>
                        <p className="line-clamp-3 text-sm leading-relaxed text-white/80">{storyStep.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedStepIndex !== null && (
                  <div className="space-y-4 rounded-xl border border-red-400/50 bg-red-400/10 p-6 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-lg font-bold">
                        <Edit2 className="h-5 w-5 text-red-400" />
                        Editing Step {selectedStepIndex + 1}: {storySteps[selectedStepIndex].title}
                      </h4>
                    </div>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-h-[150px] resize-none border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-red-400"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="flex-1 bg-red-400 text-white hover:bg-red-500 transition-all duration-300"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => handleRegenerateStep(selectedStepIndex)}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-red-400/50 transition-all duration-300"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Regenerate Step
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerateStoryboard}
                disabled={loading}
                className="w-full bg-red-400 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300"
              >
                {loading ? (
                  <div className="flex w-full flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="animate-pulse">{loadingMessage}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5" />
                    Continue to Image Generation
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Single Animated Storyboard */}
          {step === "storyboard" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Button
                onClick={handlePreviousStep}
                variant="outline"
                className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Step
              </Button>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-3xl font-bold">
                  <ImageIcon className="h-7 w-7 text-red-400 animate-pulse" />
                  Your Animated Cinematic Storyboard
                </h3>
                <div className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-red-300">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  Generated by Imagen 3
                </div>

                {quotaWarning && (
                  <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 animate-in fade-in duration-300">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-xl text-yellow-400">⚠️</div>
                      <div className="flex-1 space-y-2">
                        <p className="text-lg font-semibold text-yellow-200">Quota Limit Reached</p>
                        <p className="text-base leading-relaxed text-yellow-200/90 whitespace-pre-line">
                          {quotaWarning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6 rounded-xl border border-white/20 bg-black/20 p-4 shadow-2xl">
                  <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
                    <Image
                      src={storyboardImage || "/placeholder.svg"}
                      alt="Animated cinematic storyboard"
                      fill
                      className="rounded-lg object-contain"
                    />
                  </div>

                  <div className="mt-4 border-t border-white/20 pt-4 text-center">
                    <p className="text-xl font-bold uppercase tracking-wider text-white/90">
                      Complete Animated Storyboard — {storySteps.length} Cinematic Scenes
                    </p>
                  </div>
                </div>

                {/* Story steps reference */}
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-white">Story Scenes:</h4>
                  {storySteps.map((storyStep, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedStepIndex(index)
                        setEditingText(storyStep.description)
                      }}
                      className={`cursor-pointer rounded-lg border p-5 transition-all duration-300 ${
                        selectedStepIndex === index
                          ? "border-red-400 bg-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                          : "border-white/20 bg-white/10 hover:border-red-400/50 hover:bg-white/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-base font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="mb-2 text-lg font-bold text-white">{storyStep.title}</h5>
                          <p className="text-base leading-relaxed text-white/70">{storyStep.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedStepIndex !== null && (
                  <div className="mt-4 space-y-4 rounded-xl border border-red-400/50 bg-red-400/10 p-6 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-xl font-bold">
                        <Edit2 className="h-6 w-6 text-red-400" />
                        Editing Scene {selectedStepIndex + 1}
                      </h4>
                    </div>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-h-[120px] text-base resize-none border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-red-400"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          const updatedSteps = [...storySteps]
                          updatedSteps[selectedStepIndex].description = editingText
                          setStorySteps(updatedSteps)
                          setSelectedStepIndex(null)
                        }}
                        className="flex-1 bg-red-400 text-white hover:bg-red-500 transition-all duration-300"
                      >
                        <Save className="mr-2 h-5 w-5" />
                        Save & Regenerate Storyboard
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  setStep("videoComposer")
                }}
                disabled={loading}
                className="w-full bg-red-400 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300"
              >
                <Film className="mr-2 h-5 w-5" />
                Continue to AI Video Composer
              </Button>
            </div>
          )}

          {/* Step 4: AI Video Composer */}
          {step === "videoComposer" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Button
                onClick={handlePreviousStep}
                variant="outline"
                className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Step
              </Button>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-3xl font-bold">
                  <Film className="h-7 w-7 text-red-400 animate-pulse" />
                  Step 4: AI Video Composer
                </h3>
                <p className="mb-6 text-lg text-white/80">
                  Transform your storyboard into a complete video with AI-generated narration
                </p>

                {/* Voice Selection */}
                <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-6">
                  <h4 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <Mic className="h-5 w-5 text-red-400" />
                    Select Narrator Voice
                  </h4>

                  {useBrowserTTS && (
                    <div className="mb-4 rounded-lg border border-blue-400/50 bg-blue-400/10 p-4">
                      <p className="text-sm text-blue-200">
                        Using your browser's built-in text-to-speech for narration.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {VOICE_OPTIONS.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`rounded-lg border p-4 text-left transition-all duration-300 ${
                          selectedVoice === voice.id
                            ? "border-red-400 bg-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            : "border-white/20 bg-white/5 hover:border-red-400/50 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Volume2 className="h-4 w-4 text-red-400" />
                          <span className="font-bold text-white">{voice.name}</span>
                        </div>
                        <p className="text-sm text-white/70">{voice.description}</p>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleGenerateAudio}
                    disabled={loading || (!!audioUrl && !useBrowserTTS)}
                    className="mt-4 w-full bg-red-400 text-white hover:bg-red-500 transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating AI Narration...
                      </>
                    ) : audioUrl && !useBrowserTTS ? (
                      <>
                        <Volume2 className="mr-2 h-5 w-5" />
                        Narration Generated
                      </>
                    ) : useBrowserTTS ? (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        Using Browser Text-to-Speech
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        Generate AI Narration
                      </>
                    )}
                  </Button>
                </div>

                {/* Audio Preview */}
                {(audioUrl || useBrowserTTS) && (
                  <div className="mb-6 rounded-xl border border-green-400/50 bg-green-400/10 p-6 animate-in fade-in duration-300">
                    <h4 className="mb-4 flex items-center gap-2 text-xl font-bold">
                      <Volume2 className="h-5 w-5 text-green-400" />
                      Audio Preview {useBrowserTTS && "(Browser TTS)"}
                    </h4>
                    {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
                    <div className="flex gap-3">
                      <Button
                        onClick={handlePlayAudio}
                        className="flex-1 bg-green-400 text-white hover:bg-green-500 transition-all duration-300"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        {isPlayingAudio ? "Stop Audio" : "Play Audio"}
                      </Button>
                      {!useBrowserTTS && (
                        <Button
                          onClick={handleGenerateAudio}
                          disabled={loading}
                          variant="outline"
                          className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                        >
                          <RefreshCw className="mr-2 h-5 w-5" />
                          Regenerate Audio
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Cinematic Mode Toggle */}
                <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-xl font-bold">
                        <Sparkles className="h-5 w-5 text-red-400" />
                        AI Cinematic Mode
                      </h4>
                      <p className="text-sm text-white/70 mt-1">
                        {useCinematicMode ? "Use Veo 3 to create an animated video" : "Create a slideshow-style video"}
                      </p>
                    </div>
                    <button
                      onClick={() => setUseCinematicMode(!useCinematicMode)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        useCinematicMode ? "bg-red-400" : "bg-white/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          useCinematicMode ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Video Composition */}
                {!videoUrl && (audioUrl || useBrowserTTS) && (
                  <Button
                    onClick={handleComposeVideo}
                    disabled={loading}
                    className="w-full bg-red-400 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300"
                  >
                    {loading ? (
                      <div className="flex w-full flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="animate-pulse">{loadingMessage}</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Film className="mr-2 h-5 w-5" />
                        Compose Video {useBrowserTTS && "(without embedded audio)"}
                      </>
                    )}
                  </Button>
                )}

                {/* Video Preview */}
                {videoUrl && (
                  <div className="rounded-xl border border-white/20 bg-black/20 p-6 shadow-2xl animate-in fade-in duration-500">
                    <h4 className="mb-4 flex items-center gap-2 text-xl font-bold">
                      <Video className="h-5 w-5 text-red-400 animate-pulse" />
                      Your AI-Generated Video
                    </h4>

                    <div className="mb-6 overflow-hidden rounded-xl border border-white/20 bg-black">
                      <div className="relative aspect-video w-full">
                        {storyboardImage && (
                          <Image
                            src={storyboardImage || "/placeholder.svg"}
                            alt="Video thumbnail"
                            fill
                            className="object-cover opacity-80"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-400/90 transition-all duration-300 hover:scale-110 hover:bg-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.8)]">
                            <Play className="h-10 w-10 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownloadVideo}
                        className="flex-1 bg-red-400 text-white hover:bg-red-500 transition-all duration-300"
                      >
                        <Download className="mr-2 h-5 w-5" />
                        Download Video
                      </Button>
                      <Button
                        onClick={handleComposeVideo}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Regenerate Video
                      </Button>
                    </div>

                    <Button
                      onClick={handleSave}
                      className="mt-4 w-full bg-green-400 text-white hover:bg-green-500 transition-all duration-300"
                    >
                      <Save className="mr-2 h-5 w-5" />
                      Save Story & Video
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && (
            <div className="space-y-6 animate-in fade-in duration-500 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-400/20 animate-pulse">
                <Save className="h-10 w-10 text-red-400" />
              </div>
              <div>
                <h3 className="mb-2 text-2xl font-bold">Story Saved Successfully!</h3>
                <p className="text-white/80">Your story has been saved to MongoDB Atlas and is ready to share.</p>
              </div>
              <Button
                onClick={handleStartOver}
                className="bg-red-400 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-all duration-300"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Create Another Story
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            <span className="animate-pulse">✨</span> AI Powered by Gemini • Imagen • Veo • ElevenLabs{" "}
            <span className="animate-pulse">✨</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
