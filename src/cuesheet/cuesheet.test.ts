import { describe, expect, it } from "vitest";
import { generateCueSheet, validateInput } from "./generate";
import { addMinutes, moveSegment, quizMinutes, schedule, setMinutes, totalMinutes } from "./time";
import type { CueInput, EventKind, Mood } from "./types";

const base: CueInput = { eventKind: "dinner", people: 8, totalMinutes: 90, mood: "lively", startTime: "19:00", includeQuiz: true };

describe("시간 계산", () => {
  it("자정을 넘겨도 시각이 맞아요", () => {
    expect(addMinutes("23:30", 45)).toBe("00:15");
    expect(addMinutes("00:10", -20)).toBe("23:50");
  });
  it("퀴즈 10문제 × 40초 + 설명 2분 = 9분", () => {
    expect(quizMinutes(10)).toBe(9);
  });
  it("순서를 바꾸면 시각이 다시 계산돼요", () => {
    const sheet = generateCueSheet(base);
    const before = schedule(sheet.segments, "19:00");
    const moved = moveSegment(sheet.segments, 1, 1);
    const after = schedule(moved, "19:00");
    expect(after[0]!.start).toBe("19:00");
    expect(after.at(-1)!.end).toBe(before.at(-1)!.end);
    expect(after[1]!.title).toBe(before[2]!.title);
  });
  it("끝과 처음에서는 더 못 움직여요", () => {
    const sheet = generateCueSheet(base);
    expect(moveSegment(sheet.segments, 0, -1)).toBe(sheet.segments);
  });
  it("시간 조정은 1분 이상으로 고정돼요", () => {
    const sheet = generateCueSheet(base);
    expect(setMinutes(sheet.segments, 0, 0)[0]!.minutes).toBe(1);
  });
});

describe("큐시트 생성", () => {
  it("모든 조합에서 시간 합계가 총 시간과 정확히 같아요", () => {
    const events: EventKind[] = ["dinner", "workshop", "club", "family", "live"];
    const moods: Mood[] = ["lively", "calm", "compete"];
    for (const eventKind of events)
      for (const mood of moods)
        for (const people of [2, 5, 12, 60])
          for (const totalMinutes of [30, 31, 45, 60, 89, 90, 120, 180, 240])
            for (const includeQuiz of [true, false]) {
              const s = generateCueSheet({ eventKind, mood, people, totalMinutes, includeQuiz, startTime: "18:00" });
              expect(totalMinutes === totalMinutes && s.segments.reduce((a, x) => a + x.minutes, 0)).toBe(totalMinutes);
              expect(s.segments[0]!.kind).toBe("open");
              expect(s.segments.at(-1)!.kind).toBe("close");
              expect(s.segments.every((x) => x.minutes >= 1 && x.script.length >= 2 && x.planB.length > 0)).toBe(true);
            }
  });
  it("90분 이상이면 휴식이 들어가요", () => {
    expect(generateCueSheet(base).segments.some((s) => s.kind === "break")).toBe(true);
    expect(generateCueSheet({ ...base, totalMinutes: 60 }).segments.some((s) => s.kind === "break")).toBe(false);
  });
  it("퀴즈를 켜면 9분짜리 라운드가 들어가요", () => {
    const q = generateCueSheet(base).segments.find((s) => s.kind === "quiz");
    expect(q?.minutes).toBe(9);
  });
  it("라이브에는 퀴즈 연동 없이 시청자 코너가 나와요", () => {
    const s = generateCueSheet({ ...base, eventKind: "live", totalMinutes: 60 });
    expect(s.segments.some((x) => x.kind === "quiz")).toBe(false);
    expect(s.segments.some((x) => x.title.includes("시청자"))).toBe(true);
  });
  it("음주·곡 이름이 들어가지 않아요", () => {
    const text = JSON.stringify(generateCueSheet({ ...base, totalMinutes: 180 }).segments);
    expect(text).not.toMatch(/폭탄주|원샷|벌주|술/);
  });
  it("잘못된 입력은 막아요", () => {
    expect(validateInput({ ...base, people: 1 })).not.toBeNull();
    expect(validateInput({ ...base, totalMinutes: 20 })).not.toBeNull();
    expect(validateInput({ ...base, startTime: "25:00" })).not.toBeNull();
    expect(() => generateCueSheet({ ...base, totalMinutes: 500 })).toThrow();
  });
  it("편집 뒤 합계가 달라져도 총 시간은 코너 합계예요", () => {
    const s = generateCueSheet(base);
    expect(totalMinutes(setMinutes(s.segments, 1, 20))).not.toBe(90);
  });
});
