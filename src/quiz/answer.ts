// 정답 채점 — 띄어쓰기·문장부호·대소문자를 무시하고, 여러 이름(별칭)을 정답으로 인정해요.
import type { QuestionBase } from "./types";

/**
 * 비교용으로 글자를 정리해요.
 * 1) NFKC 정규화 (전각 문자·호환 문자 정리)  2) 소문자  3) 글자·숫자만 남김 (띄어쓰기·문장부호·기호 제거)
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** 괄호 안 내용을 뺀 글 — "기생충 (2019)", "곡성(哭聲)" 같은 입력도 받아 주려고 */
export function stripBracketed(text: string): string {
  return text.replace(/[(（[［〔【<〈《「『][^)）\]］〕】>〉》」』]*[)）\]］〕】>〉》」』]/gu, " ");
}

/** 사용자가 낸 답에서 비교할 후보들 (빈 값 제외) */
export function answerCandidates(input: string): string[] {
  const set = new Set<string>();
  for (const v of [normalizeAnswer(input), normalizeAnswer(stripBracketed(input))]) {
    if (v) set.add(v);
  }
  return [...set];
}

/** 이 문제에서 정답으로 인정하는 이름 전부 (정리된 형태) */
export function acceptedAnswers(q: Pick<QuestionBase, "answer" | "officialTitle" | "aliases">): Set<string> {
  const names = [q.answer, q.officialTitle ?? "", ...q.aliases];
  const set = new Set<string>();
  for (const name of names) {
    for (const c of answerCandidates(name)) set.add(c);
  }
  return set;
}

export function isCorrectAnswer(
  input: string,
  q: Pick<QuestionBase, "answer" | "officialTitle" | "aliases">,
): boolean {
  const accepted = acceptedAnswers(q);
  return answerCandidates(input).some((c) => accepted.has(c));
}

/** 두 글자열의 편집 거리 (글자 넣기·빼기·바꾸기 횟수) */
export function editDistance(a: string, b: string): number {
  const A = [...a];
  const B = [...b];
  let prev = Array.from({ length: B.length + 1 }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[B.length]!;
}

/**
 * "아까워요!" 안내용 — 정답은 아니지만 한두 글자 차이일 때.
 * 채점은 바꾸지 않아요(오타를 정답으로 치면 "범죄도시2"와 "범죄도시3"이 같아져요).
 */
export function isNearMiss(
  input: string,
  q: Pick<QuestionBase, "answer" | "officialTitle" | "aliases">,
): boolean {
  if (isCorrectAnswer(input, q)) return false;
  const accepted = [...acceptedAnswers(q)];
  return answerCandidates(input).some((c) =>
    accepted.some((a) => {
      const len = Math.max([...a].length, [...c].length);
      if (len < 3) return false;
      const limit = len >= 8 ? 2 : 1;
      return editDistance(c, a) <= limit;
    }),
  );
}
