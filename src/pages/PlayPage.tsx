import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuestionView } from "@/components/play/QuestionView";
import { freshQuestionState, type QuestionState } from "@/components/play/questionState";
import { RevealView } from "@/components/play/RevealView";
import { ResultView } from "@/components/play/ResultView";
import { buttonVariants } from "@/components/ui/button";
import { getPack } from "@/data";
import { GAME_TYPES } from "@/games/registry";
import { speechUnavailable, useSpeech } from "@/games/quote-tts/useSpeech";
import { isCorrectAnswer, isNearMiss } from "@/quiz/answer";
import { HINT_ORDER } from "@/quiz/hints";
import { shuffle } from "@/quiz/random";
import { SCORING, formatScore, questionPoints, summarize } from "@/quiz/scoring";
import { incrementPlayCount, loadSetting, saveIfBest, saveSetting, type BestRecord } from "@/quiz/storage";
import type { AnswerRecord, Outcome, Question, QuizPack } from "@/quiz/types";
import NotFoundPage from "./NotFoundPage";

type Phase = "question" | "reveal" | "result";

export default function PlayPage() {
  const { packId } = useParams();
  const pack = getPack(packId);
  if (!pack) return <NotFoundPage />;
  return <PlaySession key={pack.id} pack={pack} />;
}

function PlaySession({ pack }: { pack: QuizPack }) {
  const meta = GAME_TYPES[pack.gameType];
  // 판마다 문제 순서를 섞어요 (다시 하기 = 새 순서)
  const [order, setOrder] = useState<Question[]>(() => shuffle<Question>(pack.questions));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [qs, setQs] = useState<QuestionState>(freshQuestionState);
  const [best, setBest] = useState<{ isNewBest: boolean; previous: BestRecord | null } | null>(null);
  const [rate, setRate] = useState<number>(() => loadSetting("ttsRate", 1));
  const speech = useSpeech();

  const question = order[index];
  const total = order.length;
  const score = records.reduce((s, r) => s + r.points, 0);
  const lineFree = pack.gameType === "quote_tts" && speechUnavailable(speech);
  const summary = useMemo(() => summarize(pack.id, records), [pack.id, records]);

  const changeRate = (r: number) => {
    setRate(r);
    saveSetting("ttsRate", r);
  };

  const finish = useCallback(
    (outcome: Outcome, attempts: string[]) => {
      if (!question) return;
      speech.stop();
      const record: AnswerRecord = {
        questionId: question.id,
        outcome,
        attempts,
        hintsUsed: qs.hintsUsed,
        extraHintUsed: qs.extraHintUsed,
        extraHintCharged: qs.extraHintCharged,
        points: questionPoints({ outcome, attempt: attempts.length, hintsUsed: qs.hintsUsed, extraHintCharged: qs.extraHintCharged }),
        durationMs: Date.now() - qs.startedAt,
      };
      setRecords((rs) => [...rs, record]);
      setPhase("reveal");
    },
    [question, qs, speech],
  );

  const onSubmit = (raw: string) => {
    if (!question) return;
    const value = raw.trim();
    if (!value) {
      setQs((s) => ({ ...s, feedback: "empty" }));
      return;
    }
    const attempts = [...qs.attempts, value];
    if (isCorrectAnswer(value, question)) return finish("correct", attempts);
    if (attempts.length >= SCORING.maxAttempts) return finish("wrong", attempts);
    setQs((s) => ({ ...s, attempts, feedback: isNearMiss(value, question) ? "near" : "wrong", shakeKey: s.shakeKey + 1 }));
  };

  const onNext = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setQs(freshQuestionState());
      setPhase("question");
    } else {
      setPhase("result");
    }
  };

  const onRetry = () => {
    setOrder(shuffle<Question>(pack.questions));
    setIndex(0);
    setRecords([]);
    setBest(null);
    setQs(freshQuestionState());
    setPhase("question");
  };

  // 결과 화면에 들어오면 한 번만 기록 저장 (이 기기 localStorage)
  useEffect(() => {
    if (phase !== "result" || best) return;
    setBest(saveIfBest(summary));
    incrementPlayCount(pack.id);
  }, [phase, best, summary, pack.id]);

  const exit = (
    <Link to={`/pack/${pack.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label="그만하고 나가기">
      <X aria-hidden="true" />
      나가기
    </Link>
  );

  if (phase === "result") {
    return (
      <AppShell footer={pack.gameType} sample={pack.sample}>
        <ResultView pack={pack} meta={meta} summary={summary} questions={order} best={best} onRetry={onRetry} />
      </AppShell>
    );
  }

  if (!question) return <NotFoundPage />;
  const lastRecord = records[records.length - 1];
  const progress = ((index + (phase === "reveal" ? 1 : 0)) / total) * 100;

  return (
    <AppShell headerRight={exit} footer={pack.gameType} sample={pack.sample}>
      {/* 진행 막대 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="shrink-0 text-sm font-extrabold tabular-nums">
          {index + 1}
          <span className="text-ink/40"> / {total}</span>
        </span>
        <div
          role="progressbar"
          aria-label="진행"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + (phase === "reveal" ? 1 : 0)}
          className="h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-white"
        >
          <div className="h-full bg-caption transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-sm font-extrabold tabular-nums" aria-label={`지금 점수 ${score}점`} data-testid="live-score">
          {formatScore(score)}점
        </span>
      </div>

      {phase === "question" && (
        <QuestionView
          meta={meta}
          question={question}
          number={index + 1}
          state={qs}
          speech={speech}
          rate={rate}
          onRateChange={changeRate}
          lineFree={lineFree}
          onSubmit={onSubmit}
          onHint={() => setQs((s) => ({ ...s, hintsUsed: Math.min(HINT_ORDER.length, s.hintsUsed + 1) }))}
          onExtraHint={() => setQs((s) => ({ ...s, extraHintUsed: true, extraHintCharged: true }))}
          onSkip={() => finish("skipped", qs.attempts)}
          onPlayed={() => setQs((s) => ({ ...s, playCount: s.playCount + 1 }))}
        />
      )}

      {phase === "reveal" && lastRecord && (
        <RevealView question={question} record={lastRecord} isLast={index + 1 >= total} speech={speech} rate={rate} onNext={onNext} />
      )}
    </AppShell>
  );
}
