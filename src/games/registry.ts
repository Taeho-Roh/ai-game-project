// 게임 종류 목록 — 공통 뼈대(목록·문제·힌트·채점·결과)는 그대로 두고, 게임마다 다른 부분만 여기에 적어요.
// 새 게임 종류를 붙이려면: quiz/types.ts 에 문제 타입 추가 → 여기 메타 추가 → games/GameMedia.tsx 에 화면 추가.
import type { GameTypeId, Question } from "@/quiz/types";

export interface GameTypeMeta {
  id: GameTypeId;
  /** 전체 이름 */
  label: string;
  /** 카드·칩에 쓰는 짧은 이름 */
  shortLabel: string;
  /** 정답 입력칸 이름 (label 요소) */
  inputLabel: string;
  inputPlaceholder: string;
  /** 게임별 추가 힌트 */
  extraHint: { label: string; revealedLabel: string };
  /** AI 사용 표시 */
  aiLabel: string;
  /** 시작 화면 "이렇게 해요" — 실제 진행 순서 */
  howTo: string[];
}

export const GAME_TYPES: Record<GameTypeId, GameTypeMeta> = {
  quote_tts: {
    id: "quote_tts",
    label: "명대사 듣고 작품 맞히기",
    shortLabel: "명대사 듣기",
    inputLabel: "어느 작품의 대사일까요?",
    inputPlaceholder: "작품 제목을 입력해요",
    extraHint: { label: "대사 보기", revealedLabel: "대사" },
    aiLabel: "AI·TTS 음성",
    howTo: [
      "AI 음성이 짧은 대사 한 줄을 읽어 줘요. 몇 번이든 다시 들을 수 있어요.",
      "어느 영화·드라마인지 제목을 입력해요. 띄어쓰기·영어 제목·줄임말도 괜찮아요.",
      "기회는 문제마다 2번. 막히면 힌트(초성 → 연도 → 장르)를 열어요.",
    ],
  },
  song_image: {
    id: "song_image",
    label: "그림 보고 노래 맞히기",
    shortLabel: "노래 그림",
    inputLabel: "어떤 노래일까요?",
    inputPlaceholder: "노래 제목을 입력해요",
    extraHint: { label: "그림 설명 보기", revealedLabel: "그림 설명" },
    aiLabel: "AI 생성 그림",
    howTo: [
      "노래 분위기를 그린 그림 한 장을 봐요. 가사는 쓰지 않아요.",
      "노래 제목을 입력해요. 띄어쓰기·영어 제목도 괜찮아요.",
      "기회는 문제마다 2번. 막히면 힌트(초성 → 연도 → 장르)를 열어요.",
    ],
  },
};

/** 정답 공개 때 제목 아래 한 줄 — "영화 · 2003년", "SBS 드라마 · 1995년", "버스커 버스커 · 2012년" */
export function revealSubtitle(q: Question): string {
  if (q.gameType === "quote_tts") {
    const kind = q.medium === "movie" ? "영화" : q.channel ? `${q.channel} 드라마` : "드라마";
    return `${kind} · ${q.year}년 · ${q.genre}`;
  }
  return `${q.artist} · ${q.year}년 · ${q.genre}`;
}

export function displayTitle(q: Question): string {
  return q.officialTitle ?? q.answer;
}
