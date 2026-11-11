import { describe, expect, it } from "vitest";
import { ART_HEIGHT, ART_WIDTH, particleLayout, skylineLayout } from "./layout";
import { shuffle, seededRandom } from "@/quiz/random";

describe("샘플 그림 배치", () => {
  it("같은 seed 면 같은 그림", () => {
    expect(particleLayout(11, 30)).toEqual(particleLayout(11, 30));
    expect(skylineLayout(41)).toEqual(skylineLayout(41));
  });

  it("다른 seed 면 다른 그림", () => {
    expect(particleLayout(11, 30)).not.toEqual(particleLayout(12, 30));
  });

  it("개수와 범위", () => {
    const ps = particleLayout(5, 50);
    expect(ps).toHaveLength(50);
    for (const p of ps) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(ART_WIDTH);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(ART_HEIGHT);
    }
    expect(particleLayout(5, -3)).toEqual([]);
  });

  it("건물이 화면 너비를 채워요", () => {
    const bs = skylineLayout(41);
    const last = bs[bs.length - 1]!;
    expect(last.x + last.width).toBeGreaterThanOrEqual(ART_WIDTH - 10);
  });
});

describe("섞기", () => {
  it("원본은 그대로, 같은 원소", () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = shuffle(src, seededRandom(1));
    expect(src).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(src);
  });
});
