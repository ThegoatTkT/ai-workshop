import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

/**
 * Example API route that generates sales call talking points
 *
 * This is a complete, working example for workshop participants to study.
 * It shows the standard pattern: receive input → call OpenAI → return result
 */
export async function POST(request: Request) {
  try {
    // Step 1: Get the company name from the request body
    const { companyName } = await request.json();

    // Step 2: Validate the input
    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    // Step 3: Call OpenAI to generate talking points
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content: `You are a sales call preparation assistant. Given a company name, generate helpful talking points for a sales call.

Your response should include:
1. A brief company overview (what they likely do based on the name)
2. 3-4 potential pain points or challenges they might face
3. 3-4 talking points or questions to ask during the call
4. 2-3 potential objections and how to handle them

Keep your response concise and actionable. Use bullet points for easy scanning.
Format the sections with clear headings.`,
        },
        {
          role: "user",
          content: `Generate sales call talking points for: ${companyName}`,
        },
      ],
    });

    // Step 4: Extract the generated text from the response
    const result = completion.choices[0].message.content;

    // Step 5: Return the result
    return NextResponse.json({ result });
  } catch (error) {
    // Log the error for debugging (visible in terminal)
    console.error("Example API error:", error);

    // Return a user-friendly error message
    return NextResponse.json(
      { error: "Failed to generate talking points. Please try again." },
      { status: 500 },
    );
  }
}
