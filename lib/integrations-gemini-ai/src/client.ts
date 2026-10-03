import { GoogleGenAI } from "@google/genai";

// On Replit, use the provisioned Gemini integration. Elsewhere (e.g. Netlify),
// the Netlify AI Gateway supplies GEMINI_API_KEY / GOOGLE_GEMINI_BASE_URL automatically.
const replitBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const replitApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

export const ai =
  replitBaseUrl && replitApiKey
    ? new GoogleGenAI({
        apiKey: replitApiKey,
        httpOptions: {
          apiVersion: "",
          baseUrl: replitBaseUrl,
        },
      })
    : new GoogleGenAI({});
