// OpenAI 이미지 API (gpt-image-1-mini). 키(OPENAI_API_KEY)가 있을 때만 실제로 불러요.
// 가격(보고서 기준, 계약 전 재확인): 약 15원/장.
export const OPENAI_ENV = "OPENAI_API_KEY";
export const OPENAI_MODEL = "gpt-image-1-mini";

export function createOpenAIProvider({ env = process.env, fetchImpl = globalThis.fetch, model = OPENAI_MODEL } = {}) {
  return {
    name: "openai",
    model,
    envVar: OPENAI_ENV,
    estimatedWonPerImage: 15,
    isConfigured: () => Boolean(env[OPENAI_ENV]),
    /** @returns {Promise<{bytes: Buffer, mime: string}[]>} */
    async generate({ prompt, count = 4, signal }) {
      const key = env[OPENAI_ENV];
      if (!key) throw new Error(`${OPENAI_ENV} 환경변수가 없어요`);
      const res = await fetchImpl("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, prompt, n: count, size: "1024x1024", quality: "low" }),
        signal,
      });
      if (!res.ok) throw new Error(`OpenAI 이미지 API 오류 ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : [];
      const images = items
        .filter((d) => typeof d.b64_json === "string")
        .map((d) => ({ bytes: Buffer.from(d.b64_json, "base64"), mime: "image/png" }));
      if (images.length === 0) throw new Error("OpenAI 응답에 이미지가 없어요");
      return images;
    },
  };
}
