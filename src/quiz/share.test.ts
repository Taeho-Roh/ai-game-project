import { describe, expect, it } from "vitest";
import { buildShareText, emojiGrid } from "./share";
import { summarize } from "./scoring";
import type { AnswerRecord, Outcome } from "./types";

function records(outcomes: Outcome[]): AnswerRecord[] {
  return outcomes.map((o, i) => ({
    questionId: `q${i}`,
    outcome: o,
    attempts: o === "skipped" ? [] : ["a"],
    hintsUsed: 0,
    extraHintUsed: false,
    extraHintCharged: false,
    points: o === "correct" ? 100 : 0,
    durationMs: 10_000,
  }));
}

describe("공유 문구", () => {
  it("5칸씩 줄을 나눠요", () => {
    const s = summarize("p", records(["correct", "wrong", "skipped", "correct", "correct", "correct", "wrong"]));
    expect(emojiGrid(s)).toBe("🟩🟥⬜🟩🟩\n🟩🟥");
  });

  it("묶음 이름·정답 수·점수·시간·주소가 들어가요", () => {
    const s = summarize("p", records(["correct", "correct", "wrong"]));
    const text = buildShareText({
      siteName: "맞혀볼래?",
      gameLabel: "명대사 듣고 작품 맞히기",
      packTitle: "한국 영화 명대사",
      summary: s,
      url: "https://example.com",
    });
    expect(text).toBe(
      ["맞혀볼래? · 명대사 듣고 작품 맞히기", "「한국 영화 명대사」 3문제 중 2개 정답!", "200점 · 30초", "🟩🟩🟥", "https://example.com"].join("\n"),
    );
  });

  it("주소가 없으면 줄을 빼요", () => {
    const s = summarize("p", records(["correct"]));
    const text = buildShareText({ siteName: "S", gameLabel: "G", packTitle: "P", summary: s });
    expect(text.split("\n")).toHaveLength(4);
  });

  it("대사 원문은 공유 문구에 넣지 않아요 (스포일러·인용 최소화)", () => {
    const s = summarize("p", records(["correct"]));
    const text = buildShareText({ siteName: "S", gameLabel: "G", packTitle: "P", summary: s });
    expect(text).not.toContain("묻고 더블로");
  });
});
