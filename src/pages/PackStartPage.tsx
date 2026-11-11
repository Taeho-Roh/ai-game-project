import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { getPack } from "@/data";
import { GAME_TYPES } from "@/games/registry";
import { speechStatusMessage, useSpeech } from "@/games/quote-tts/useSpeech";
import { SongImageFrame } from "@/games/song-image/SongMedia";
import { SCORING, formatDuration, formatScore } from "@/quiz/scoring";
import { loadBest } from "@/quiz/storage";
import { cn } from "@/lib/utils";
import NotFoundPage from "./NotFoundPage";

function VoiceCheck() {
  const speech = useSpeech();
  const message = speechStatusMessage(speech);
  return (
    <section aria-labelledby="voice-title" className="mt-6 rounded-2xl border border-ink/15 bg-white p-4">
      <h2 id="voice-title" className="flex items-center gap-1.5 text-[15px] font-extrabold">
        <Volume2 aria-hidden="true" className="h-4 w-4" />
        소리 확인
      </h2>
      <p className="mt-1 text-sm text-ink/65">
        소리를 켜고 눌러 보세요. 기기에 들어 있는 한국어 음성으로 읽어요.
        {speech.status === "ready" && speech.voice && <span className="block text-xs text-ink/45">지금 쓰는 음성: {speech.voice.name}</span>}
      </p>
      <Button variant="outline" size="sm" className="mt-3" disabled={speech.status !== "ready"} onClick={() => speech.speak("안녕하세요. 소리가 잘 들리나요?")}>
        <Play aria-hidden="true" className="fill-ink" />
        {speech.speaking ? "읽는 중…" : "소리 들어 보기"}
      </Button>
      <p role="status" aria-live="polite" className={cn("mt-2 text-sm text-ink/70", !message && "sr-only")}>
        {message ?? ""}
      </p>
    </section>
  );
}

export default function PackStartPage() {
  const { packId } = useParams();
  const navigate = useNavigate();
  const pack = getPack(packId);
  if (!pack) return <NotFoundPage />;

  const meta = GAME_TYPES[pack.gameType];
  const best = loadBest(pack.id);
  const firstSong = pack.gameType === "song_image" ? pack.questions[0] : undefined;

  return (
    <AppShell
      headerRight={
        <Link to="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft aria-hidden="true" />
          목록
        </Link>
      }
      footer={pack.gameType}
      sample={pack.sample}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={pack.gameType === "quote_tts" ? "caption" : "sky"}>{meta.label}</Badge>
        {pack.sample && <Badge variant="sample">샘플</Badge>}
      </div>
      <h1 className="caption-text mt-3 -rotate-1 text-[38px]">{pack.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{pack.description}</p>

      {firstSong && (
        <div className="mt-5">
          <SongImageFrame question={firstSong} />
        </div>
      )}

      <section aria-labelledby="howto-title" className="mt-6">
        <h2 id="howto-title" className="text-[15px] font-extrabold">
          이렇게 해요
        </h2>
        <ol className="mt-2 space-y-2">
          {meta.howTo.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
              <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="score-title" className="mt-6 rounded-2xl border-2 border-dashed border-ink/25 p-4">
        <h2 id="score-title" className="text-[15px] font-extrabold">
          점수
        </h2>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <li>
            바로 맞히면 <b>{SCORING.firstTry}점</b>
          </li>
          <li>
            두 번째에 맞히면 <b>{SCORING.secondTry}점</b>
          </li>
          <li>
            힌트 하나에 <b>−{SCORING.hintCost}점</b>
          </li>
          <li>
            {meta.extraHint.label} <b>−{SCORING.extraHintCost}점</b>
          </li>
        </ul>
        <p className="mt-2 text-xs text-ink/50">맞히기만 하면 최소 {SCORING.minCorrect}점은 받아요.</p>
      </section>

      {pack.gameType === "quote_tts" && <VoiceCheck />}

      {best && (
        <p className="mt-6 text-center text-sm text-ink/70">
          내 최고 기록 <b className="text-ink">{formatScore(best.score)}점</b> · {best.correctCount}/{best.total} 정답 · {formatDuration(best.durationMs)}
        </p>
      )}

      <div className="mt-6">
        <Button size="lg" className="w-full" onClick={() => navigate(`/play/${pack.id}`)}>
          <Play aria-hidden="true" className="fill-ink" />
          {pack.questions.length}문제 시작하기
        </Button>
      </div>
    </AppShell>
  );
}
