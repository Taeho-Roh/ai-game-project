// Google Gemini 이미지 API (Gemini 2.5 Flash Image). 키(GEMINI_API_KEY)가 있을 때만 실제로 불러요.
// 한 번 호출에 한 장이라 후보 수만큼 반복해요. 가격(보고서 기준, 계약 전 재확인): 약 55원/장.
export const GEMINI_ENV = "GEMINI_API_KEY";
export const GEMINI_MODEL = "gemini-2.5-flash-image";

export function createGeminiProvider({ env = process.env, fetchImpl = globalThis.fetch, model = GEMINI_MODEL } = {}) {
  return {
    name: "gemini",
    model,
    envVar: GEMINI_ENV,
    estimatedWonPerImage: 55,
    isConfigured: () => Boolean(env[GEMINI_ENV]),
    /** @returns {Promise<{bytes: Buffer, mime: string}[]>} */
    async generate({ prompt, count = 4, signal }) {
      const key = env[GEMINI_ENV];
      if (!key) throw new Error(`${GEMINI_ENV} 환경변수가 없어요`);
      const images = [];
      for (let i = 0; i < count; i++) {
        const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal,
        });
        if (!res.ok) throw new Error(`Gemini 이미지 API 오류 ${res.status}: ${(await res.text()).slice(0, 300)}`);
        const json = await res.json();
        const parts = json?.candidates?.[0]?.content?.parts ?? [];
        const part = parts.find((p) => p.inlineData?.data);
        if (!part) throw new Error("Gemini 응답에 이미지가 없어요");
        images.push({ bytes: Buffer.from(part.inlineData.data, "base64"), mime: part.inlineData.mimeType ?? "image/png" });
      }
      return images;
    },
  };
}
