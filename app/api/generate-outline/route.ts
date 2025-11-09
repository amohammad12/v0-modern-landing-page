import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY not found in environment variables")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a creative story writer. Given the following idea, first determine if this is an advertisement/promotional content or a narrative story, then expand it into a detailed outline with exactly 5 steps/scenes.

User's Idea: "${prompt}"

First, analyze the content type:
- If it mentions products, services, brands, marketing, sales, promotion, advertisement, or commercial purposes → classify as "ad"
- If it tells a story with characters, plot, narrative, or creative storytelling → classify as "story"

Return your response as a JSON object with this exact structure:
{
  "contentType": "ad" or "story",
  "steps": [
    {"number": 1, "title": "...", "description": "..."},
    {"number": 2, "title": "...", "description": "..."},
    {"number": 3, "title": "...", "description": "..."},
    {"number": 4, "title": "...", "description": "..."},
    {"number": 5, "title": "...", "description": "..."}
  ]
}

Make the outline engaging, cinematic, and appropriate for visual storytelling.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Gemini API response:", JSON.stringify(data))

    // Extract the text content from Gemini response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      throw new Error("No content in Gemini response")
    }

    // Parse the JSON from the text (remove markdown code blocks if present)
    const jsonText = textContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()
    const parsedSteps = JSON.parse(jsonText)

    return NextResponse.json(parsedSteps)
  } catch (error) {
    console.error("[v0] Error in generate-outline:", error)
    return NextResponse.json(
      { error: "Failed to generate outline", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
