// 노래 → AI 그림 문제 화면. 지금은 샘플 SVG 그림, 나중에는 AI 로 만들고 사람이 고른 그림 파일.
import { ImageIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SongImageQuestion } from "@/quiz/types";
import { PlaceholderArt } from "./PlaceholderArt";

export function SongImageFrame({ question, number }: { question: SongImageQuestion; number?: number }) {
  const img = question.image;
  const isSample = img.kind === "placeholder";
  return (
    <figure className="screen-panel relative aspect-[4/3] overflow-hidden rounded-3xl">
      {img.kind === "placeholder" ? (
        <PlaceholderArt scene={img.scene} title={`샘플 그림: ${question.sceneDescription}`} />
      ) : (
        <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        {isSample ? (
          <Badge variant="sample" className="border-white/60 bg-ink/70 text-white">
            <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
            샘플 그림 · AI 생성 아님
          </Badge>
        ) : (
          <Badge variant="onScreen" className="bg-ink/70">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            AI 생성{img.kind === "file" ? ` · ${img.aiModel}` : ""}
          </Badge>
        )}
        {number !== undefined && <span className="font-display text-sm tracking-wide text-white/70">#{number}</span>}
      </div>
    </figure>
  );
}

export function SongMedia({ question, number, showDescription }: { question: SongImageQuestion; number: number; showDescription: boolean }) {
  return (
    <div>
      <SongImageFrame question={question} number={number} />
      <p className="mt-3 text-sm text-ink/60">
        {showDescription ? (
          <>
            <span className="font-bold text-ink">그림 설명</span> {question.sceneDescription}
          </>
        ) : (
          "그림 속 분위기를 보고 노래 제목을 맞혀 보세요. 가사는 쓰지 않았어요."
        )}
      </p>
    </div>
  );
}
