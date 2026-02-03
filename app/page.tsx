"use client";

import Link from "next/link";
import { BookOpen, Phone, Mic, Languages } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="text-center py-16 px-8 animate-fade-in">
        <h1 className="text-5xl font-bold mb-4 font-display">
          <span className="text-gradient">AI Sales Workshop</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Build AI-powered sales tools with Claude Code. No coding experience
          required — just describe what you want in plain language and watch it
          come to life.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Example App (highlighted) */}
          <div
            className="bg-white rounded-xl border-2 border-dashed border-primary/30 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Start Here Badge */}
            <div className="mb-4">
              <span className="badge-accent">Start Here</span>
            </div>

            {/* Icon */}
            <div className="w-12 h-12 bg-[hsl(var(--accent)_/_0.1)] rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-[hsl(var(--accent))]" />
            </div>

            {/* Title */}
            <h2 className="font-display text-lg font-bold mb-2">Example App</h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              A complete AI sales platform with LinkedIn message generation,
              prospect research, and more. Study this code to learn patterns
              before building your own.
            </p>

            {/* Features List */}
            <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                LinkedIn message generation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                File upload & processing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                AI-powered research
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                Audio transcription demo
              </li>
            </ul>

            {/* Button */}
            <Link
              href="/example"
              className="btn-accent text-center w-full cursor-pointer"
            >
              Explore Example
            </Link>
          </div>

          {/* Card 2: Audio Example (complete example) */}
          <div
            className="bg-white rounded-xl border-2 border-dashed border-accent/30 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            {/* Complete Example Badge */}
            <div className="mb-4">
              <span className="badge-accent">Complete Example</span>
            </div>

            {/* Icon */}
            <div className="w-12 h-12 bg-[hsl(var(--accent)_/_0.1)] rounded-xl flex items-center justify-center mb-4">
              <Languages className="w-6 h-6 text-[hsl(var(--accent))]" />
            </div>

            {/* Title */}
            <h2 className="font-display text-lg font-bold mb-2">
              Audio Example
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Full-featured audio transcription with Whisper, AI summaries, and
              translation to 28+ languages. Use this for the workshop use case.
            </p>

            {/* Features List */}
            <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                Whisper transcription
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                GPT-5 summarization
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                Multi-language translation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                Upload or record audio
              </li>
            </ul>

            {/* Button */}
            <Link
              href="/audio-example"
              className="btn-accent text-center w-full cursor-pointer"
            >
              Open Audio Example
            </Link>
          </div>

          {/* Card 3: Call Assistant (scaffold) */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.25s" }}
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-[hsl(var(--primary)_/_0.1)] rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>

            {/* Title */}
            <h2 className="font-display text-lg font-bold mb-2">
              Call Assistant
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Build an AI assistant for sales call preparation. Enter customer
              info and get AI-generated talking points, objection handling, and
              call scripts.
            </p>

            {/* Note */}
            <p className="text-xs text-muted-foreground italic mb-6 flex-grow">
              You&apos;ll build this during the workshop
            </p>

            {/* Button */}
            <Link
              href="/call-assistant"
              className="btn-primary text-center w-full opacity-80 hover:opacity-100 cursor-pointer"
            >
              Open Scaffold
            </Link>
          </div>

          {/* Card 4: Post-Sales Assistant (scaffold) */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col animate-fade-in"
            style={{ animationDelay: "0.35s" }}
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-[hsl(var(--primary)_/_0.1)] rounded-xl flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>

            {/* Title */}
            <h2 className="font-display text-lg font-bold mb-2">
              Post-Sales Assistant
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4">
              Build an AI assistant with audio transcription for post-call
              follow-up. Record or upload audio, get transcription, and generate
              CRM-ready summaries.
            </p>

            {/* Note */}
            <p className="text-xs text-muted-foreground italic mb-6 flex-grow">
              You&apos;ll build this during the workshop
            </p>

            {/* Button */}
            <Link
              href="/post-sales"
              className="btn-primary text-center w-full opacity-80 hover:opacity-100 cursor-pointer"
            >
              Open Scaffold
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div
        className="border-t border-gray-100 bg-white/50 py-12 px-8 animate-fade-in"
        style={{ animationDelay: "0.4s" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">
            Use Claude Code slash commands to get help building your apps:
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <code className="bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] px-3 py-1.5 rounded-lg text-sm font-mono">
              /workshop-guide
            </code>
            <code className="bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] px-3 py-1.5 rounded-lg text-sm font-mono">
              /check-app
            </code>
          </div>
          <p className="text-sm text-muted-foreground">
            See{" "}
            <a
              href="https://github.com/tensorninja/ai-workshop/blob/main/WORKSHOP.md"
              className="text-[hsl(var(--accent))] hover:underline font-medium cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
            >
              WORKSHOP.md
            </a>{" "}
            for detailed instructions and common prompts to try.
          </p>
        </div>
      </div>
    </main>
  );
}
