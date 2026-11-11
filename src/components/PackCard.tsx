import { Link } from "react-router-dom";
import { ChevronRight, Image as ImageIcon, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/Waveform";
import { GAME_TYPES } from "@/games/registry";
import { PlaceholderArt } from "@/games/song-image/PlaceholderArt";
import { formatScore } from "@/quiz/scoring";
import type { BestRecord } from "@/quiz/storage";
import type { QuizPack } from "@/quiz/types";

function PackThumb({ pack }: { pack: QuizPack }) {
  if (pack.gameType === "song_image") {
    const first = pack.questions[0];
    return (
      <div className="screen-panel relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl">
        {first?.image.kind === "placeholder" ? (
          <PlaceholderArt scene={first.image.scene} title="" />
        ) : (
          <ImageIcon aria-hidden="true" className="m-auto h-8 w-8 text-white/60" />
        )}
      </div>
    );
  }
  return (
    <div className="screen-panel flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl px-2">
      <Waveform seed={pack.id} active={false} bars={9} className="h-9 [&>span]:w-[4px] [&>span]:bg-caption [&>span]:opacity-90" />
    </div>
  );
}

export function PackCard({ pack, best }: { pack: QuizPack; best: BestRecord | null }) {
  const meta = GAME_TYPES[pack.gameType];
  return (
    <Link
      to={`/pack/${pack.id}`}
      data-pack-id={pack.id}
      className="group flex items-center gap-3.5 rounded-2xl border-2 border-ink bg-white p-3 shadow-sticker-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0"
    >
      <PackThumb pack={pack} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={pack.gameType === "quote_tts" ? "caption" : "sky"}>
            {pack.gameType === "quote_tts" ? <Volume2 aria-hidden="true" className="h-3 w-3" /> : <ImageIcon aria-hidden="true" className="h-3 w-3" />}
            {meta.shortLabel}
          </Badge>
          {pack.sample && <Badge variant="sample">샘플</Badge>}
        </div>
        <h3 className="truncate text-[17px] font-extrabold leading-tight">{pack.title}</h3>
        <p className="mt-0.5 text-[13px] text-ink/60">
          {pack.questions.length}문제
          {best ? (
            <>
              {" · "}
              <span className="font-bold text-ink">내 최고 {formatScore(best.score)}점</span>
            </>
          ) : (
            " · 아직 안 해 봤어요"
          )}
        </p>
      </div>
      <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-ink/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
