import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { storySteps, contentType } = await request.json()

    if (!storySteps || !Array.isArray(storySteps)) {
      return NextResponse.json({ error: "Story steps are required" }, { status: 400 })
    }

    const apiKey = process.env.IMAGEN_API_KEY

    if (!apiKey) {
      console.error("[v0] IMAGEN_API_KEY not found in environment variables")
      return NextResponse.json({ error: "Imagen API key not configured" }, { status: 500 })
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || "your-project-id"
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1"

    const styleGuide =
      contentType === "ad"
        ? `VISUAL STYLE: Photorealistic 3D CGI Advertisement with Real-Life Characters
- Photorealistic character faces with accurate facial features and expressions
- If real people are mentioned (like "Elon Musk"), render them recognizably with their actual facial features
- High-end 3D CGI rendering quality (Pixar/Disney/Marvel Studios level)
- CHARACTERS MUST FILL THE FRAME - close-ups and medium shots showing faces clearly
- Realistic skin textures, hair, and facial details
- Modern sleek costumes or clothing with realistic materials
- Dramatic cinematic lighting that highlights character faces
- Vibrant commercial color grading with rich saturation
- Professional advertisement quality with polished, glossy look
- Dynamic camera angles focusing on character expressions and poses
- NO cartoon/anime style - this is realistic 3D animation with recognizable human features`
        : `VISUAL STYLE: Photorealistic Cinematic 3D Animation with Recognizable Characters
- PHOTOREALISTIC HUMAN FACES - if real people are mentioned, render them accurately
- High-quality 3D CGI character rendering (like Marvel/DC superhero movies)
- Realistic facial features, expressions, and skin textures
- Characters should look like real humans in animated form (not stylized cartoons)
- PROMINENT CHARACTER PLACEMENT - characters are the focal point of every scene
- Close-up shots showing detailed facial expressions and emotions
- Realistic costumes with fabric textures, armor details, and material properties
- Epic cinematic lighting with dramatic shadows and highlights on characters
- Moody color palette (blues, purples, dark atmospheres) with characters well-lit
- Film-quality 3D rendering with depth of field keeping characters in sharp focus
- Professional animation storyboard aesthetic showing characters in heroic/dramatic poses
- Superhero movie quality - think Dark Knight, Avengers, or Spider-Verse style realism
- Characters should be INSTANTLY RECOGNIZABLE if based on real people`

    const combinedPrompt = `Create a SINGLE animated storyboard page containing ${storySteps.length} distinct panels in a grid layout. This is a PHOTOREALISTIC 3D CGI animation storyboard where CHARACTERS ARE THE MAIN FOCUS of every single panel.

${styleGuide}

ABSOLUTE CHARACTER REQUIREMENTS:
- PHOTOREALISTIC HUMAN CHARACTERS - if real people are named, render their actual facial features accurately
- EVERY panel MUST feature the named characters PROMINENTLY in the center or foreground
- Characters should be LARGE in frame - close-ups of faces or medium shots showing full upper body
- Show DETAILED FACIAL EXPRESSIONS - eyes, mouth, emotions should be clearly visible
- Characters must be rendered with REALISTIC 3D CGI quality (not cartoon/anime/hand-drawn style)
- Use cinematic camera angles that keep characters as the visual focus
- Lighting should illuminate character faces clearly - no silhouettes unless dramatically appropriate
- If "Elon Musk" or other real people are mentioned, their recognizable facial features MUST be visible
- Treat this like a superhero movie storyboard - heroes are ALWAYS prominently shown

Panel Layout (${storySteps.length} scenes - CHARACTER FACES MUST BE VISIBLE):
${storySteps
  .map(
    (step: any, idx: number) => `
Panel ${idx + 1}: ${step.title}
CHARACTER FOCUS: ${step.description}
PRIMARY CHARACTER(S): ${step.characterFocus || "Main characters"}
VISUAL REQUIREMENT: This panel MUST show the named character(s) with clearly visible faces, expressions, and poses. Photorealistic 3D CGI rendering of human features.
`,
  )
  .join("\n")}

Technical Layout Requirements:
- Single storyboard page with all ${storySteps.length} panels in a cinematic grid (2-3 per row)
- Clear panel separation with subtle borders or spacing
- ${contentType === "ad" ? "High-end commercial advertisement aesthetic" : "Epic superhero movie storyboard aesthetic"}
- NO text, NO speech bubbles, NO captions - pure visual character-driven storytelling
- Consistent PHOTOREALISTIC 3D CGI style across all panels
- Hollywood-quality character rendering with realistic human anatomy and features
- ${contentType === "ad" ? "Bright, vibrant, polished commercial lighting" : "Dramatic cinematic lighting with moody atmosphere"}
- Professional animation storyboard format with CHARACTERS as the primary visual element

RENDERING STYLE:
- Photorealistic 3D CGI animation (NOT hand-drawn, NOT cartoon, NOT anime)
- Realistic human facial features, skin textures, and expressions
- High-quality character models with detailed costumes and materials
- Cinematic lighting and composition focusing on character visibility
- If real people are mentioned by name, render their recognizable facial features accurately
- Marvel/DC superhero movie quality rendering with epic, dramatic character presentation

FINAL REMINDER: Every panel must show PHOTOREALISTIC 3D ANIMATED CHARACTERS with clearly visible faces and expressions. If real people like "Elon Musk" are mentioned, their recognizable features MUST appear in the rendering. This is a character-driven visual story in photorealistic 3D CGI animation style.`

    try {
      console.log(
        `[v0] Generating CHARACTER-FOCUSED storyboard with ${contentType} style (${storySteps.length} panels)`,
      )

      const response = await fetch(
        `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [
              {
                prompt: combinedPrompt,
              },
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: "3:4",
              safetyFilterLevel: "block_some",
              personGeneration: "allow_adult",
            },
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Imagen API error:", response.status, errorText)

        if (response.status === 429) {
          console.error("[v0] Imagen API quota exceeded")
          return NextResponse.json({
            image: `/placeholder.svg?height=1200&width=900&query=${encodeURIComponent(`${contentType === "ad" ? "Modern advertisement" : "Comic"} storyboard with ${storySteps.length} panels`)}`,
            quotaExceeded: true,
            message:
              "Quota limit reached. Please increase your Google Cloud quota or wait before generating more images.",
          })
        }

        throw new Error(`Imagen API error: ${response.status}`)
      }

      const data = await response.json()
      const imageData = data.predictions?.[0]?.bytesBase64Encoded

      if (!imageData) {
        throw new Error("No image data in Imagen response")
      }

      console.log(`[v0] Successfully generated ${contentType}-style storyboard`)

      return NextResponse.json({
        image: `data:image/png;base64,${imageData}`,
        quotaExceeded: false,
        message: `${contentType === "ad" ? "Advertisement" : "Comic"} storyboard generated successfully`,
      })
    } catch (error: any) {
      console.error(`[v0] Error generating storyboard:`, error.message)

      const isQuotaError = error.message.includes("429") || error.message.includes("quota")

      return NextResponse.json({
        image: `/placeholder.svg?height=1200&width=900&query=${encodeURIComponent(`${contentType === "ad" ? "Modern advertisement" : "Comic"} storyboard with ${storySteps.length} panels`)}`,
        quotaExceeded: isQuotaError,
        message: isQuotaError
          ? "Quota limit reached. Please increase your Google Cloud quota or wait before generating more images."
          : "Failed to generate storyboard. Using placeholder image.",
      })
    }
  } catch (error) {
    console.error("[v0] Error in generate-images:", error)
    return NextResponse.json(
      {
        error: "Failed to generate storyboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
