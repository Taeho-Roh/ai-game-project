// 이미지 제공자 고르기. 새 제공자는 같은 모양({name, model, envVar, isConfigured, generate})으로 추가하면 돼요.
import { createOpenAIProvider } from "./openai.mjs";
import { createGeminiProvider } from "./gemini.mjs";

export const PROVIDER_NAMES = ["openai", "gemini"];

export function getProvider(name = "openai", opts = {}) {
  if (name === "openai") return createOpenAIProvider(opts);
  if (name === "gemini") return createGeminiProvider(opts);
  throw new Error(`모르는 제공자: ${name} (openai | gemini)`);
}
