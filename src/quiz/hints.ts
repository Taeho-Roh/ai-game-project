// 힌트 사다리 — 모든 게임 종류가 같은 순서(초성 → 연도 → 장르)를 써요.
import { toChosung } from "./hangul";
import type { CommonHintId, QuestionBase } from "./types";

export const HINT_ORDER: readonly CommonHintId[] = ["chosung", "year", "genre"];

export interface HintItem {
  id: CommonHintId;
  label: string;
  value: string;
}

export function buildHint(id: CommonHintId, q: QuestionBase): HintItem {
  switch (id) {
    case "chosung":
      return { id, label: "초성", value: toChosung(q.answer) };
    case "year":
      return { id, label: "연도", value: `${q.year}년` };
    case "genre":
      return { id, label: "장르", value: q.genre };
  }
}

/** 지금까지 연 힌트들 (앞에서부터 used 개) */
export function revealedHints(q: QuestionBase, used: number): HintItem[] {
  return HINT_ORDER.slice(0, Math.max(0, Math.min(used, HINT_ORDER.length))).map((id) => buildHint(id, q));
}

export function nextHintLabel(used: number): string | null {
  const id = HINT_ORDER[used];
  if (!id) return null;
  return { chosung: "초성", year: "연도", genre: "장르" }[id];
}
