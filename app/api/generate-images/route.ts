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
        ? `Style: AI-cartoonized modern illustration with vibrant colors, smooth gradients, and dynamic compositions.
- Modern, sleek, polished digital illustration style
- Colorful with vibrant hues and smooth color gradients
- Clean, professional look suitable for advertisements
- Dynamic angles and eye-catching compositions
- Glossy, 3D-rendered aesthetic with depth and dimension
- Energetic and engaging visual storytelling
- Contemporary commercial art style
- Product/brand-focused visual hierarchy`
        : `Style: Comic book / graphic novel illustration with expressive characters and vibrant backgrounds.
- Bold outlined characters with thick black ink lines
- Colorful, expressive comic-style panels
- Dynamic action poses and dramatic angles
- Vibrant backgrounds with rich colors
- Traditional comic book shading and highlights
- Expressive facial features and body language
- Sequential art storytelling techniques
- Manga/graphic novel aesthetic with energy lines and motion`

    const combinedPrompt = `Create a single storyboard page layout containing ${storySteps.length} distinct panels arranged in a comic-style grid.

${styleGuide}

Panel descriptions (${storySteps.length} scenes total):
${storySteps
  .map(
    (step: any, idx: number) => `
Panel ${idx + 1}: ${step.title}
${step.description}
`,
  )
  .join("\n")}

Layout requirements:
- Single page containing all ${storySteps.length} panels
- Each panel should be clearly separated with borders
- Panels arranged in a visually appealing grid (2-3 panels per row)
- Vary panel sizes for visual interest
- Maintain consistent art style across all panels
- ${contentType === "ad" ? "Professional, polished commercial look" : "Comic book page aesthetic"}
- NO text overlays, NO speech bubbles, NO captions - pure visual storytelling
- Cohesive color palette throughout the composition
- ${contentType === "ad" ? "Modern, sleek, gradient-rich illustrations" : "Bold comic-style artwork with vibrant colors"}

The final image should be a complete storyboard page showing all ${storySteps.length} story beats in one unified composition.`

    try {
      console.log(`[v0] Generating storyboard with ${contentType} style (${storySteps.length} panels)`)

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
