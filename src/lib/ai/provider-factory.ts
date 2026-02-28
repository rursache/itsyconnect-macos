import type { LanguageModel } from "ai";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { createMistral } from "@ai-sdk/mistral";
import { getAISettings } from "./settings";

/** Create a Vercel AI SDK LanguageModel from stored AI settings. */
export async function getLanguageModel(): Promise<LanguageModel> {
  const settings = await getAISettings();
  if (!settings) {
    throw new Error("AI not configured");
  }

  return createLanguageModel(settings.provider, settings.modelId, settings.apiKey);
}

export function createLanguageModel(
  provider: string,
  modelId: string,
  apiKey: string,
): LanguageModel {
  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case "xai": {
      const xai = createXai({ apiKey });
      return xai(modelId);
    }
    case "mistral": {
      const mistral = createMistral({ apiKey });
      return mistral(modelId);
    }
    case "deepseek": {
      const deepseek = createOpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      return deepseek(modelId);
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Validate an API key by making a minimal test call to the provider.
 * Returns null if valid, or an error message string if invalid.
 */
export async function validateApiKey(
  provider: string,
  modelId: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const model = createLanguageModel(provider, modelId, apiKey);
    await generateText({
      model,
      prompt: "Say hi",
      maxOutputTokens: 16,
    });
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/401|unauthorized|invalid.*key|invalid.*api|incorrect.*key|authentication/i.test(message)) {
      return "Invalid API key";
    }
    if (/403|forbidden|permission/i.test(message)) {
      return "API key lacks required permissions";
    }
    if (/404|not.found|model/i.test(message)) {
      return "Model not found – check your provider and model selection";
    }
    if (/429|rate.limit|quota/i.test(message)) {
      // Rate limited but key is valid
      return null;
    }
    return `API key validation failed: ${message}`;
  }
}
