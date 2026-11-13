import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Play, Printer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSheet, saveSheet } from "@/cuesheet/storage";
import { isValidTime, moveSegment, schedule, setMinutes, totalMinutes } from "@/cuesheet/time";
import type { CueSheet } from "@/cuesheet/types";
import { cn } from "@/lib/utils";

export default function CueSheetPage() {
  const { sheetId = "" } = useParams();
  const [sheet, setSheet] = useState<CueSheet | null>(() => getSheet(sheetId));

  useEffect(() => {
    if (sheet) saveSheet(sheet);
  }, [sheet]);

  const rows = useMemo(() => (sheet ? schedule(sheet.segments, sheet.startTime) : []), [sheet]);

  if (!sheet) {
    return (
      <AppShell footer="pd">
        <p className="mt-10 text-center font-bold">이 기기에서 큐시트를 찾지 못했어요.</p>
        <p className="mt-2 text-center text-sm text-ink/60">큐시트는 만든 기기에만 저장돼요.</p>
        <div className="mt-6 flex justify-center">
          <Link to="/pd" className={buttonVariants()}>
            새로 만들기
          </Link>
        </div>
      </AppShell>
    );
  }

  const update = (segments: CueSheet["segments"]) => setSheet({ ...sheet, segments });
  const total = totalMinutes(sheet.segments);
  const diff = total - sheet.requestedMinutes;

  return (
    <AppShell footer="pd">
      <div className="print:hidden">
        <h1 className="mt-1 text-2xl font-extrabold">{sheet.title}</h1>
        <p className="mt-1 text-sm text-ink/70">
          합계 <b>{total}분</b>
          {diff !== 0 && (
            <span className="ml-1 font-bold text-red-700">
              (처음 요청보다 {Math.abs(diff)}분 {diff > 0 ? "길어요" : "짧아요"})
            </span>
          )}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="pd-start-edit" className="text-sm font-bold">
            시작 시각
          </label>
          <Input
            id="pd-start-edit"
            type="time"
            className="h-10 w-32"
            value={sheet.startTime}
            onChange={(e) => isValidTime(e.target.value) && setSheet({ ...sheet, startTime: e.target.value })}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/pd/${sheet.id}/live`} className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
            <Play aria-hidden="true" className="fill-ink" />
            진행 모드
          </Link>
          <Button variant="outline" size="lg" onClick={() => window.print()} aria-label="인쇄 또는 PDF로 저장">
            <Printer aria-hidden="true" />
            PDF
          </Button>
        </div>
      </div>

      <ol className="mt-5 space-y-3" aria-label="큐시트">
        {rows.map((r, i) => (
          <li key={r.id} className="rounded-2xl border-2 border-ink bg-white p-4 [break-inside:avoid]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-bold text-ink/60">
                  {r.start} – {r.end}
                </p>
                <h2 className="text-lg font-extrabold leading-tight">{r.title}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1 print:hidden">
                <Button variant="ghost" size="icon" aria-label={`${r.title} 위로`} disabled={i === 0 || r.kind === "open"} onClick={() => update(moveSegment(sheet.segments, i, -1))}>
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`${r.title} 아래로`} disabled={i === rows.length - 1 || r.kind === "close"} onClick={() => update(moveSegment(sheet.segments, i, 1))}>
                  <ArrowDown aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 print:hidden">
              <label htmlFor={`min-${r.id}`} className="text-sm font-bold">
                시간(분)
              </label>
              <Input
                id={`min-${r.id}`}
                inputMode="numeric"
                className="h-9 w-20 px-2 text-center"
                value={r.minutes}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n > 0) update(setMinutes(sheet.segments, i, n));
                }}
              />
            </div>
            <p className="mt-2 hidden text-sm font-bold print:block">{r.minutes}분</p>
            <ul className="mt-3 space-y-1 text-[15px] leading-relaxed">
              {r.script.map((line, k) => (
                <li key={k}>“{line}”</li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-[13px] leading-relaxed text-ink/75">
              <div>
                <dt className="inline font-bold">효과음·자막: </dt>
                <dd className="inline">{r.cue}</dd>
              </div>
              <div>
                <dt className="inline font-bold">준비물: </dt>
                <dd className="inline">{r.props.join(", ")}</dd>
              </div>
              <div>
                <dt className="inline font-bold">플랜 B: </dt>
                <dd className="inline">{r.planB}</dd>
              </div>
            </dl>
            {r.kind === "quiz" && (
              <Link to="/" className={cn(buttonVariants({ variant: "soft", size: "sm" }), "mt-3 print:hidden")}>
                퀴즈 사이트 열기
              </Link>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[13px] text-ink/60">
        배경음악은 곡을 제공하지 않아요. 분위기 키워드에 맞는 곡은 직접 고르고, 저작권은 사용하시는 분이 확인해 주세요.
      </p>
      <p className="mt-4 text-center print:hidden">
        <Link to="/pd" className="text-sm font-bold text-ink/60 underline underline-offset-4">
          새 큐시트 만들기
        </Link>
      </p>
    </AppShell>
  );
}
