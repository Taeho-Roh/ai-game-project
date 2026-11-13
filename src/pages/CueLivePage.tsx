import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pause, Play, SkipForward, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSheet, saveSheet } from "@/cuesheet/storage";
import { formatClock, schedule } from "@/cuesheet/time";
import type { CueSheet } from "@/cuesheet/types";
import { cn } from "@/lib/utils";

/** 진행 모드 — 진행 중에는 서버·AI를 부르지 않아서 인터넷이 끊겨도 돼요 */
export default function CueLivePage() {
  const { sheetId = "" } = useParams();
  const [sheet, setSheet] = useState<CueSheet | null>(() => getSheet(sheetId));
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const lastTick = useRef<number | null>(null);

  const rows = useMemo(() => (sheet ? schedule(sheet.segments, sheet.startTime) : []), [sheet]);
  const current = rows[index];

  // 시간 흐름: 시계가 아니라 실제 경과 시간으로 세요 (탭이 잠깐 멈춰도 어긋나지 않게)
  useEffect(() => {
    if (!running) {
      lastTick.current = null;
      return;
    }
    lastTick.current = Date.now();
    const t = window.setInterval(() => {
      const now = Date.now();
      setElapsed((e) => e + (now - (lastTick.current ?? now)) / 1000);
      lastTick.current = now;
    }, 250);
    return () => window.clearInterval(t);
  }, [running]);

  // 화면 꺼짐 방지 (지원하는 브라우저에서만)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (running && nav.wakeLock) nav.wakeLock.request("screen").then((l) => (lock = l)).catch(() => undefined);
    return () => {
      void lock?.release().catch(() => undefined);
    };
  }, [running]);

  if (!sheet || !current) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-10 text-center">
        <p className="font-bold">이 기기에서 큐시트를 찾지 못했어요.</p>
        <Link to="/pd" className={cn(buttonVariants(), "mt-4")}>
          새로 만들기
        </Link>
      </div>
    );
  }

  const remaining = current.minutes * 60 - elapsed;
  const over = remaining < 0;
  const next = rows[index + 1];
  const isLast = index === rows.length - 1;

  const go = (to: number) => {
    setIndex(Math.max(0, Math.min(rows.length - 1, to)));
    setElapsed(0);
  };
  const addFive = () => {
    const segments = sheet.segments.map((s, i) => (i === index ? { ...s, minutes: s.minutes + 5 } : s));
    const updated = { ...sheet, segments };
    setSheet(updated);
    saveSheet(updated);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-ink px-4 py-4 text-paper">
      <div className="flex items-center justify-between text-sm">
        <Link to={`/pd/${sheet.id}`} className="font-bold underline underline-offset-4">
          ← 큐시트로
        </Link>
        <span aria-live="polite" className="font-bold text-paper/70">
          {index + 1} / {rows.length} · {current.start}–{current.end}
        </span>
      </div>

      <h1 className="mt-4 text-center text-2xl font-extrabold">{current.title}</h1>
      <p
        role="timer"
        aria-label="남은 시간"
        className={cn("mt-2 text-center font-mono text-[84px] font-extrabold leading-none tabular-nums", over && "text-red-400")}
      >
        {formatClock(remaining)}
      </p>
      {over && <p className="mt-1 text-center text-sm font-bold text-red-300">정해진 시간을 넘겼어요</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button variant="outline" size="lg" onClick={() => setRunning((r) => !r)} aria-label={running ? "일시정지" : "시작"}>
          {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
        <Button variant="outline" size="lg" onClick={addFive} aria-label="5분 더 쓰기">
          <Plus aria-hidden="true" />5분
        </Button>
        <Button variant="default" size="lg" disabled={isLast} onClick={() => go(index + 1)} aria-label="다음 코너로">
          <SkipForward aria-hidden="true" />
        </Button>
      </div>

      <section className="mt-5 rounded-2xl bg-white/10 p-4" aria-label="지금 멘트">
        <h2 className="mb-2 text-sm font-bold text-paper/70">지금 멘트</h2>
        <ul className="space-y-2 text-[19px] leading-snug">
          {current.script.map((line, i) => (
            <li key={i}>“{line}”</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-paper/70">
          <b>효과음·자막:</b> {current.cue}
        </p>
        <p className="mt-1 text-sm text-paper/70">
          <b>플랜 B:</b> {current.planB}
        </p>
      </section>

      {current.kind === "quiz" && (
        <Link to="/" target="_blank" className={cn(buttonVariants({ size: "lg" }), "mt-3")}>
          이 라운드 시작 (퀴즈 열기)
        </Link>
      )}

      <p className="mt-auto pt-5 text-center text-sm text-paper/70" aria-live="polite">
        {next ? (
          <>
            다음 코너 · <b>{next.title}</b> ({next.start})
          </>
        ) : (
          "마지막 코너예요. 수고하셨어요!"
        )}
      </p>
      <div className="mt-2 flex justify-between">
        <Button variant="ghost" size="sm" className="text-paper" disabled={index === 0} onClick={() => go(index - 1)}>
          이전 코너
        </Button>
      </div>
    </div>
  );
}
