"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Headphones,
  Send,
  User,
  Bot,
  Loader2,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

// =============================================================================
// CALL CENTER ASSISTANT - Live Customer Support Tool
// =============================================================================
// This is a dialogue-based assistant that helps call center operators
// during customer calls. The AI responds to customer queries and asks
// clarifying questions when needed.
//
// HOW IT WORKS:
// 1. Operator enters customer information and their question
// 2. AI generates a helpful response
// 3. AI may ask clarifying questions if the query is unclear
// 4. Conversation continues until the issue is resolved
//
// WHAT TO BUILD:
// - Dialogue/conversation history
// - AI responses with clarifying questions
// - Reference to relevant cases or product information
// =============================================================================

// Message type for the conversation
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function CallAssistant() {
  // ===========================================================================
  // State for the dialogue system
  // ===========================================================================
  const [customerQuery, setCustomerQuery] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===========================================================================
  // Handle sending a message
  // ===========================================================================
  async function handleSend() {
    if (!customerQuery.trim() || loading) return;

    const userMessage = customerQuery.trim();
    setCustomerQuery("");
    setError("");

    // Add user message to conversation
    const updatedConversation: Message[] = [
      ...conversation,
      { role: "user", content: userMessage },
    ];
    setConversation(updatedConversation);
    setLoading(true);

    try {
      const response = await fetch("/api/call-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: updatedConversation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to conversation
      setConversation([
        ...updatedConversation,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setError("Failed to get response. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ===========================================================================
  // Handle Enter key press
  // ===========================================================================
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ===========================================================================
  // Clear the conversation
  // ===========================================================================
  function handleClear() {
    setConversation([]);
    setCustomerQuery("");
    setError("");
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 font-display flex items-center gap-3">
          <Headphones className="w-8 h-8 text-primary" />
          Call Center Assistant
        </h1>
        <p className="text-muted-foreground text-lg">
          AI-powered support for customer calls. Enter the customer&apos;s
          question and get helpful responses.
        </p>
      </div>

      {/* How It Works */}
      <div className="card-elevated p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 font-display">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Enter Query</p>
              <p className="text-sm text-muted-foreground">
                Type what the customer is asking
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <HelpCircle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Get Response</p>
              <p className="text-sm text-muted-foreground">
                AI provides helpful answers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Clarify</p>
              <p className="text-sm text-muted-foreground">
                AI asks follow-up questions if needed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-display">Conversation</h2>
          {conversation.length > 0 && (
            <button
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear conversation
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="min-h-[300px] max-h-[500px] overflow-y-auto mb-4 space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No conversation yet.</p>
              <p className="text-sm">
                Enter a customer question below to get started.
              </p>
            </div>
          ) : (
            conversation.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2">
          <textarea
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter the customer's question..."
            className="input-enhanced flex-1 min-h-[50px] max-h-[150px] resize-y"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !customerQuery.trim()}
            className="btn-primary px-4 self-end"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Build Instructions */}
      <div className="card-elevated p-6">
        <h2 className="text-xl font-semibold mb-4 font-display">
          Customize This App
        </h2>
        <p className="text-muted-foreground mb-4">
          This is a working scaffold. Ask Claude Code to customize it:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary">1.</span>
            <span>
              &quot;Add a field for customer name and account number at the
              top&quot;
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">2.</span>
            <span>
              &quot;Make the AI reference our product documentation when
              answering&quot;
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">3.</span>
            <span>
              &quot;Add suggested responses that I can click to send&quot;
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">4.</span>
            <span>
              &quot;Add a button to copy the conversation summary&quot;
            </span>
          </li>
        </ul>
        <div className="mt-4 p-3 bg-accent/10 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> The API route at{" "}
            <code className="bg-muted px-1 rounded">
              /api/call-assistant/chat
            </code>{" "}
            needs to be created. Ask Claude Code to create it!
          </p>
        </div>
      </div>
    </main>
  );
}
