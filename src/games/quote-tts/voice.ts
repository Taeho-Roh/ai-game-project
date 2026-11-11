// 한국어 음성 고르기 — 기기에 깔린 "일반 TTS 음성"만 써요.
// 원칙(보고서 ② 법적 위험): 배우 목소리 복제·흉내·"OO처럼" 연출 금지. 음높이·속도로 특정인을 흉내 내지 않아요.

export interface VoiceLike {
  name: string;
  lang: string;
  default?: boolean;
  localService?: boolean;
}

/** 여성 음성으로 알려진 이름 (Windows·macOS/iOS·Chrome·Android 에서 흔한 것) */
const FEMALE_HINT =
  /(female|woman|여성|여자|heami|sunhi|jimin|seohyeon|soonbok|yujin|yuna|sora|seoyeon|google 한국의|google korean)/i;
/** 남성 음성으로 알려진 이름 — "female" 안의 male 에 걸리지 않게 단어 경계 사용 */
const MALE_HINT = /(\bmale\b|\bman\b|남성|남자|injoon|hyunsu|bongjin|gookmin|minsu)/i;
/** 더 자연스러운 음성 */
const QUALITY_HINT = /(natural|neural|premium|enhanced|online)/i;

export function isKorean(v: Pick<VoiceLike, "lang">): boolean {
  return v.lang.replace("_", "-").toLowerCase().startsWith("ko");
}

export function voiceScore(v: VoiceLike): number {
  let score = 0;
  if (FEMALE_HINT.test(v.name)) score += 10;
  if (MALE_HINT.test(v.name)) score -= 10;
  if (QUALITY_HINT.test(v.name)) score += 3;
  if (v.default) score += 1;
  return score;
}

/** 한국어 음성 중 여성 음성을 먼저, 없으면 아무 한국어 음성. 한국어가 하나도 없으면 null */
export function pickKoreanVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const ko = voices.map((v, i) => ({ v, i })).filter(({ v }) => isKorean(v));
  if (ko.length === 0) return null;
  ko.sort((a, b) => voiceScore(b.v) - voiceScore(a.v) || a.i - b.i);
  return ko[0]!.v;
}

export const RATE_OPTIONS = [
  { value: 0.8, label: "느리게" },
  { value: 1, label: "보통" },
  { value: 1.25, label: "빠르게" },
] as const;
