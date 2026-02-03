import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

// =============================================================================
// CALL CENTER ASSISTANT - Chat API Route
// =============================================================================
// This API route handles the dialogue for the call center assistant.
// It takes the customer's message and conversation history, then generates
// a helpful response that may include clarifying questions.
//
// CUSTOMIZE THIS:
// - Modify the system prompt to match your company's products/services
// - Add references to your knowledge base or documentation
// - Adjust the tone and style of responses
// =============================================================================

type Message = {
  role: "user" | "assistant";
  content: string;
};

// System prompt for the call center assistant
const SYSTEM_PROMPT = `You are a helpful call center assistant supporting operators during customer calls.

Your role is to:
1. Provide clear, helpful responses to customer questions
2. Ask clarifying questions when the customer's query is unclear or you need more information
3. Reference relevant product information or policies when applicable
4. Keep responses concise and easy for the operator to relay to the customer

Guidelines:
- Be professional but friendly
- If you're unsure about something, ask a clarifying question
- Structure your response so the operator can easily communicate it
- If the issue is complex, break it down into steps
- Always aim to resolve the customer's concern

When you need more information, ask ONE clear clarifying question at the end of your response.

Example clarifying questions:
- "Could you ask the customer which product they're referring to?"
- "To help better, could you find out when they made this purchase?"
- "Is the customer experiencing this issue on mobile or desktop?"`;

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Build the messages array for OpenAI
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: SYSTEM_PROMPT }];

    // Add conversation history (limit to last 10 messages to save tokens)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I apologize, I couldn't generate a response. Please try again.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Call assistant error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
