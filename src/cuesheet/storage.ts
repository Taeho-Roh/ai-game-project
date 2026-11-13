// 큐시트 저장 — 이 기기의 localStorage 에만 저장해요 (로그인·서버 없음).
import type { CueSheet } from "./types";

const KEY = "aigame:pd:v1:sheets";
const MAX = 20;

function store(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isSheet(v: unknown): v is CueSheet {
  if (!v || typeof v !== "object") return false;
  const s = v as Partial<CueSheet>;
  return (
    typeof s.id === "string" &&
    typeof s.startTime === "string" &&
    Array.isArray(s.segments) &&
    s.segments.every((x) => !!x && typeof x.minutes === "number" && typeof x.title === "string" && Array.isArray(x.script))
  );
}

export function loadSheets(): CueSheet[] {
  try {
    const raw = store()?.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter(isSheet) : [];
  } catch {
    return [];
  }
}

export function saveSheet(sheet: CueSheet): boolean {
  const s = store();
  if (!s) return false;
  try {
    const rest = loadSheets().filter((x) => x.id !== sheet.id);
    s.setItem(KEY, JSON.stringify([sheet, ...rest].slice(0, MAX)));
    return true;
  } catch {
    return false;
  }
}

export function getSheet(id: string): CueSheet | null {
  return loadSheets().find((s) => s.id === id) ?? null;
}

export function deleteSheet(id: string): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(loadSheets().filter((x) => x.id !== id)));
  } catch {
    /* 저장이 막혀 있으면 무시 */
  }
}
