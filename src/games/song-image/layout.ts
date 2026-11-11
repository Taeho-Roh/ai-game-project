// 샘플 그림용 배치 계산 — 같은 seed 면 언제나 같은 그림이 나와요 (화면 캡처·공유 카드가 흔들리지 않게).
import { seededRandom } from "@/quiz/random";

export const ART_WIDTH = 400;
export const ART_HEIGHT = 300;

export interface Particle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  /** 0~3 — 색 고르기용 */
  tone: number;
}

export function particleLayout(seed: number, count: number, w = ART_WIDTH, h = ART_HEIGHT): Particle[] {
  const rnd = seededRandom(seed);
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => ({
    x: rnd() * w,
    y: rnd() * h,
    size: 2 + rnd() * 5,
    rotation: rnd() * 360,
    opacity: 0.55 + rnd() * 0.45,
    tone: Math.floor(rnd() * 4),
  }));
}

export interface Building {
  x: number;
  width: number;
  height: number;
  windows: { x: number; y: number; lit: boolean }[];
}

export function skylineLayout(seed: number, w = ART_WIDTH, h = ART_HEIGHT): Building[] {
  const rnd = seededRandom(seed * 7 + 3);
  const buildings: Building[] = [];
  let x = -6;
  while (x < w) {
    const width = 28 + rnd() * 34;
    const height = 70 + rnd() * 130;
    const windows: Building["windows"] = [];
    for (let wy = h - height + 12; wy < h - 14; wy += 16) {
      for (let wx = x + 6; wx < x + width - 8; wx += 11) {
        windows.push({ x: wx, y: wy, lit: rnd() > 0.45 });
      }
    }
    buildings.push({ x, width, height, windows });
    x += width + 2 + rnd() * 6;
  }
  return buildings;
}
