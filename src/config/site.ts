// 사이트 이름·문구 — 이름과 도메인이 정해지면 여기만 고치면 돼요.
export const SITE = {
  /** 가칭. 정식 이름은 대표 결정 사항 */
  name: "맞혀볼래?",
  tagline: "듣고, 보고, 맞히는 AI 퀴즈",
  /** 공유 문구에 붙는 주소. 도메인이 정해지기 전에는 지금 열린 주소를 써요. */
  url(): string {
    if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    return "";
  },
} as const;
