// 퀴즈 묶음 검사 — 문제를 추가·수정할 때 실수를 잡아 줘요.
// vitest(src/data/packs.test.ts)가 모든 묶음에 대해 이 검사를 돌려요.
import { acceptedAnswers } from "./answer";
import { toChosung } from "./hangul";
import type { QuizPack } from "./types";

/** 명대사는 "짧은 한 줄"만 — 보고서의 인용 원칙 */
export const MAX_LINE_LENGTH = 60;

const GAME_TYPES = new Set(["quote_tts", "song_image"]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** 문제가 있으면 사람이 읽을 수 있는 오류 문장 목록을, 없으면 빈 배열을 돌려줘요 */
export function validatePack(pack: QuizPack): string[] {
  const errors: string[] = [];
  const at = (qid: string, msg: string) => errors.push(`[${pack.id}/${qid}] ${msg}`);

  if (!isNonEmptyString(pack.id)) errors.push("묶음 id 가 비어 있어요");
  if (!isNonEmptyString(pack.title)) errors.push(`[${pack.id}] 제목이 비어 있어요`);
  if (!GAME_TYPES.has(pack.gameType)) errors.push(`[${pack.id}] 모르는 게임 종류: ${String(pack.gameType)}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pack.createdAt)) errors.push(`[${pack.id}] createdAt 은 YYYY-MM-DD 형식이어야 해요`);
  if (!Array.isArray(pack.questions) || pack.questions.length === 0) {
    errors.push(`[${pack.id}] 문제가 하나도 없어요`);
    return errors;
  }

  const ids = new Set<string>();
  const answerOwner = new Map<string, string>();

  for (const q of pack.questions) {
    if (!isNonEmptyString(q.id)) {
      errors.push(`[${pack.id}] id 없는 문제가 있어요`);
      continue;
    }
    if (ids.has(q.id)) at(q.id, "문제 id 가 겹쳐요");
    ids.add(q.id);

    if (q.gameType !== pack.gameType) at(q.id, "문제의 게임 종류가 묶음과 달라요");
    if (!isNonEmptyString(q.answer)) at(q.id, "answer 가 비어 있어요");
    if (!Array.isArray(q.aliases)) at(q.id, "aliases 는 배열이어야 해요");
    if (!Number.isInteger(q.year) || q.year < 1900 || q.year > 2100) at(q.id, `연도가 이상해요: ${q.year}`);
    if (!isNonEmptyString(q.genre)) at(q.id, "장르 힌트가 비어 있어요");
    if (!isNonEmptyString(q.sourceNote)) at(q.id, "출처 표시(sourceNote)가 비어 있어요");
    else if (!q.sourceNote.includes(String(q.year))) at(q.id, "출처 표시에 연도가 없어요");
    if (typeof q.needsReview !== "boolean") at(q.id, "needsReview(검수 필요 여부)가 없어요");
    if (isNonEmptyString(q.answer) && toChosung(q.answer).length === 0) at(q.id, "초성 힌트를 만들 수 없어요");

    // 한 답이 두 문제의 정답이 되면 안 돼요
    for (const a of acceptedAnswers(q)) {
      const owner = answerOwner.get(a);
      if (owner && owner !== q.id) at(q.id, `정답 "${a}" 가 ${owner} 와 겹쳐요`);
      answerOwner.set(a, q.id);
    }

    if (q.gameType === "quote_tts") {
      if (!isNonEmptyString(q.line)) at(q.id, "대사가 비어 있어요");
      else {
        if (/[\r\n]/.test(q.line)) at(q.id, "대사는 한 줄이어야 해요");
        if ([...q.line].length > MAX_LINE_LENGTH) at(q.id, `대사가 너무 길어요 (${MAX_LINE_LENGTH}자 이하)`);
        // 대사 안에 정답 제목이 그대로 들어 있으면 너무 쉬워요
        if (q.line.replace(/\s/g, "").includes(q.answer.replace(/\s/g, ""))) at(q.id, "대사에 정답 제목이 들어 있어요");
      }
      if (q.medium !== "movie" && q.medium !== "drama") at(q.id, "medium 은 movie 또는 drama");
    } else if (q.gameType === "song_image") {
      if (!isNonEmptyString(q.artist)) at(q.id, "가수 이름이 비어 있어요");
      if (!isNonEmptyString(q.sceneDescription)) at(q.id, "그림 설명이 비어 있어요");
      if (q.image.kind === "file" && (!isNonEmptyString(q.image.src) || !isNonEmptyString(q.image.aiModel))) {
        at(q.id, "그림 파일은 src 와 aiModel(AI 생성 표시용)이 필요해요");
      }
      if (q.image.kind === "placeholder" && !pack.sample) at(q.id, "샘플 그림은 샘플 묶음에서만 쓸 수 있어요");
    }
  }
  return errors;
}
