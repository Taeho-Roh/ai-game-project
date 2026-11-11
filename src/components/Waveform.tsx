import { useMemo } from "react";
import { seededRandom } from "@/quiz/random";
import { cn } from "@/lib/utils";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 음성 파형 막대 — 읽는 중에만 움직여요 (동작 줄이기 설정이면 멈춤) */
export function Waveform({ seed, active, bars = 28, className }: { seed: string; active: boolean; bars?: number; className?: string }) {
  const heights = useMemo(() => {
    const rnd = seededRandom(hashString(seed));
    return Array.from({ length: bars }, (_, i) => {
      const envelope = Math.sin((Math.PI * (i + 0.5)) / bars); // 가운데가 높게
      return 0.18 + envelope * (0.35 + rnd() * 0.47);
    });
  }, [seed, bars]);

  return (
    <div aria-hidden="true" className={cn("flex h-full items-center justify-center gap-[3px]", className)}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "block w-[5px] origin-center rounded-full transition-opacity duration-300",
            active ? "animate-wave-bar bg-caption opacity-100" : "bg-white opacity-30",
          )}
          style={{
            height: `${Math.round(h * 100)}%`,
            animationDelay: active ? `${(i % 7) * 90}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
