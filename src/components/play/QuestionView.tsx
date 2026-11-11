import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lightbulb, MessageSquareText, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GameTypeMeta } from "@/games/registry";
import type { Speech } from "@/games/quote-tts/useSpeech";
import { HINT_ORDER, nextHintLabel, revealedHints } from "@/quiz/hints";
import { SCORING, potentialPoints } from "@/quiz/scoring";
import type { Question } from "@/quiz/types";
import { cn } from "@/lib/utils";
import { QuestionMedia } from "./GameMedia";
import type { QuestionState } from "./questionState";

function prefersFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches === true;
}

export function QuestionView({
  meta,
  question,
  number,
  state,
  speech,
  rate,
  onRateChange,
  lineFree,
  onSubmit,
  onHint,
  onExtraHint,
  onSkip,
  onPlayed,
}: {
  meta: GameTypeMeta;
  question: Question;
  number: number;
  state: QuestionState;
  speech: Speech;
  rate: number;
  onRateChange: (rate: number) => void;
  lineFree: boolean;
  onSubmit: (value: string) => void;
  onHint: () => void;
  onExtraHint: () => void;
  onSkip: () => void;
  onPlayed: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // 새 문제: 키보드·마우스 환경이면 입력칸으로, 휴대폰이면 (키보드가 화면을 가리지 않게) 문제 제목으로 초점
  useEffect(() => {
    setValue("");
    if (prefersFinePointer()) inputRef.current?.focus();
    else headingRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  // 틀리면 입력칸 비우고 다시 초점
  useEffect(() => {
    if (state.feedback === "wrong" || state.feedback === "near") {
      setValue("");
      inputRef.current?.focus();
    }
  }, [state.shakeKey, state.feedback]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  const hints = revealedHints(question, state.hintsUsed);
  const nextHint = nextHintLabel(state.hintsUsed);
  const attemptsLeft = SCORING.maxAttempts - state.attempts.length;
  const nextPoints = potentialPoints(state.attempts.length + 1, state.hintsUsed, state.extraHintCharged);
  const showExtraButton = !state.extraHintUsed && !lineFree;
  const feedbackId = `feedback-${question.id}`;

  return (
    <div data-question-id={question.id} data-testid="question">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        {number}번 문제. {meta.inputLabel}
      </h1>

      <QuestionMedia
        question={question}
        number={number}
        speech={speech}
        rate={rate}
        onRateChange={onRateChange}
        extraHintShown={state.extraHintUsed}
        lineFree={lineFree}
        playCount={state.playCount}
        onPlayed={onPlayed}
      />

      {/* 힌트 */}
      <section aria-label="힌트" className="mt-5">
        {hints.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" data-testid="hints">
            {hints.map((h) => (
              <li
                key={h.id}
                className="animate-subtitle-in rounded-xl border-2 border-ink bg-caption/90 px-3 py-1.5 text-[15px] font-bold shadow-sticker-sm"
              >
                <span className="mr-1.5 text-xs font-bold text-ink/60">{h.label}</span>
                <span className={cn(h.id === "chosung" && "tracking-[0.12em]")}>{h.value}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" size="sm" onClick={onHint} disabled={!nextHint}>
            <Lightbulb aria-hidden="true" />
            {nextHint ? `힌트: ${nextHint} 보기` : "힌트를 다 봤어요"}
            {nextHint && <span className="text-ink/50">−{SCORING.hintCost}</span>}
          </Button>
          {showExtraButton && (
            <Button variant="soft" size="sm" onClick={onExtraHint}>
              <MessageSquareText aria-hidden="true" />
              {meta.extraHint.label}
              <span className="text-ink/50">−{SCORING.extraHintCost}</span>
            </Button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {hints.length > 0 ? `열린 힌트 ${hints.length}개 중 마지막: ${hints[hints.length - 1]!.label} ${hints[hints.length - 1]!.value}` : ""}
          {state.hintsUsed >= HINT_ORDER.length ? " 힌트를 모두 열었어요." : ""}
        </p>
      </section>

      {/* 정답 입력 — Enter 로 제출 */}
      <form onSubmit={submit} className="mt-5" noValidate>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="answer-input" className="text-[15px]">
            {meta.inputLabel}
          </Label>
          <span className="text-xs text-ink/55">
            지금 맞히면 <b className="text-ink">+{nextPoints}점</b>
          </span>
        </div>
        <div key={state.shakeKey} className={cn("mt-2 flex gap-2", state.shakeKey > 0 && "animate-shake")}>
          <Input
            ref={inputRef}
            id="answer-input"
            name="answer"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={meta.inputPlaceholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            aria-invalid={state.feedback === "wrong" || state.feedback === "near" ? true : undefined}
            aria-describedby={feedbackId}
          />
          <Button type="submit" className="shrink-0 px-4">
            확인
          </Button>
        </div>
        <p id={feedbackId} role="status" aria-live="assertive" className="mt-2 min-h-[1.5rem] text-sm font-bold">
          {state.feedback === "empty" && <span className="text-ink/70">제목을 입력해 주세요.</span>}
          {state.feedback === "wrong" && <span className="text-[#C2185B]">아니에요! 기회가 {attemptsLeft}번 남았어요.</span>}
          {state.feedback === "near" && <span className="text-[#C2185B]">아까워요, 거의 다 왔어요! 기회가 {attemptsLeft}번 남았어요.</span>}
          {!state.feedback && (
            <span className="font-normal text-ink/50">
              기회 {attemptsLeft}번 · 띄어쓰기·영어 제목도 괜찮아요
            </span>
          )}
        </p>
      </form>

      <div className="mt-1 flex justify-center">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-ink/60">
          <SkipForward aria-hidden="true" />
          모르겠어요, 넘어갈게요
        </Button>
      </div>
    </div>
  );
}
