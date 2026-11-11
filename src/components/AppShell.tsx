import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";
import type { GameTypeId } from "@/quiz/types";

/** 로고 — 작은 화면 아이콘 + 자막체 이름 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 rounded-lg", className)} aria-label={`${SITE.name} 처음으로`}>
      <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7" />
      <span className="caption-text text-[24px] [--cap-stroke:0.09em]">{SITE.name}</span>
    </Link>
  );
}

/** 바닥 안내 — 어떤 게임을 보고 있는지에 따라 필요한 표시만 */
export type FooterKind = "home" | GameTypeId;

function FooterLabel({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-paper">{children}</span>;
}

export function SiteFooter({ kind = "home", sample }: { kind?: FooterKind; sample?: boolean }) {
  const quote = kind === "home" || kind === "quote_tts";
  const song = kind === "home" || kind === "song_image";
  return (
    <footer className="mt-10 border-t border-ink/10 pb-10 pt-5 text-[13px] leading-relaxed text-ink/60">
      {quote && (
        <>
          <p className="mb-2 flex flex-wrap items-center gap-1.5">
            <FooterLabel>AI·TTS 음성</FooterLabel>
            <span>대사는 기기에 들어 있는 일반 TTS 음성이 읽어요. 배우 목소리를 흉내 내지 않아요.</span>
          </p>
          <ul className="mb-3 space-y-1">
            <li>대사는 출처 표시 목적의 짧은 인용이에요. 정답을 확인하면 작품명과 연도를 함께 보여 드려요.</li>
            <li>영화 스틸컷·포스터·원본 음성은 쓰지 않아요.</li>
          </ul>
        </>
      )}
      {song && (
        <>
          <p className="mb-2 flex flex-wrap items-center gap-1.5">
            <FooterLabel>{kind === "song_image" && sample ? "샘플 그림" : "AI 생성 그림"}</FooterLabel>
            <span>노래 그림은 우리가 직접 쓴 분위기 설명으로 만들어요. 가사는 쓰지 않아요.</span>
          </p>
          <ul className="mb-3 space-y-1">
            <li>앨범 표지·뮤직비디오 장면·가수 얼굴을 따라 그리지 않아요.</li>
            {(kind === "home" || sample) && <li>지금 노래 그림은 흐름 확인용 샘플이에요(AI 생성 아님). 실제 문제에는 “AI 생성” 표시를 붙여요.</li>}
          </ul>
        </>
      )}
      <p>점수 기록은 이 기기에만 저장돼요.</p>
    </footer>
  );
}

export function AppShell({
  children,
  headerRight,
  footer = "home",
  sample,
}: {
  children: ReactNode;
  headerRight?: ReactNode;
  footer?: FooterKind;
  sample?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        본문으로 건너뛰기
      </a>
      <header className="flex h-16 items-center justify-between">
        <Logo />
        {headerRight}
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter kind={footer} sample={sample} />
    </div>
  );
}
