import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Download, List, RotateCcw, Share2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { displayTitle, type GameTypeMeta } from "@/games/registry";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { formatDuration, formatScore, recordEmoji, resultComment } from "@/quiz/scoring";
import { renderShareCard } from "@/quiz/shareCard";
import { buildShareText } from "@/quiz/share";
import type { BestRecord } from "@/quiz/storage";
import type { PlaySummary, Question, QuizPack } from "@/quiz/types";

const CELL_CLASS: Record<string, string> = {
  "🟩": "bg-mint",
  "🟨": "bg-caption",
  "🟥": "bg-pink",
  "⬜": "bg-[#D9D4E8]",
};
const CELL_LABEL: Record<string, string> = {
  "🟩": "한 번에 정답",
  "🟨": "힌트나 두 번째 기회로 정답",
  "🟥": "틀림",
  "⬜": "건너뜀",
};

export function ResultView({
  pack,
  meta,
  summary,
  questions,
  best,
  onRetry,
}: {
  pack: QuizPack;
  meta: GameTypeMeta;
  summary: PlaySummary;
  questions: Question[];
  best: { isNewBest: boolean; previous: BestRecord | null } | null;
  onRetry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [card, setCard] = useState<{ dataUrl: string; blob: Blob | null } | null>(null);
  const [cardError, setCardError] = useState(false);
  const [copied, setCopied] = useState<null | "ok" | "fail">(null);
  const url = SITE.url();

  const shareText = useMemo(
    () => buildShareText({ siteName: SITE.name, gameLabel: meta.label, packTitle: pack.title, summary, url }),
    [meta.label, pack.title, summary, url],
  );

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    let alive = true;
    renderShareCard({ siteName: SITE.name, gameLabel: meta.label, aiLabel: meta.aiLabel, packTitle: pack.title, summary, url })
      .then((c) => alive && setCard(c))
      .catch(() => alive && setCardError(true));
    return () => {
      alive = false;
    };
  }, [meta.label, meta.aiLabel, pack.title, summary, url]);

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const onCopy = async () => setCopied((await copyText(shareText)) ? "ok" : "fail");

  const onShare = async () => {
    try {
      const file = card?.blob ? new File([card.blob], "result.png", { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: shareText, files: [file] });
      } else {
        await navigator.share({ text: shareText });
      }
    } catch {
      // 사용자가 공유 창을 닫은 경우 — 아무것도 안 해요
    }
  };

  return (
    <div data-testid="result">
      <h1 ref={headingRef} tabIndex={-1} className="text-center text-[15px] font-extrabold text-ink/60">
        「{pack.title}」 결과
      </h1>

      <p className="caption-text animate-caption-pop mt-2 text-center text-[64px] leading-none" data-testid="result-score">
        {formatScore(summary.score)}점
      </p>
      <p className="mt-3 text-center text-[15px] font-bold">{resultComment(summary.correctCount, summary.total)}</p>
      {best?.isNewBest && (
        <p className="mt-2 text-center">
          <span className="inline-block -rotate-2 rounded-lg border-2 border-ink bg-pink px-2.5 py-0.5 text-sm font-extrabold shadow-sticker-sm">
            {best.previous ? "최고 기록 경신!" : "첫 기록 저장!"}
          </span>
        </p>
      )}

      <dl className="mt-5 grid grid-cols-3 divide-x divide-ink/10 rounded-2xl border-2 border-ink bg-white py-3 text-center">
        <div>
          <dt className="text-xs font-bold text-ink/50">정답</dt>
          <dd className="mt-0.5 text-lg font-extrabold">
            {summary.correctCount}/{summary.total}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-ink/50">걸린 시간</dt>
          <dd className="mt-0.5 text-lg font-extrabold">{formatDuration(summary.durationMs)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-ink/50">내 최고</dt>
          <dd className="mt-0.5 text-lg font-extrabold">
            {formatScore(best?.isNewBest || !best?.previous ? summary.score : best.previous.score)}
          </dd>
        </div>
      </dl>

      <ol aria-label="문제별 결과" className="mt-4 flex flex-wrap justify-center gap-1.5">
        {summary.records.map((r, i) => {
          const e = recordEmoji(r);
          return (
            <li key={r.questionId} title={`${i + 1}번: ${CELL_LABEL[e]}`} className={cn("h-6 w-6 rounded-md border-2 border-ink", CELL_CLASS[e])}>
              <span className="sr-only">
                {i + 1}번 {CELL_LABEL[e]}
              </span>
            </li>
          );
        })}
      </ol>

      {/* 공유 */}
      <section aria-labelledby="share-title" className="mt-8">
        <h2 id="share-title" className="text-[15px] font-extrabold">
          친구에게 자랑하기
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-sticker-sm">
          {card ? (
            <img
              src={card.dataUrl}
              alt={`공유 카드: ${pack.title} ${summary.total}문제 중 ${summary.correctCount}개 정답, ${formatScore(summary.score)}점`}
              className="block aspect-[4/5] w-full"
              data-testid="share-card"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center text-sm text-ink/50">
              {cardError ? "공유 카드를 만들지 못했어요. 결과 문구 복사는 그대로 쓸 수 있어요." : "공유 카드를 만드는 중이에요…"}
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCopy}>
            {copied === "ok" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied === "ok" ? "복사했어요" : "결과 문구 복사"}
          </Button>
          {card ? (
            <a href={card.dataUrl} download={`aigame-${pack.id}-result.png`} className={buttonVariants({ variant: "outline" })}>
              <Download aria-hidden="true" />
              카드 이미지 저장
            </a>
          ) : (
            <Button variant="outline" disabled>
              <Download aria-hidden="true" />
              카드 이미지 저장
            </Button>
          )}
          {canShare && (
            <Button variant="dark" className="col-span-2" onClick={onShare}>
              <Share2 aria-hidden="true" />
              공유하기
            </Button>
          )}
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-ink/60">
          {copied === "fail" ? "복사하지 못했어요. 아래 문구를 길게 눌러 직접 복사해 주세요." : copied === "ok" ? "결과 문구를 복사했어요. 카톡에 붙여 넣어 보세요." : ""}
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-ink/5 p-3 font-sans text-[13px] leading-relaxed text-ink/75" data-testid="share-text">
          {shareText}
        </pre>
      </section>

      {/* 문제별 정답 */}
      <section aria-labelledby="answers-title" className="mt-8">
        <h2 id="answers-title" className="flex items-center gap-1.5 text-[15px] font-extrabold">
          <List aria-hidden="true" className="h-4 w-4" />
          문제별 정답
        </h2>
        <ol className="mt-2 divide-y divide-ink/10 rounded-2xl border border-ink/15 bg-white">
          {summary.records.map((r, i) => {
            const q = byId.get(r.questionId);
            if (!q) return null;
            const ok = r.outcome === "correct";
            return (
              <li key={r.questionId} className="flex items-center gap-3 px-3.5 py-2.5">
                <span
                  aria-hidden="true"
                  className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", ok ? "bg-mint" : r.outcome === "skipped" ? "bg-ink/10" : "bg-pink")}
                >
                  {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    <span className="sr-only">{i + 1}번 {ok ? "정답" : r.outcome === "skipped" ? "건너뜀" : "틀림"}: </span>
                    {displayTitle(q)}
                  </p>
                  {q.gameType === "quote_tts" && <p className="truncate text-xs text-ink/55">“{q.line}”</p>}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">{r.points}점</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-2">
        <Button size="lg" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          다시 하기
        </Button>
        <Link to="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          다른 퀴즈
        </Link>
      </div>
    </div>
  );
}
