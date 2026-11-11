// 콘텐츠 검사 — 문제를 고치면 npm test 로 꼭 돌려 주세요.
import { describe, expect, it } from "vitest";
import { isCorrectAnswer } from "@/quiz/answer";
import { toChosung } from "@/quiz/hangul";
import { validatePack } from "@/quiz/validate";
import type { QuizPack } from "@/quiz/types";
import { PACKS, getPack, sortPacks } from "./index";

describe("모든 퀴즈 묶음", () => {
  it.each(PACKS.map((p) => [p.id, p] as const))("%s: 형식 검사 통과", (_id, pack) => {
    expect(validatePack(pack)).toEqual([]);
  });

  it("묶음 id 가 겹치지 않아요", () => {
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length);
  });

  it("모든 문제에 검수 필요 표시가 있어요 (출시 전 사람이 확인)", () => {
    for (const p of PACKS) for (const q of p.questions) expect(q.needsReview, `${p.id}/${q.id}`).toBe(true);
  });

  it("각 문제의 대표 이름·공식 제목·별칭은 그 문제의 정답이에요", () => {
    for (const p of PACKS) {
      for (const q of p.questions) {
        for (const name of [q.answer, q.officialTitle ?? q.answer, ...q.aliases]) {
          expect(isCorrectAnswer(name, q), `${q.id}: ${name}`).toBe(true);
        }
      }
    }
  });

  it("한 묶음 안에서 어떤 정답도 다른 문제의 정답이 되지 않아요", () => {
    for (const p of PACKS) {
      for (const q of p.questions) {
        for (const other of p.questions) {
          if (other.id === q.id) continue;
          expect(isCorrectAnswer(q.answer, other), `${q.answer} → ${other.id}`).toBe(false);
        }
      }
    }
  });
});

describe("명대사 묶음 (quote_tts)", () => {
  const quotePacks = PACKS.filter((p): p is Extract<QuizPack, { gameType: "quote_tts" }> => p.gameType === "quote_tts");

  it("영화·드라마 두 묶음, 각 15문제 안팎", () => {
    expect(quotePacks.map((p) => p.id).sort()).toEqual(["drama-lines", "movie-lines"]);
    for (const p of quotePacks) {
      expect(p.questions.length).toBeGreaterThanOrEqual(12);
      expect(p.questions.length).toBeLessThanOrEqual(20);
    }
  });

  it("문제마다 대사는 한 줄, 작품도 한 번씩만", () => {
    for (const p of quotePacks) {
      const titles = p.questions.map((q) => q.answer);
      expect(new Set(titles).size).toBe(titles.length);
      for (const q of p.questions) expect(q.line.includes("\n")).toBe(false);
    }
  });

  it("영화 묶음은 영화만, 드라마 묶음은 드라마만", () => {
    expect(getPack("movie-lines")?.questions.every((q) => q.gameType === "quote_tts" && q.medium === "movie")).toBe(true);
    expect(getPack("drama-lines")?.questions.every((q) => q.gameType === "quote_tts" && q.medium === "drama")).toBe(true);
  });

  it("출처 표시에 작품 제목(공식)과 연도가 들어가요", () => {
    for (const p of quotePacks) {
      for (const q of p.questions) {
        expect(q.sourceNote).toContain(`〈${q.officialTitle ?? q.answer}〉(${q.year})`);
      }
    }
  });

  it("초성 힌트가 만들어져요", () => {
    expect(toChosung(getPack("movie-lines")!.questions.find((q) => q.id === "mq-nameless-gangster")!.answer)).toBe("ㅂㅈㅇㅇ ㅈㅈ");
  });
});

describe("노래 그림 샘플 묶음 (song_image)", () => {
  const pack = getPack("song-image-sample");

  it("샘플 표시가 있고 그림은 전부 코드로 그린 샘플이에요", () => {
    expect(pack?.sample).toBe(true);
    expect(pack?.gameType).toBe("song_image");
    for (const q of pack!.questions) {
      expect(q.gameType === "song_image" && q.image.kind).toBe("placeholder");
    }
  });
});

describe("목록 정렬", () => {
  it("인기순: 운영 순위, 샘플은 뒤로", () => {
    const ids = sortPacks(PACKS, "popular").map((p) => p.id);
    expect(ids[0]).toBe("movie-lines");
    expect(ids[ids.length - 1]).toBe("song-image-sample");
  });

  it("최신순: 공개일 최근부터", () => {
    const sorted = sortPacks(PACKS, "new");
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.createdAt >= sorted[i]!.createdAt).toBe(true);
    }
  });

  it("없는 묶음", () => {
    expect(getPack("nope")).toBeUndefined();
    expect(getPack(undefined)).toBeUndefined();
  });
});
