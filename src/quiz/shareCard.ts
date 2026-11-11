// 결과 공유 카드 이미지 (1080×1350, 인스타·카톡 세로 비율) — 브라우저 canvas 로 그려요. 서버 없음.
import { formatDuration, formatScore, recordEmoji, resultComment } from "./scoring";
import type { PlaySummary } from "./types";

export interface ShareCardInput {
  siteName: string;
  gameLabel: string;
  aiLabel: string;
  packTitle: string;
  summary: PlaySummary;
  url: string;
}

const W = 1080;
const H = 1350;
const INK = "#17142B";
const PAPER = "#F4F2FA";
const CAPTION = "#FFD83D";
const SCREEN = "#100E1F";
const DISPLAY = `"Black Han Sans", "Pretendard Variable", "Malgun Gothic", sans-serif`;
const BODY = `"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

const CELL_COLOR: Record<string, string> = {
  "🟩": "#23C99A",
  "🟨": CAPTION,
  "🟥": "#FF4F8B",
  "⬜": "#D9D4E8",
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 예능 자막처럼: 두꺼운 먹색 테두리 → 비스듬한 그림자 → 채움 */
function captionText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string) {
  ctx.font = `${size}px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.2;
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.strokeText(text, x + size * 0.05, y + size * 0.07);
  ctx.fillText(text, x + size * 0.05, y + size * 0.07);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, weight: string, start: number, maxWidth: number): number {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1500));
  const loads = Promise.all([
    document.fonts.load(`180px "Black Han Sans"`, "0123456789점정답땡"),
    document.fonts.load(`700 44px "Pretendard Variable"`, "가나다라문제정답"),
  ]).then(() => undefined);
  await Promise.race([loads.catch(() => undefined), timeout]);
}

export function drawShareCard(ctx: CanvasRenderingContext2D, input: ShareCardInput): void {
  const { summary } = input;

  // 바탕
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 로고
  roundRect(ctx, 72, 64, 64, 64, 16);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = CAPTION;
  roundRect(ctx, 82, 106, 44, 12, 3);
  ctx.fill();
  ctx.fillStyle = PAPER;
  [[86, 84, 14], [96, 76, 22], [106, 82, 16], [116, 72, 26]].forEach(([x, y, h]) => {
    roundRect(ctx, x!, y!, 6, h!, 3);
    ctx.fill();
  });
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = `52px ${DISPLAY}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.strokeText(input.siteName, 156, 116);
  ctx.fillStyle = CAPTION;
  ctx.fillText(input.siteName, 156, 116);
  ctx.restore();

  ctx.font = `600 30px ${BODY}`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(23,20,43,0.6)";
  ctx.fillText(input.gameLabel, W - 72, 108);

  // 극장 화면
  const sx = 60;
  const sy = 168;
  const sw = W - 120;
  const sh = 540;
  roundRect(ctx, sx, sy, sw, sh, 48);
  ctx.fillStyle = SCREEN;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // AI 표시
  ctx.font = `700 26px ${BODY}`;
  ctx.textAlign = "left";
  const badge = input.aiLabel;
  const bw = ctx.measureText(badge).width + 40;
  roundRect(ctx, sx + 32, sy + 32, bw, 48, 24);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(badge, sx + 52, sy + 65);

  // 파형 (정적)
  const bars = 36;
  const barW = 12;
  const gap = 8;
  const totalW = bars * barW + (bars - 1) * gap;
  const bx = (W - totalW) / 2;
  const midY = sy + 250;
  for (let i = 0; i < bars; i++) {
    const env = Math.sin((Math.PI * (i + 0.5)) / bars);
    const wobble = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + summary.score * 0.01));
    const h = 24 + env * wobble * 190;
    ctx.fillStyle = i % 3 === 0 ? CAPTION : "rgba(255,255,255,0.75)";
    roundRect(ctx, bx + i * (barW + gap), midY - h / 2, barW, h, 6);
    ctx.fill();
  }

  // 자막처럼 묶음 이름
  const subtitle = `「${input.packTitle}」`;
  const subSize = fitFont(ctx, subtitle, BODY, "700", 48, sw - 120);
  ctx.font = `700 ${subSize}px ${BODY}`;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(subtitle, W / 2, sy + sh - 120);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  // 점수 — 화면 아래 모서리에 걸친 예능 자막
  const scoreText = `${formatScore(summary.score)}점`;
  const scoreSize = Math.min(190, fitFont(ctx, scoreText, DISPLAY, "", 190, W - 160));
  captionText(ctx, scoreText, W / 2, sy + sh + 90, scoreSize, CAPTION);

  // 요약
  ctx.font = `800 46px ${BODY}`;
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.fillText(`${summary.total}문제 중 ${summary.correctCount}개 정답 · ${formatDuration(summary.durationMs)}`, W / 2, 900);

  // 칸
  const cells = summary.records.map(recordEmoji);
  const perRow = cells.length <= 8 ? Math.max(1, cells.length) : Math.ceil(cells.length / 2);
  const cell = 64;
  const cgap = 14;
  cells.forEach((c, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rowCount = Math.min(perRow, cells.length - row * perRow);
    const rowW = rowCount * cell + (rowCount - 1) * cgap;
    const x = (W - rowW) / 2 + col * (cell + cgap);
    const y = 960 + row * (cell + cgap);
    roundRect(ctx, x, y, cell, cell, 14);
    ctx.fillStyle = CELL_COLOR[c] ?? "#D9D4E8";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
  });

  // 한마디
  ctx.font = `600 36px ${BODY}`;
  ctx.fillStyle = "rgba(23,20,43,0.75)";
  ctx.fillText(resultComment(summary.correctCount, summary.total), W / 2, 1200);

  // 바닥
  ctx.strokeStyle = "rgba(23,20,43,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, 1250);
  ctx.lineTo(W - 72, 1250);
  ctx.stroke();
  ctx.font = `600 28px ${BODY}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(23,20,43,0.55)";
  ctx.fillText(input.url.replace(/^https?:\/\//, ""), 72, 1300);
  ctx.textAlign = "right";
  ctx.fillText("너도 맞혀볼래?", W - 72, 1300);
}

export async function renderShareCard(input: ShareCardInput): Promise<{ dataUrl: string; blob: Blob | null }> {
  await ensureFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 를 쓸 수 없어요");
  drawShareCard(ctx, input);
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  return { dataUrl, blob };
}
