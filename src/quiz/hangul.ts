// 한글 초성 뽑기 — 힌트용 (예: "범죄와의 전쟁" → "ㅂㅈㅇㅇ ㅈㅈ")

const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const HANGUL_START = 0xac00; // 가
const HANGUL_END = 0xd7a3; // 힣
const PER_CHOSUNG = 21 * 28; // 중성 21 × 종성 28

export function isHangulSyllable(ch: string): boolean {
  const code = ch.codePointAt(0);
  return code !== undefined && code >= HANGUL_START && code <= HANGUL_END;
}

/** 글자 하나의 초성. 한글 음절이 아니면 null */
export function chosungOf(ch: string): string | null {
  if (!isHangulSyllable(ch)) return null;
  const code = ch.codePointAt(0)!;
  return CHOSUNG[Math.floor((code - HANGUL_START) / PER_CHOSUNG)] ?? null;
}

/**
 * 제목을 초성 힌트로 바꿔요.
 * - 한글 음절 → 초성
 * - 영문·숫자 → 그대로 (예: "SKY 캐슬" → "SKY ㅋㅅ")
 * - 문장부호·기호는 빼고, 띄어쓰기는 한 칸으로 남겨요 (몇 단어인지도 힌트)
 */
export function toChosung(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const cho = chosungOf(ch);
    if (cho) out += cho;
    else if (/\s/u.test(ch)) out += " ";
    else if (/[\p{L}\p{N}]/u.test(ch)) out += ch;
    // 그 밖의 문장부호·기호는 버림
  }
  return out.replace(/\s+/g, " ").trim();
}
