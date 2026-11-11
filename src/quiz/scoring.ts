// 점수 계산 — 결과 화면·최고 기록·공유 문구가 모두 이 규칙을 써요.
import type { AnswerRecord, Outcome, PlaySummary } from "./types";

export const SCORING = {
  /** 첫 번째 기회에 맞히면 */
  firstTry: 100,
  /** 두 번째 기회에 맞히면 */
  secondTry: 70,
  /** 공통 힌트(초성·연도·장르) 하나당 감점 */
  hintCost: 20,
  /** 게임별 추가 힌트(대사 보기·그림 설명) 감점 */
  extraHintCost: 10,
  /** 맞혔다면 최소 점수 */
  minCorrect: 20,
  /** 한 문제에서 낼 수 있는 답의 수 */
  maxAttempts: 2,
} as const;

export interface PointsInput {
  outcome: Outcome;
  /** 몇 번째 기회에 맞혔는지 (1 또는 2) */
  attempt: number;
  hintsUsed: number;
  extraHintCharged: boolean;
}

export function questionPoints({ outcome, attempt, hintsUsed, extraHintCharged }: PointsInput): number {
  if (outcome !== "correct") return 0;
  const base = attempt <= 1 ? SCORING.firstTry : SCORING.secondTry;
  const penalty = hintsUsed * SCORING.hintCost + (extraHintCharged ? SCORING.extraHintCost : 0);
  return Math.max(SCORING.minCorrect, base - penalty);
}

/** 지금 정답을 내면 받을 점수 (문제 화면 안내용) */
export function potentialPoints(attempt: number, hintsUsed: number, extraHintCharged: boolean): number {
  return questionPoints({ outcome: "correct", attempt, hintsUsed, extraHintCharged });
}

export function summarize(packId: string, records: AnswerRecord[]): PlaySummary {
  return {
    packId,
    score: records.reduce((s, r) => s + r.points, 0),
    maxScore: records.length * SCORING.firstTry,
    correctCount: records.filter((r) => r.outcome === "correct").length,
    total: records.length,
    durationMs: records.reduce((s, r) => s + r.durationMs, 0),
    records,
  };
}

/** 공유용 한 칸: 🟩 힌트 없이 한 번에 · 🟨 힌트나 두 번째 기회로 · 🟥 틀림 · ⬜ 건너뜀 */
export function recordEmoji(r: AnswerRecord): string {
  if (r.outcome === "skipped") return "⬜";
  if (r.outcome === "wrong") return "🟥";
  const clean = r.attempts.length <= 1 && r.hintsUsed === 0 && !r.extraHintCharged;
  return clean ? "🟩" : "🟨";
}

/** 1분 23초 */
export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}초`;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}

export function formatScore(n: number): string {
  return n.toLocaleString("ko-KR");
}

/** 결과 한마디 (정답률 기준) */
export function resultComment(correct: number, total: number): string {
  if (total === 0) return "";
  const rate = correct / total;
  if (rate === 1) return "전부 맞혔어요! 귀가 거의 영사기예요";
  if (rate >= 0.8) return "이 정도면 명대사 박사예요";
  if (rate >= 0.5) return "꽤 많이 알아들었어요";
  if (rate >= 0.2) return "다시 들으면 더 맞힐 수 있어요";
  return "오늘은 귀가 쉬는 날이었나 봐요";
}
