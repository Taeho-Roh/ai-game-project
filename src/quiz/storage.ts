// 내 기록 저장 — 서버 없이 이 기기의 localStorage 에만 저장해요 (DB 쓰기 없음).
import type { PlaySummary } from "./types";

const PREFIX = "aigame:v1:";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface BestRecord {
  score: number;
  correctCount: number;
  total: number;
  durationMs: number;
  playedAt: string;
}

/** 사생활 보호 모드 등에서 localStorage 가 막혀 있으면 null */
export function browserStore(): KeyValueStore | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(store: KeyValueStore | null, key: string): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(store: KeyValueStore | null, key: string, value: unknown): void {
  if (!store) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 공간이 꽉 찼거나 막혀 있으면 조용히 넘어가요 — 게임은 계속 돼요.
  }
}

/** 점수가 높을수록, 같으면 빨리 끝낼수록 좋은 기록 */
export function isBetter(next: Pick<BestRecord, "score" | "durationMs">, prev: Pick<BestRecord, "score" | "durationMs"> | null): boolean {
  if (!prev) return true;
  if (next.score !== prev.score) return next.score > prev.score;
  return next.durationMs < prev.durationMs;
}

export function loadBest(packId: string, store: KeyValueStore | null = browserStore()): BestRecord | null {
  const v = read<BestRecord>(store, `best:${packId}`);
  return v && typeof v.score === "number" ? v : null;
}

export function saveIfBest(
  summary: PlaySummary,
  store: KeyValueStore | null = browserStore(),
  now: Date = new Date(),
): { isNewBest: boolean; previous: BestRecord | null } {
  const previous = loadBest(summary.packId, store);
  const candidate: BestRecord = {
    score: summary.score,
    correctCount: summary.correctCount,
    total: summary.total,
    durationMs: summary.durationMs,
    playedAt: now.toISOString(),
  };
  const isNewBest = isBetter(candidate, previous);
  if (isNewBest) write(store, `best:${summary.packId}`, candidate);
  return { isNewBest, previous };
}

export function loadPlayCount(packId: string, store: KeyValueStore | null = browserStore()): number {
  return read<number>(store, `plays:${packId}`) ?? 0;
}

export function incrementPlayCount(packId: string, store: KeyValueStore | null = browserStore()): number {
  const next = loadPlayCount(packId, store) + 1;
  write(store, `plays:${packId}`, next);
  return next;
}

/** 음성 속도 같은 작은 설정 */
export function loadSetting<T>(key: string, fallback: T, store: KeyValueStore | null = browserStore()): T {
  return read<T>(store, `setting:${key}`) ?? fallback;
}

export function saveSetting(key: string, value: unknown, store: KeyValueStore | null = browserStore()): void {
  write(store, `setting:${key}`, value);
}
