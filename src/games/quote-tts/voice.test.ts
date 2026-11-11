import { describe, expect, it } from "vitest";
import { isKorean, pickKoreanVoice, voiceScore } from "./voice";

describe("한국어 음성 고르기", () => {
  it("한국어가 없으면 null (→ 화면에서 대사를 글자로 보여 줌)", () => {
    expect(pickKoreanVoice([])).toBeNull();
    expect(pickKoreanVoice([{ name: "Microsoft Zira", lang: "en-US" }])).toBeNull();
  });

  it("남성 음성보다 여성 음성을 먼저 골라요 (Windows)", () => {
    const v = pickKoreanVoice([
      { name: "Microsoft InJoon Online (Natural) - Korean (Korea)", lang: "ko-KR" },
      { name: "Microsoft Heami - Korean (Korean)", lang: "ko-KR" },
      { name: "Microsoft Zira - English (United States)", lang: "en-US" },
    ]);
    expect(v?.name).toBe("Microsoft Heami - Korean (Korean)");
  });

  it("여성 중에서는 더 자연스러운(Natural) 음성", () => {
    const v = pickKoreanVoice([
      { name: "Microsoft Heami - Korean (Korean)", lang: "ko-KR" },
      { name: "Microsoft SunHi Online (Natural) - Korean (Korea)", lang: "ko-KR" },
    ]);
    expect(v?.name).toContain("SunHi");
  });

  it("Chrome·iOS 의 한국어 여성 음성", () => {
    expect(pickKoreanVoice([{ name: "Google 한국의", lang: "ko-KR" }])?.name).toBe("Google 한국의");
    expect(pickKoreanVoice([{ name: "Minsu", lang: "ko-KR" }, { name: "Yuna", lang: "ko-KR" }])?.name).toBe("Yuna");
  });

  it("성별을 모르면 아무 한국어 음성 (목록 순서대로)", () => {
    const v = pickKoreanVoice([
      { name: "English", lang: "en-GB" },
      { name: "한국어 대한민국", lang: "ko_KR" },
      { name: "한국어 2", lang: "ko-KR" },
    ]);
    expect(v?.name).toBe("한국어 대한민국");
  });

  it("남성 음성만 있으면 그거라도 써요", () => {
    expect(pickKoreanVoice([{ name: "Microsoft InJoon Online (Natural)", lang: "ko-KR" }])?.name).toContain("InJoon");
  });

  it("female 안의 male 을 남성으로 오해하지 않아요", () => {
    expect(voiceScore({ name: "Korean Female", lang: "ko-KR" })).toBeGreaterThan(0);
    expect(voiceScore({ name: "Korean Male", lang: "ko-KR" })).toBeLessThan(0);
  });

  it("언어 코드 판별", () => {
    expect(isKorean({ lang: "ko-KR" })).toBe(true);
    expect(isKorean({ lang: "ko_KR" })).toBe(true);
    expect(isKorean({ lang: "KO" })).toBe(true);
    expect(isKorean({ lang: "en-US" })).toBe(false);
  });
});
