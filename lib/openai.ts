import OpenAI from "openai";

// Lazy initialization — only creates the client when first used,
// so builds succeed even without OPENAI_API_KEY set.
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

// Convenience export for simple usage: import { openai } from '@/lib/openai'
// Note: this will throw at runtime if OPENAI_API_KEY is not set
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});
