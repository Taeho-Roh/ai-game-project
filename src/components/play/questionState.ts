export type Feedback = null | "empty" | "wrong" | "near";

/** 문제 하나를 푸는 동안의 상태 */
export interface QuestionState {
  attempts: string[];
  hintsUsed: number;
  extraHintUsed: boolean;
  extraHintCharged: boolean;
  startedAt: number;
  playCount: number;
  feedback: Feedback;
  /** 틀릴 때마다 바뀜 — 흔들기 애니메이션 다시 틀기 */
  shakeKey: number;
}

export function freshQuestionState(): QuestionState {
  return {
    attempts: [],
    hintsUsed: 0,
    extraHintUsed: false,
    extraHintCharged: false,
    startedAt: Date.now(),
    playCount: 0,
    feedback: null,
    shakeKey: 0,
  };
}
