import { generateText } from "ai";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const extractionModel = openrouter('openrouter/free');

async function main() {
  try {
    const { text } = await generateText({
      model: extractionModel,
      prompt: `Analyze the following resident complaint and extract its category and location.
      Complaint: "There is a massive water leak coming from the ceiling outside Flat 204."
      
      You MUST respond with ONLY a valid JSON object in the exact following format, without any markdown formatting or explanation:
      {
        "category": "plumbing" | "electrical" | "civil_structural" | "elevator" | "security" | "housekeeping" | "parking" | "other",
        "location": "The specific location mentioned (e.g. 'Lobby', 'Elevator B', 'Flat 101'). Leave empty string if none."
      }`,
    });
    
    console.log("Raw output:", text);
    const jsonStr = text.replace(/```json\n?/, '').replace(/```/, '').trim();
    const object = JSON.parse(jsonStr);
    console.log("Success:", object);
  } catch (err: any) {
    console.error("Error:", err.message || err);
  }
}

main();

main();
