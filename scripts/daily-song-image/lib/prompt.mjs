// 그림 프롬프트 만들기 — 우리가 쓴 분위기 설명(scene)만 사용해요.
// 가사·제목·가수 이름·연도는 프롬프트에 절대 넣지 않아요 (곡 객체에서 scene 외에는 읽지도 않아요).
import { FORBIDDEN_SCENE_WORDS, containsWord } from "./queue.mjs";

export const STYLE_LINE =
  "Soft painterly digital illustration, one cohesive color palette, atmospheric lighting, wide simple composition that reads clearly at small size.";

/** 항상 붙는 안전 규칙: 글자 없음 · 실존 인물/얼굴 없음 · 기존 앨범 표지/영상 모방 금지 */
export const SAFETY_RULES = [
  "The image must contain no text at all: no letters, no numbers, no signs, no logos, no watermarks, no captions.",
  "No real people, no faces, no celebrity or performer likeness. If a figure appears it must be a tiny anonymous silhouette seen from far away.",
  "Do not imitate any existing album cover, poster, music video frame or copyrighted artwork. Original composition only.",
];

export function buildImagePrompt(song) {
  const scene = song.scene; // 이 필드만 읽어요
  if (typeof scene !== "string" || !scene.trim()) throw new Error("scene(분위기 설명)이 비어 있어요");
  for (const w of FORBIDDEN_SCENE_WORDS) {
    if (containsWord(scene, w)) throw new Error(`분위기 설명에 금지어가 있어요: "${w}"`);
  }
  return [
    `Create a single square illustration that conveys this mood and scene: ${scene.trim()}`,
    `Style: ${STYLE_LINE}`,
    ...SAFETY_RULES,
  ].join("\n");
}
