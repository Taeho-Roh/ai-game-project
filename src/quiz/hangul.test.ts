import { describe, expect, it } from "vitest";
import { chosungOf, isHangulSyllable, toChosung } from "./hangul";

describe("초성 뽑기", () => {
  it("기획서 예시: 범죄와의 전쟁 → ㅂㅈㅇㅇ ㅈㅈ", () => {
    expect(toChosung("범죄와의 전쟁")).toBe("ㅂㅈㅇㅇ ㅈㅈ");
  });

  it("글자 하나", () => {
    expect(chosungOf("가")).toBe("ㄱ");
    expect(chosungOf("힣")).toBe("ㅎ");
    expect(chosungOf("까")).toBe("ㄲ");
    expect(chosungOf("쌍")).toBe("ㅆ");
    expect(chosungOf("a")).toBeNull();
    expect(chosungOf("ㄱ")).toBeNull(); // 자모 단독은 음절이 아님
  });

  it("음절 판별", () => {
    expect(isHangulSyllable("한")).toBe(true);
    expect(isHangulSyllable("A")).toBe(false);
    expect(isHangulSyllable("")).toBe(false);
  });

  it("영문·숫자는 그대로, 문장부호는 빼고, 띄어쓰기는 한 칸", () => {
    expect(toChosung("SKY 캐슬")).toBe("SKY ㅋㅅ");
    expect(toChosung("범죄도시2")).toBe("ㅂㅈㄷㅅ2");
    expect(toChosung("빨간 맛 (Red Flavor)")).toBe("ㅃㄱ ㅁ Red Flavor"); // 된소리 초성도 그대로
    expect(toChosung("  이상한   변호사  우영우 ")).toBe("ㅇㅅㅎ ㅂㅎㅅ ㅇㅇㅇ");
    expect(toChosung("살인의 추억!")).toBe("ㅅㅇㅇ ㅊㅇ");
  });

  it("빈 글", () => {
    expect(toChosung("")).toBe("");
    expect(toChosung("?!")).toBe("");
  });
});
