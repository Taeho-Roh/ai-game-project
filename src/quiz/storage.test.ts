import { describe, expect, it } from "vitest";
import { incrementPlayCount, isBetter, loadBest, loadPlayCount, saveIfBest, type KeyValueStore } from "./storage";
import { summarize } from "./scoring";
import type { AnswerRecord } from "./types";

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function play(points: number[], durationMs = 1000) {
  const records: AnswerRecord[] = points.map((p, i) => ({
    questionId: `q${i}`,
    outcome: p > 0 ? "correct" : "wrong",
    attempts: ["a"],
    hintsUsed: 0,
    extraHintUsed: false,
    extraHintCharged: false,
    points: p,
    durationMs,
  }));
  return summarize("pack-1", records);
}

describe("내 최고 기록 (localStorage)", () => {
  it("첫 판은 무조건 저장", () => {
    const store = memoryStore();
    const r = saveIfBest(play([100, 0]), store, new Date("2026-11-11T00:00:00Z"));
    expect(r).toEqual({ isNewBest: true, previous: null });
    expect(loadBest("pack-1", store)).toMatchObject({ score: 100, correctCount: 1, total: 2, playedAt: "2026-11-11T00:00:00.000Z" });
  });

  it("더 낮은 점수는 덮어쓰지 않아요", () => {
    const store = memoryStore();
    saveIfBest(play([100, 100]), store);
    const r = saveIfBest(play([100, 0]), store);
    expect(r.isNewBest).toBe(false);
    expect(loadBest("pack-1", store)?.score).toBe(200);
  });

  it("같은 점수면 더 빨리 끝낸 기록이 이겨요", () => {
    expect(isBetter({ score: 100, durationMs: 5000 }, { score: 100, durationMs: 9000 })).toBe(true);
    expect(isBetter({ score: 100, durationMs: 9000 }, { score: 100, durationMs: 5000 })).toBe(false);
    expect(isBetter({ score: 90, durationMs: 1 }, { score: 100, durationMs: 9000 })).toBe(false);
    expect(isBetter({ score: 0, durationMs: 1 }, null)).toBe(true);
  });

  it("묶음마다 따로 저장", () => {
    const store = memoryStore();
    saveIfBest(play([100]), store);
    expect(loadBest("other-pack", store)).toBeNull();
  });

  it("저장소가 없거나 깨진 값이어도 멈추지 않아요", () => {
    expect(loadBest("pack-1", null)).toBeNull();
    expect(saveIfBest(play([100]), null).isNewBest).toBe(true);
    const store = memoryStore();
    store.setItem("aigame:v1:best:pack-1", "{깨진 JSON");
    expect(loadBest("pack-1", store)).toBeNull();
    const throwing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
    };
    expect(() => saveIfBest(play([100]), throwing)).not.toThrow();
  });

  it("플레이 횟수", () => {
    const store = memoryStore();
    expect(loadPlayCount("pack-1", store)).toBe(0);
    incrementPlayCount("pack-1", store);
    expect(incrementPlayCount("pack-1", store)).toBe(2);
  });
});
