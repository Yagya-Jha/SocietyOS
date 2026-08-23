import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Initialize the OpenRouter provider
// Requires OPENROUTER_API_KEY in .env.local
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// We will use a fast and reliable model for JSON extraction, like a small Llama 3 or Haiku, 
// but for maximum compatibility with Vercel AI SDK JSON mode via OpenRouter, 
// using standard OpenAI models mapped via OpenRouter or similar is often good.
// The user specified OpenRouter, so we use it.
export const extractionModel = openrouter('openrouter/free');
