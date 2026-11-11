import { describe, expect, it } from "vitest";
import { SCORING, formatDuration, formatScore, potentialPoints, questionPoints, recordEmoji, resultComment, summarize } from "./scoring";
import type { AnswerRecord } from "./types";

function rec(partial: Partial<AnswerRecord>): AnswerRecord {
  return {
    questionId: "q",
    outcome: "correct",
    attempts: ["답"],
    hintsUsed: 0,
    extraHintUsed: false,
    extraHintCharged: false,
    points: 100,
    durationMs: 1000,
    ...partial,
  };
}

describe("문제별 점수", () => {
  it("첫 기회에 힌트 없이 맞히면 100점", () => {
    expect(questionPoints({ outcome: "correct", attempt: 1, hintsUsed: 0, extraHintCharged: false })).toBe(100);
  });

  it("두 번째 기회에 맞히면 70점", () => {
    expect(questionPoints({ outcome: "correct", attempt: 2, hintsUsed: 0, extraHintCharged: false })).toBe(SCORING.secondTry);
  });

  it("힌트 하나당 −20, 대사 보기 −10", () => {
    expect(questionPoints({ outcome: "correct", attempt: 1, hintsUsed: 1, extraHintCharged: false })).toBe(80);
    expect(questionPoints({ outcome: "correct", attempt: 1, hintsUsed: 2, extraHintCharged: true })).toBe(50);
  });

  it("맞히면 최소 20점", () => {
    expect(questionPoints({ outcome: "correct", attempt: 2, hintsUsed: 3, extraHintCharged: true })).toBe(SCORING.minCorrect);
  });

  it("틀리거나 건너뛰면 0점", () => {
    expect(questionPoints({ outcome: "wrong", attempt: 2, hintsUsed: 0, extraHintCharged: false })).toBe(0);
    expect(questionPoints({ outcome: "skipped", attempt: 0, hintsUsed: 3, extraHintCharged: true })).toBe(0);
  });

  it("지금 맞히면 받을 점수 안내", () => {
    expect(potentialPoints(1, 0, false)).toBe(100);
    expect(potentialPoints(2, 1, true)).toBe(40);
  });
});

describe("합계", () => {
  it("점수·정답 수·시간을 더해요", () => {
    const s = summarize("p", [
      rec({ questionId: "a", points: 100, durationMs: 4000 }),
      rec({ questionId: "b", outcome: "wrong", points: 0, durationMs: 9000, attempts: ["x", "y"] }),
      rec({ questionId: "c", points: 60, durationMs: 2000, hintsUsed: 2 }),
    ]);
    expect(s.score).toBe(160);
    expect(s.maxScore).toBe(300);
    expect(s.correctCount).toBe(2);
    expect(s.total).toBe(3);
    expect(s.durationMs).toBe(15000);
  });

  it("빈 기록", () => {
    const s = summarize("p", []);
    expect(s).toMatchObject({ score: 0, correctCount: 0, total: 0, durationMs: 0 });
  });
});

describe("공유 칸", () => {
  it("🟩 한 번에 · 🟨 힌트/두 번째 · 🟥 틀림 · ⬜ 건너뜀", () => {
    expect(recordEmoji(rec({}))).toBe("🟩");
    expect(recordEmoji(rec({ hintsUsed: 1 }))).toBe("🟨");
    expect(recordEmoji(rec({ attempts: ["x", "답"] }))).toBe("🟨");
    expect(recordEmoji(rec({ extraHintCharged: true }))).toBe("🟨");
    // 음성이 없어 대사를 무료로 보여 준 경우는 깨끗한 정답
    expect(recordEmoji(rec({ extraHintUsed: true, extraHintCharged: false }))).toBe("🟩");
    expect(recordEmoji(rec({ outcome: "wrong", points: 0 }))).toBe("🟥");
    expect(recordEmoji(rec({ outcome: "skipped", attempts: [], points: 0 }))).toBe("⬜");
  });
});

describe("표시 형식", () => {
  it("시간", () => {
    expect(formatDuration(0)).toBe("0초");
    expect(formatDuration(42_400)).toBe("42초");
    expect(formatDuration(60_000)).toBe("1분");
    expect(formatDuration(151_000)).toBe("2분 31초");
  });

  it("점수 천 단위 쉼표", () => {
    expect(formatScore(1240)).toBe("1,240");
  });

  it("한마디", () => {
    expect(resultComment(15, 15)).toContain("전부");
    expect(resultComment(0, 15)).not.toBe("");
    expect(resultComment(0, 0)).toBe("");
  });
});
