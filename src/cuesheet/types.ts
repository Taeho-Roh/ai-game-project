// 나의PD 큐시트 — 자료 모양. 서버 없이 이 기기에만 저장해요.
export type EventKind = "dinner" | "workshop" | "club" | "family" | "live";
export type Mood = "lively" | "calm" | "compete";
export type SegmentKind = "open" | "ice" | "game" | "quiz" | "break" | "close";

export interface Segment {
  id: string;
  kind: SegmentKind;
  title: string;
  /** 분 단위, 1 이상 정수 */
  minutes: number;
  /** 진행 멘트 (2~4줄) */
  script: string[];
  /** 효과음·자막 신호 — 곡 이름 없이 분위기 키워드만 */
  cue: string;
  props: string[];
  /** 비상 대안(플랜 B) */
  planB: string;
}

export interface CueSheet {
  id: string;
  title: string;
  /** "HH:MM" 24시간 */
  startTime: string;
  people: number;
  eventKind: EventKind;
  mood: Mood;
  /** 처음 요청한 총 시간(분). 편집하면 segments 합계가 실제 총 시간이에요. */
  requestedMinutes: number;
  includeQuiz: boolean;
  segments: Segment[];
  createdAt: string;
}

export interface CueInput {
  eventKind: EventKind;
  people: number;
  totalMinutes: number;
  mood: Mood;
  startTime: string;
  includeQuiz: boolean;
}

export const EVENT_LABEL: Record<EventKind, string> = {
  dinner: "회식",
  workshop: "워크숍",
  club: "동아리·학교 행사",
  family: "가족 모임",
  live: "라이브 방송",
};
export const MOOD_LABEL: Record<Mood, string> = { lively: "신나게", calm: "차분하게", compete: "승부욕 자극" };
export const MIN_TOTAL = 30;
export const MAX_TOTAL = 240;
