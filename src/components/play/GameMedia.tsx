// 게임 종류별 화면을 고르는 곳 — 공통 뼈대(문제·정답 공개)는 이 컴포넌트만 불러요.
import { RotateCcw } from "lucide-react";
import { QuoteMedia } from "@/games/quote-tts/QuoteMedia";
import type { Speech } from "@/games/quote-tts/useSpeech";
import { SongImageFrame, SongMedia } from "@/games/song-image/SongMedia";
import type { Question } from "@/quiz/types";

export function QuestionMedia({
  question,
  number,
  speech,
  rate,
  onRateChange,
  extraHintShown,
  lineFree,
  playCount,
  onPlayed,
}: {
  question: Question;
  number: number;
  speech: Speech;
  rate: number;
  onRateChange: (rate: number) => void;
  extraHintShown: boolean;
  /** 음성을 쓸 수 없어 대사를 감점 없이 보여 주는 중 */
  lineFree: boolean;
  playCount: number;
  onPlayed: () => void;
}) {
  if (question.gameType === "quote_tts") {
    return (
      <QuoteMedia
        question={question}
        number={number}
        speech={speech}
        rate={rate}
        onRateChange={onRateChange}
        showLine={extraHintShown || lineFree}
        autoPlay
        playCount={playCount}
        onPlayed={onPlayed}
      />
    );
  }
  return <SongMedia question={question} number={number} showDescription={extraHintShown} />;
}

/** 정답 공개 때의 화면 — 대사는 이제 자막으로, 그림은 그대로 */
export function RevealMedia({ question, speech, rate }: { question: Question; speech: Speech; rate: number }) {
  if (question.gameType === "quote_tts") {
    const canPlay = speech.status === "ready" && !speech.failed;
    return (
      <div className="screen-panel relative flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-3xl px-5 py-6 text-center">
        <p className="subtitle-text animate-subtitle-in text-[20px] leading-snug" data-testid="reveal-line">
          {question.line}
        </p>
        {canPlay && (
          <button
            type="button"
            onClick={() => speech.speak(question.speakText ?? question.line, rate)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 ring-1 ring-white/20 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            한 번 더 듣기
          </button>
        )}
      </div>
    );
  }
  return <SongImageFrame question={question} />;
}
