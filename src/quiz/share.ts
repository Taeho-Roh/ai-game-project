// 결과 공유 문구 — 카카오톡·문자에 붙여 넣기 좋게 짧게.
import { formatDuration, formatScore, recordEmoji } from "./scoring";
import type { PlaySummary } from "./types";

export interface ShareTextInput {
  siteName: string;
  gameLabel: string;
  packTitle: string;
  summary: PlaySummary;
  url?: string;
}

/** 이모지 칸을 5개씩 끊어서 여러 줄로 */
export function emojiGrid(summary: PlaySummary, perRow = 5): string {
  const cells = summary.records.map(recordEmoji);
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += perRow) rows.push(cells.slice(i, i + perRow).join(""));
  return rows.join("\n");
}

export function buildShareText({ siteName, gameLabel, packTitle, summary, url }: ShareTextInput): string {
  const lines = [
    `${siteName} · ${gameLabel}`,
    `「${packTitle}」 ${summary.total}문제 중 ${summary.correctCount}개 정답!`,
    `${formatScore(summary.score)}점 · ${formatDuration(summary.durationMs)}`,
    emojiGrid(summary),
  ];
  if (url) lines.push(url);
  return lines.join("\n");
}
