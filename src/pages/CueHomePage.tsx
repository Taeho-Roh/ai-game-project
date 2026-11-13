import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateCueSheet, validateInput } from "@/cuesheet/generate";
import { deleteSheet, loadSheets, saveSheet } from "@/cuesheet/storage";
import { totalMinutes } from "@/cuesheet/time";
import { EVENT_LABEL, MOOD_LABEL, type EventKind, type Mood } from "@/cuesheet/types";

const selectCls =
  "flex h-12 w-full rounded-xl border-2 border-ink bg-white px-3 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

export default function CueHomePage() {
  const nav = useNavigate();
  const [eventKind, setEventKind] = useState<EventKind>("dinner");
  const [people, setPeople] = useState("8");
  const [minutes, setMinutes] = useState("90");
  const [mood, setMood] = useState<Mood>("lively");
  const [startTime, setStartTime] = useState("19:00");
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(() => loadSheets());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { eventKind, people: Number(people), totalMinutes: Number(minutes), mood, startTime, includeQuiz };
    const err = validateInput(input);
    if (err) return setError(err);
    const sheet = generateCueSheet(input);
    saveSheet(sheet);
    nav(`/pd/${sheet.id}`);
  };

  return (
    <AppShell footer="pd">
      <section className="pt-1">
        <h1 className="caption-text -rotate-[1.5deg] px-2 text-center text-[38px] leading-[1.1]">
          나의PD
          <br />
          큐시트 만들기
        </h1>
        <p className="mx-auto mt-4 max-w-[340px] text-center text-[15px] leading-relaxed text-ink/70">
          여섯 가지만 고르면 분 단위 진행표와 진행 멘트, 효과음 신호, 준비물, 비상 대안이 한 번에 나와요.
        </p>
      </section>

      <form onSubmit={submit} className="mt-6 space-y-4" aria-label="큐시트 조건">
        <div>
          <Label htmlFor="pd-event">행사 성격</Label>
          <select id="pd-event" className={selectCls} value={eventKind} onChange={(e) => setEventKind(e.target.value as EventKind)}>
            {Object.entries(EVENT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pd-people">인원 (명)</Label>
            <Input id="pd-people" inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pd-minutes">총 시간 (분)</Label>
            <Input id="pd-minutes" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pd-mood">분위기</Label>
            <select id="pd-mood" className={selectCls} value={mood} onChange={(e) => setMood(e.target.value as Mood)}>
              {Object.entries(MOOD_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="pd-start">시작 시각</Label>
            <Input id="pd-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white px-4 py-3 text-[15px] font-bold">
          <input type="checkbox" className="h-5 w-5 accent-ink" checked={includeQuiz} onChange={(e) => setIncludeQuiz(e.target.checked)} />
          명대사 퀴즈 라운드 넣기 (약 9분)
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full">
          큐시트 만들기
        </Button>
        <p className="text-center text-[13px] text-ink/60">로그인 없이 바로 만들어져요. 이 기기에만 저장돼요.</p>
      </form>

      {saved.length > 0 && (
        <section className="mt-8" aria-labelledby="pd-saved">
          <h2 id="pd-saved" className="mb-2 text-lg font-extrabold">
            내가 만든 큐시트
          </h2>
          <ul className="space-y-2">
            {saved.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white p-2 pl-4">
                <Link to={`/pd/${s.id}`} className="flex-1 py-2 font-bold">
                  {s.title}
                  <span className="block text-[13px] font-medium text-ink/60">
                    {s.startTime} 시작 · 코너 {s.segments.length}개 · 합계 {totalMinutes(s.segments)}분
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${s.title} 삭제`}
                  onClick={() => {
                    deleteSheet(s.id);
                    setSaved(loadSheets());
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 text-center">
        <Link to="/" className="text-sm font-bold text-ink/60 underline underline-offset-4">
          퀴즈 사이트로 가기
        </Link>
      </p>
    </AppShell>
  );
}
