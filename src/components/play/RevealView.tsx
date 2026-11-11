import { useEffect, useRef } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayTitle, revealSubtitle } from "@/games/registry";
import type { Speech } from "@/games/quote-tts/useSpeech";
import type { AnswerRecord, Question } from "@/quiz/types";
import { RevealMedia } from "./GameMedia";

const REACTION = {
  correct: { text: "정답!", fill: "#23C99A" },
  wrong: { text: "땡!", fill: "#FF4F8B" },
  skipped: { text: "패스!", fill: "#FFFFFF" },
} as const;

/** Enter 로 제출한 직후 같은 키 입력이 "다음"까지 눌러 버리지 않게 잠깐 막아요 */
const NEXT_GUARD_MS = 250;

export function RevealView({
  question,
  record,
  isLast,
  speech,
  rate,
  onNext,
}: {
  question: Question;
  record: AnswerRecord;
  isLast: boolean;
  speech: Speech;
  rate: number;
  onNext: () => void;
}) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const shownAt = useRef(Date.now());
  useEffect(() => {
    shownAt.current = Date.now();
    nextRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  const r = REACTION[record.outcome];
  const isQuote = question.gameType === "quote_tts";

  return (
    <div data-testid="reveal" data-outcome={record.outcome}>
      <div className="flex items-end justify-between gap-3 pb-2">
        <p
          className="caption-text animate-caption-pop pl-1.5 text-[56px] leading-none"
          style={{ ["--cap-fill" as string]: r.fill }}
          aria-hidden="true"
        >
          {r.text}
        </p>
        <p className="pb-1 text-right text-[15px] font-extrabold">
          {record.outcome === "correct" ? `+${record.points}점` : "0점"}
        </p>
      </div>
      <h1 className="sr-only">
        {record.outcome === "correct" ? "정답이에요" : record.outcome === "wrong" ? "아쉽게 틀렸어요" : "건너뛰었어요"}. 정답은 {displayTitle(question)}
      </h1>

      <RevealMedia question={question} speech={speech} rate={rate} />

      <div className="mt-4 rounded-2xl border-2 border-ink bg-white p-4 shadow-sticker-sm">
        <p className="text-xs font-bold text-ink/50">정답</p>
        <h2 className="mt-0.5 text-[22px] font-extrabold leading-tight" data-testid="reveal-title">
          {displayTitle(question)}
        </h2>
        <p className="mt-1 text-sm text-ink/65">{revealSubtitle(question)}</p>

        <dl className="mt-3 space-y-1.5 border-t border-dashed border-ink/20 pt-3 text-sm">
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 font-bold text-ink/50">내 답</dt>
            <dd className="min-w-0 break-words">{record.attempts.length > 0 ? record.attempts.join(" → ") : "건너뛰었어요"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 font-bold text-ink/50">출처</dt>
            <dd className="min-w-0" data-testid="reveal-source">
              {question.sourceNote}
              <span className="block text-xs text-ink/50">
                {isQuote
                  ? "대사는 출처 표시 목적의 짧은 인용이에요. 음성은 AI·TTS 일반 음성이에요."
                  : question.image.kind === "placeholder"
                    ? "그림은 흐름 확인용 샘플이에요(AI 생성 아님). 가사는 쓰지 않았어요."
                    : "그림은 AI 로 만들었어요. 가사는 쓰지 않았어요."}
              </span>
            </dd>
          </div>
          {!isQuote && question.officialLink && (
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 font-bold text-ink/50">듣기</dt>
              <dd>
                <a href={question.officialLink} target="_blank" rel="noreferrer" className="font-bold underline decoration-caption decoration-2 underline-offset-4">
                  공식 뮤직비디오
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <Button
        ref={nextRef}
        size="lg"
        className="mt-5 w-full"
        onClick={() => {
          if (Date.now() - shownAt.current < NEXT_GUARD_MS) return;
          onNext();
        }}
      >
        {isLast ? (
          <>
            <Trophy aria-hidden="true" />
            결과 보기
          </>
        ) : (
          <>
            다음 문제
            <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}
