import { describe, expect, it } from "vitest";
import { answerCandidates, editDistance, isCorrectAnswer, isNearMiss, normalizeAnswer, stripBracketed } from "./answer";

const nameless = {
  answer: "범죄와의 전쟁",
  officialTitle: "범죄와의 전쟁: 나쁜놈들 전성시대",
  aliases: ["나쁜놈들 전성시대", "Nameless Gangster"],
};

describe("normalizeAnswer — 띄어쓰기·문장부호·대소문자 무시", () => {
  it("띄어쓰기를 지워요", () => {
    expect(normalizeAnswer("살인의 추억")).toBe("살인의추억");
    expect(normalizeAnswer("  살 인 의   추억 ")).toBe("살인의추억");
  });

  it("문장부호·기호를 지워요", () => {
    expect(normalizeAnswer("범죄와의 전쟁: 나쁜놈들 전성시대")).toBe("범죄와의전쟁나쁜놈들전성시대");
    expect(normalizeAnswer("빨간 맛 (Red Flavor)")).toBe("빨간맛redflavor");
    expect(normalizeAnswer("쓸쓸하고 찬란하神 – 도깨비")).toBe("쓸쓸하고찬란하神도깨비");
    expect(normalizeAnswer("!!기생충??")).toBe("기생충");
  });

  it("대소문자와 전각 문자를 같게 봐요", () => {
    expect(normalizeAnswer("OldBoy")).toBe("oldboy");
    expect(normalizeAnswer("ＳＫＹ 캐슬")).toBe("sky캐슬");
  });

  it("비어 있거나 기호뿐이면 빈 문자열", () => {
    expect(normalizeAnswer("")).toBe("");
    expect(normalizeAnswer(" ?! ")).toBe("");
  });
});

describe("stripBracketed / answerCandidates", () => {
  it("괄호 안을 뺀 후보도 만들어요", () => {
    expect(stripBracketed("기생충 (2019)").trim()).toBe("기생충");
    expect(answerCandidates("곡성(哭聲)")).toEqual(["곡성哭聲", "곡성"]);
  });

  it("빈 후보는 넣지 않아요", () => {
    expect(answerCandidates("(  )")).toEqual([]);
  });
});

describe("isCorrectAnswer — 별칭 인정", () => {
  it("대표 이름·공식 제목·별칭 모두 정답", () => {
    expect(isCorrectAnswer("범죄와의 전쟁", nameless)).toBe(true);
    expect(isCorrectAnswer("범죄와의전쟁", nameless)).toBe(true);
    expect(isCorrectAnswer("범죄와의 전쟁: 나쁜놈들 전성시대", nameless)).toBe(true);
    expect(isCorrectAnswer("나쁜 놈들 전성시대", nameless)).toBe(true);
    expect(isCorrectAnswer("nameless gangster", nameless)).toBe(true);
    expect(isCorrectAnswer("NAMELESS-GANGSTER!", nameless)).toBe(true);
  });

  it("괄호 덧붙임도 받아 줘요", () => {
    expect(isCorrectAnswer("범죄와의 전쟁 (2012)", nameless)).toBe(true);
  });

  it("다른 제목·일부만 쓴 답은 오답", () => {
    expect(isCorrectAnswer("범죄도시", nameless)).toBe(false);
    expect(isCorrectAnswer("전쟁", nameless)).toBe(false);
    expect(isCorrectAnswer("", nameless)).toBe(false);
    expect(isCorrectAnswer("   ", nameless)).toBe(false);
  });

  it("숫자가 다른 속편 제목은 오답", () => {
    const q = { answer: "베테랑", aliases: ["Veteran"] };
    expect(isCorrectAnswer("베테랑2", q)).toBe(false);
    expect(isCorrectAnswer("베테랑", q)).toBe(true);
  });
});

describe("editDistance / isNearMiss — '아까워요' 안내", () => {
  it("편집 거리", () => {
    expect(editDistance("기생충", "기생충")).toBe(0);
    expect(editDistance("기생충", "기셍충")).toBe(1);
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("kitten", "sitting")).toBe(3);
  });

  it("한두 글자 틀리면 아까워요 (정답 처리는 안 함)", () => {
    const q = { answer: "살인의 추억", aliases: [] };
    expect(isNearMiss("살인의 추엌", q)).toBe(true);
    expect(isCorrectAnswer("살인의 추엌", q)).toBe(false);
    expect(isNearMiss("살인의 추억", q)).toBe(false); // 정답이면 아까운 게 아님
    expect(isNearMiss("올드보이", q)).toBe(false);
  });

  it("너무 짧은 제목은 아까워요 안내를 안 해요", () => {
    expect(isNearMiss("친가", { answer: "친구", aliases: [] })).toBe(false);
  });
});
