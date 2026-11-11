// 공통 퀴즈 뼈대의 데이터 구조.
// 보고서(2026-10-30) 초안의 QZ_packs / QZ_questions 와 같은 모양으로 맞춰 두었어요.
// 지금은 src/data/*.json 정적 파일이지만, 나중에 Supabase 로 옮길 때 필드 이름을 그대로 쓰면 됩니다.

export type GameTypeId = "quote_tts" | "song_image";

/** 모든 게임 종류가 공통으로 갖는 문제 필드 */
export interface QuestionBase {
  id: string;
  /** 정답으로 쓰는 대표 이름. 초성 힌트도 이 이름으로 만들어요. */
  answer: string;
  /** 정답 공개 때 보여 줄 공식 제목. 없으면 answer 를 써요. */
  officialTitle?: string;
  /** 정답으로 인정할 다른 이름(줄임말·영어 제목 등) */
  aliases: string[];
  /** 개봉·방영·발매 연도 */
  year: number;
  /** 장르 힌트 */
  genre: string;
  /** 정답 공개 때 출처 표시 — 예: "영화 〈올드보이〉(2003)" */
  sourceNote: string;
  /** 사람이 사실 확인(대사·제목·연도)을 마치기 전에는 true. 출시 전 전부 false 가 되어야 해요. */
  needsReview: boolean;
}

/** 명대사 TTS — 대사 한 줄을 기기 내장 음성(일반 TTS)으로 읽어 주고 작품을 맞혀요 */
export interface QuoteTtsQuestion extends QuestionBase {
  gameType: "quote_tts";
  medium: "movie" | "drama";
  /** 화면에 보여 줄 대사 (반드시 한 줄, 짧게) */
  line: string;
  /** TTS 가 읽을 글. 숫자 읽기처럼 발음을 고쳐야 할 때만 씀. 없으면 line */
  speakText?: string;
  /** 드라마 방송사·플랫폼 */
  channel?: string;
}

/** 샘플·실제 그림 */
export type QuizImage =
  | {
      /** 샘플용 — 코드로 그린 SVG 장면 (실제 앨범 아트·AI 그림 아님) */
      kind: "placeholder";
      scene: PlaceholderScene;
    }
  | {
      /** 실제 출시용 — AI 로 만들고 사람이 고른 그림 파일 (R2 등) */
      kind: "file";
      src: string;
      alt: string;
      /** 만든 AI 모델 이름 (AI 생성 표시용) */
      aiModel: string;
    };

export type SceneObject = "road" | "lamps" | "moon" | "sun" | "plate" | "hills" | "city" | "fruits" | "sea";
export type SceneParticle = "petal" | "snow" | "star" | "confetti" | "rain";

export interface PlaceholderScene {
  /** 하늘 위·아래 색 */
  sky: [string, string];
  objects: SceneObject[];
  particles?: { kind: SceneParticle; color: string; count: number };
  /** 같은 숫자면 언제나 같은 그림 */
  seed: number;
}

/** 노래 → AI 그림 → 제목 맞히기 (2순위, 지금은 샘플만) */
export interface SongImageQuestion extends QuestionBase {
  gameType: "song_image";
  artist: string;
  /** 우리가 직접 쓴 분위기 설명. 가사를 넣지 않아요. 그림 프롬프트 겸 힌트. */
  sceneDescription: string;
  image: QuizImage;
  /** 공식 뮤직비디오·음원 링크 (실제 문제에서 채움) */
  officialLink?: string;
}

export type Question = QuoteTtsQuestion | SongImageQuestion;

interface PackBase {
  id: string;
  title: string;
  description: string;
  /** 처음 공개한 날 (최신순 정렬) */
  createdAt: string;
  /**
   * 인기순 정렬용 임시 순위(작을수록 위). 서버 플레이 수가 생기기 전까지 운영자가 정해요.
   * 가짜 플레이 수를 보여 주지 않으려고 숫자 대신 순위만 둬요.
   */
  editorRank: number;
  /** 샘플 묶음이면 true — 목록·문제 화면에 "샘플" 표시 */
  sample?: boolean;
  tags: string[];
}

export interface QuotePack extends PackBase {
  gameType: "quote_tts";
  questions: QuoteTtsQuestion[];
}

export interface SongImagePack extends PackBase {
  gameType: "song_image";
  questions: SongImageQuestion[];
}

export type QuizPack = QuotePack | SongImagePack;

/** 힌트 사다리 (공통): 초성 → 연도 → 장르 */
export type CommonHintId = "chosung" | "year" | "genre";

export type Outcome = "correct" | "wrong" | "skipped";

/** 문제 하나를 푼 기록 */
export interface AnswerRecord {
  questionId: string;
  outcome: Outcome;
  /** 사용자가 낸 답들 (최대 2번) */
  attempts: string[];
  /** 공통 힌트를 몇 개 열었는지 (0~3) */
  hintsUsed: number;
  /** 게임별 추가 힌트(대사 보기·그림 설명)를 열었는지 */
  extraHintUsed: boolean;
  /** 추가 힌트 감점을 했는지 (한국어 음성이 없어 자동으로 보여 준 경우는 감점 안 함) */
  extraHintCharged: boolean;
  points: number;
  /** 문제를 보고 답할 때까지 걸린 시간 */
  durationMs: number;
}

export interface PlaySummary {
  packId: string;
  score: number;
  maxScore: number;
  correctCount: number;
  total: number;
  durationMs: number;
  records: AnswerRecord[];
}
