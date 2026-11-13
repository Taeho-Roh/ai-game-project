import type { Segment } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

/** "19:30" + 45 → "20:15" (자정을 넘으면 다음 날로 이어서 계산) */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export interface ScheduledSegment extends Segment {
  start: string;
  end: string;
}

/** 코너 순서·시간이 바뀌어도 시각은 항상 여기서 다시 계산해요 */
export function schedule(segments: Segment[], startTime: string): ScheduledSegment[] {
  let cursor = startTime;
  return segments.map((s) => {
    const start = cursor;
    cursor = addMinutes(cursor, s.minutes);
    return { ...s, start, end: cursor };
  });
}

export function totalMinutes(segments: Segment[]): number {
  return segments.reduce((sum, s) => sum + s.minutes, 0);
}

/** 퀴즈 라운드 시간: 문제당 초 × 문제 수 + 설명 시간 → 올림한 분 */
export function quizMinutes(questions: number, secondsPerQuestion = 40, introMinutes = 2): number {
  return Math.ceil((questions * secondsPerQuestion) / 60) + introMinutes;
}

export function moveSegment(segments: Segment[], index: number, dir: -1 | 1): Segment[] {
  const to = index + dir;
  if (index < 0 || to < 0 || to >= segments.length) return segments;
  const next = segments.slice();
  const [item] = next.splice(index, 1);
  next.splice(to, 0, item!);
  return next;
}

export function setMinutes(segments: Segment[], index: number, minutes: number): Segment[] {
  const m = Math.max(1, Math.min(180, Math.round(minutes)));
  return segments.map((s, i) => (i === index ? { ...s, minutes: m } : s));
}

export function formatClock(seconds: number): string {
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(Math.round(seconds));
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
