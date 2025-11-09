import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        audioUrl: null,
        duration: 30,
        useBrowserTTS: true,
        message: "Using browser text-to-speech for narration.",
      })
    }

    const defaultVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM"

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          audioUrl: null,
          duration: 30,
          useBrowserTTS: true,
          message: "Using browser text-to-speech for narration.",
        })
      }

      // Only log non-auth errors
      const errorText = await response.text()
      console.error("[v0] ElevenLabs API error:", response.status, errorText)

      return NextResponse.json({
        audioUrl: null,
        duration: 30,
        useBrowserTTS: true,
        message: "Using browser text-to-speech for narration.",
      })
    }

    const audioBlob = await response.blob()
    const audioBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString("base64")

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      duration: 30,
      useBrowserTTS: false,
      message: "Audio narration generated successfully",
    })
  } catch (error) {
    return NextResponse.json({
      audioUrl: null,
      duration: 30,
      useBrowserTTS: true,
      message: "Using browser text-to-speech for narration.",
    })
  }
}
