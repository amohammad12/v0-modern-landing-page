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
                  text: `You are a creative visual storytelling expert specializing in photorealistic animated content. Your task is to create a compelling visual narrative with PROMINENT, RECOGNIZABLE CHARACTERS.

User's Idea: "${prompt}"

CRITICAL INSTRUCTIONS:
1. IDENTIFY REAL PEOPLE: If the user mentions real people (like "Elon Musk", "Joker", etc.), you MUST explicitly name them in EVERY scene where they appear.
2. CHARACTER PROMINENCE: Each scene description MUST start with the character name and what they're doing. Characters are the MAIN FOCUS.
3. PHYSICAL DESCRIPTIONS: Include specific details about character appearance, facial expressions, poses, and what they're wearing.
4. REALISTIC STYLE: Descriptions should be suitable for photorealistic 3D CGI animation (like modern superhero movies or high-budget animated films).

First, analyze the content type:
- If it mentions products, services, brands, marketing, sales, promotion → classify as "ad"
- If it tells a story with characters, plot, narrative, or creative storytelling → classify as "story"

Return your response as a JSON object with this exact structure (MUST have at least 5 steps):
{
  "contentType": "ad" or "story",
  "mainCharacters": ["Character 1 name", "Character 2 name", ...],
  "steps": [
    {
      "number": 1, 
      "title": "Scene Title",
      "description": "DETAILED visual description focusing on CHARACTERS. Start with '[Character Name] is...' and describe their action, expression, pose, clothing, and environment. Be specific about character visibility and framing.",
      "characterFocus": "Primary character(s) featured in this scene"
    },
    ... (minimum 5 scenes total)
  ]
}

EXAMPLE for "Elon Musk as Batman":
{
  "contentType": "story",
  "mainCharacters": ["Elon Musk as Batman"],
  "steps": [
    {
      "number": 1,
      "title": "Dark Knight Rises",
      "description": "Elon Musk wearing the Batman suit stands on a rooftop overlooking Gotham City at night. His face is clearly visible with determined expression, the bat cowl pulled back slightly. The high-tech batsuit has glowing blue details. Dramatic backlighting from the city below.",
      "characterFocus": "Elon Musk as Batman"
    },
    ...
  ]
}

IMPORTANT: 
- Generate at least 5 compelling scenes
- ALWAYS mention character names explicitly in descriptions
- Focus on character visibility, expressions, poses, and actions
- Make descriptions suitable for photorealistic 3D CGI rendering
- Each scene should have the character as the central visual element`,
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

    if (!parsedSteps.steps || parsedSteps.steps.length < 5) {
      console.error("[v0] Generated less than 5 steps, filling with defaults")
      const steps = parsedSteps.steps || []
      while (steps.length < 5) {
        steps.push({
          number: steps.length + 1,
          title: `Scene ${steps.length + 1}`,
          description: "Additional scene to complete the story",
          characterFocus: "Primary character(s) featured in this scene",
        })
      }
      parsedSteps.steps = steps
    }

    console.log(`[v0] Generated ${parsedSteps.steps.length} story steps`)

    return NextResponse.json(parsedSteps)
  } catch (error) {
    console.error("[v0] Error in generate-outline:", error)
    return NextResponse.json(
      { error: "Failed to generate outline", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
