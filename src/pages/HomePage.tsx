import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PackCard } from "@/components/PackCard";
import { Waveform } from "@/components/Waveform";
import { buttonVariants } from "@/components/ui/button";
import { PACKS, sortPacks, type PackSort } from "@/data";
import { loadBest } from "@/quiz/storage";
import { cn } from "@/lib/utils";

const TABS: { id: PackSort; label: string }[] = [
  { id: "popular", label: "인기순" },
  { id: "new", label: "최신순" },
];

export default function HomePage() {
  const [sort, setSort] = useState<PackSort>("popular");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const packs = useMemo(() => sortPacks(PACKS, sort), [sort]);
  const bests = useMemo(() => Object.fromEntries(PACKS.map((p) => [p.id, loadBest(p.id)])), []);
  const featured = sortPacks(PACKS, "popular")[0];

  // 탭 목록은 화살표 키로 옮겨 다닐 수 있어요
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setSort(TABS[next]!.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <AppShell>
      {/* 히어로 — 극장 화면 + 화면 모서리에 걸친 예능 자막 */}
      <section aria-labelledby="hero-title" className="pt-1">
        <div className="screen-panel relative aspect-[16/11] overflow-hidden rounded-[28px]">
          <span className="absolute left-3 top-3 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/80 ring-1 ring-white/15">
            AI·TTS 음성
          </span>
          <div className="absolute inset-x-8 top-[20%] h-[34%]">
            <Waveform seed="hero" active />
          </div>
          <p className="subtitle-text absolute inset-x-0 bottom-[22%] px-6 text-center text-[19px]">이 대사, 어디서 들어 봤더라?</p>
        </div>
        <h1
          id="hero-title"
          className="caption-text relative z-10 -mt-9 -rotate-[1.5deg] px-2 text-center text-[40px] leading-[1.08]"
        >
          명대사 듣고
          <br />
          작품 맞히기!
        </h1>
        <p className="mx-auto mt-4 max-w-[340px] text-center text-[15px] leading-relaxed text-ink/70">
          AI 목소리가 짧은 대사 한 줄을 읽어 줘요. 어느 영화·드라마였는지 맞혀 보세요.
        </p>
        {featured && (
          <div className="mt-5 flex justify-center">
            <Link to={`/pack/${featured.id}`} className={cn(buttonVariants({ size: "lg" }), "px-7")}>
              <Play aria-hidden="true" className="fill-ink" />
              {featured.title}부터 시작
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="packs-title" className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="packs-title" className="text-lg font-extrabold">
            퀴즈 묶음
          </h2>
          <div role="tablist" aria-label="정렬" className="flex rounded-full border border-ink/15 bg-white p-0.5">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={sort === t.id}
                aria-controls="pack-list"
                tabIndex={sort === t.id ? 0 : -1}
                onClick={() => setSort(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky",
                  sort === t.id ? "bg-ink text-paper" : "text-ink/55 hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <ul id="pack-list" role="tabpanel" aria-labelledby={`tab-${sort}`} className="space-y-3">
          {packs.map((p) => (
            <li key={p.id}>
              <PackCard pack={p} best={bests[p.id] ?? null} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink/45">
          {sort === "popular"
            ? "지금은 운영팀 추천 순서예요. 서버가 생기면 실제 플레이 수로 바꿔요."
            : "새로 올라온 묶음부터 보여 드려요."}
        </p>
      </section>
    </AppShell>
  );
}
