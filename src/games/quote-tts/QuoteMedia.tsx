// 명대사 TTS 문제 화면 — 극장 화면 패널 + 재생 버튼 + 속도 + (정답 뒤에만) 자막
import { useEffect, useRef } from "react";
import { Play, RotateCcw, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/Waveform";
import { cn } from "@/lib/utils";
import type { QuoteTtsQuestion } from "@/quiz/types";
import { speechStatusMessage, type Speech } from "./useSpeech";
import { RATE_OPTIONS } from "./voice";

export function QuoteMedia({
  question,
  number,
  speech,
  rate,
  onRateChange,
  showLine,
  autoPlay,
  playCount,
  onPlayed,
}: {
  question: QuoteTtsQuestion;
  number: number;
  speech: Speech;
  rate: number;
  onRateChange: (rate: number) => void;
  /** 대사를 자막으로 보여 줄지 (대사 보기 힌트·정답 공개·음성 없음) */
  showLine: boolean;
  /** 문제가 바뀌면 자동으로 한 번 읽기 */
  autoPlay: boolean;
  playCount: number;
  onPlayed: () => void;
}) {
  const text = question.speakText ?? question.line;
  const canPlay = speech.status === "ready" && !speech.failed;
  const autoPlayedFor = useRef<string | null>(null);

  const play = () => {
    speech.speak(text, rate);
    onPlayed();
  };

  // 문제마다 한 번 자동 재생 — 브라우저는 사용자가 한 번이라도 누른 뒤에만 소리를 허락해요.
  useEffect(() => {
    if (!autoPlay || !canPlay || autoPlayedFor.current === question.id) return;
    const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
    if (!activated) return;
    const t = window.setTimeout(() => {
      autoPlayedFor.current = question.id;
      speech.speak(text, rate);
      onPlayed();
    }, 400);
    return () => window.clearTimeout(t);
    // speech 객체는 렌더마다 새로 만들어지므로 의존성에서 뺐어요 (speak 함수만 씀)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, canPlay, question.id]);

  const message = speechStatusMessage(speech);

  return (
    <div>
      <div className="screen-panel relative aspect-[4/3] overflow-hidden rounded-3xl">
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <Badge variant="onScreen">
            <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />
            AI·TTS 음성
          </Badge>
          <span className="font-display text-sm tracking-wide text-white/45">#{number}</span>
        </div>

        <div className="absolute inset-x-6 top-[22%] h-[30%]">
          <Waveform seed={question.id} active={speech.speaking} />
        </div>

        <div className="absolute inset-x-0 top-[56%] flex justify-center">
          <button
            type="button"
            onClick={play}
            disabled={!canPlay}
            aria-label={playCount > 0 ? "대사 다시 듣기" : "대사 듣기"}
            className={cn(
              "group inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-caption pl-4 pr-5 text-base font-bold text-ink shadow-[0_3px_0_0_#000] transition-transform active:translate-y-[2px] active:shadow-none",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-screen",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {playCount > 0 ? <RotateCcw aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="h-5 w-5 fill-ink" />}
            {speech.speaking ? "읽는 중…" : playCount > 0 ? "다시 듣기" : "대사 듣기"}
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex min-h-[26%] items-end justify-center px-5 pb-4 text-center">
          {showLine ? (
            <p key="line" className="subtitle-text animate-subtitle-in text-[19px] leading-snug" data-testid="quote-line">
              {question.line}
            </p>
          ) : (
            <p className="text-[13px] text-white/40">대사 글자는 정답을 확인한 뒤에 보여 드려요</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">읽는 속도</legend>
          <span aria-hidden="true" className="text-xs font-bold text-ink/50">
            속도
          </span>
          <div className="flex rounded-full border border-ink/15 bg-white p-0.5">
            {RATE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky",
                  rate === opt.value ? "bg-ink text-paper" : "text-ink/60 hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="tts-rate"
                  value={opt.value}
                  checked={rate === opt.value}
                  onChange={() => onRateChange(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
        <span className="text-xs text-ink/45">들은 횟수 {playCount}</span>
      </div>

      <p role="status" aria-live="polite" className={cn("mt-2 text-sm", message ? "text-ink/70" : "sr-only")}>
        {message ?? (speech.speaking ? "대사를 읽고 있어요" : "")}
      </p>
    </div>
  );
}
