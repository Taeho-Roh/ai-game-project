// 샘플 그림 — 코드로 그린 단순한 장면이에요. 실제 앨범 아트·뮤직비디오 장면·AI 그림이 아니에요.
import { useId } from "react";
import type { PlaceholderScene, SceneObject } from "@/quiz/types";
import { ART_HEIGHT as H, ART_WIDTH as W, particleLayout, skylineLayout } from "./layout";

const CONFETTI_TONES = ["#FFD83D", "#FF4F8B", "#4FA3FF", "#23C99A"];

const LAMPS = [
  { x: 96, top: 150, base: 262, big: true },
  { x: 304, top: 150, base: 262, big: true },
  { x: 150, top: 168, base: 214, big: false },
  { x: 250, top: 168, base: 214, big: false },
];

const FRUITS: [number, number, number][] = [
  [150, 262, 16],
  [176, 270, 18],
  [204, 262, 17],
  [230, 272, 16],
  [190, 248, 15],
  [218, 246, 14],
  [164, 246, 13],
];

export function PlaceholderArt({ scene, title }: { scene: PlaceholderScene; title: string }) {
  const uid = useId().replace(/:/g, "");
  const has = (o: SceneObject) => scene.objects.includes(o);
  const particleSpec = scene.particles;
  const particles = particleSpec ? particleLayout(scene.seed, particleSpec.count) : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="block h-full w-full">
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.sky[0]} />
          <stop offset="1" stopColor={scene.sky[1]} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor="#FFF4C2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF4C2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#sky-${uid})`} />

      {has("sun") && (
        <g>
          <circle cx={300} cy={78} r={70} fill={`url(#glow-${uid})`} />
          <circle cx={300} cy={78} r={36} fill="#FFF3B0" />
        </g>
      )}
      {has("moon") && (
        <g>
          <circle cx={312} cy={66} r={56} fill={`url(#glow-${uid})`} opacity={0.6} />
          <circle cx={312} cy={66} r={26} fill="#FFF6D6" />
          <circle cx={302} cy={60} r={4} fill="#EADFB8" />
          <circle cx={318} cy={74} r={3} fill="#EADFB8" />
        </g>
      )}

      {has("city") &&
        skylineLayout(scene.seed).map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={H - b.height} width={b.width} height={b.height} fill="#1B1240" />
            {b.windows.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width={5} height={7} fill={w.lit ? "#FFD83D" : "#2E2260"} />
            ))}
          </g>
        ))}

      {has("sea") && (
        <g>
          <rect x={0} y={190} width={W} height={70} fill="#3FA7D6" />
          <path
            d="M0 196 Q 25 188 50 196 T 100 196 T 150 196 T 200 196 T 250 196 T 300 196 T 350 196 T 400 196"
            stroke="#E8F7FF"
            strokeWidth={3}
            fill="none"
          />
          <rect x={0} y={244} width={W} height={56} fill="#F7D9A0" />
        </g>
      )}

      {has("hills") && (
        <g>
          <path d={`M0 238 Q 90 200 190 232 T 400 222 V ${H} H 0 Z`} fill="#CBD6EA" />
          <path d={`M0 262 Q 120 232 230 258 T 400 252 V ${H} H 0 Z`} fill="#EEF3FB" />
        </g>
      )}

      {has("road") && (
        <g>
          <rect x={0} y={190} width={W} height={H - 190} fill="#3A2C5C" />
          <polygon points={`40,${H} 360,${H} 214,190 186,190`} fill="#231B3D" />
          {[0, 1, 2, 3, 4].map((i) => {
            const t0 = i / 5;
            const t1 = t0 + 0.09;
            const y0 = 190 + (H - 190) * t0;
            const y1 = 190 + (H - 190) * t1;
            const w0 = 1 + 5 * t0;
            const w1 = 1 + 5 * t1;
            return (
              <polygon
                key={i}
                points={`${200 - w0},${y0} ${200 + w0},${y0} ${200 + w1},${y1} ${200 - w1},${y1}`}
                fill="#FFE7A0"
                opacity={0.8}
              />
            );
          })}
        </g>
      )}

      {has("lamps") &&
        LAMPS.map((l, i) => (
          <g key={i}>
            <circle cx={l.x} cy={l.top} r={l.big ? 34 : 20} fill={`url(#glow-${uid})`} />
            <rect x={l.x - 1.5} y={l.top} width={3} height={l.base - l.top} fill="#120D24" />
            <circle cx={l.x} cy={l.top} r={l.big ? 6 : 4} fill="#FFF0B3" />
          </g>
        ))}

      {has("plate") && (
        <g>
          <rect x={0} y={214} width={W} height={H - 214} fill="#2A1F3D" />
          <ellipse cx={200} cy={250} rx={128} ry={30} fill="#E9E4F2" />
          <ellipse cx={200} cy={248} rx={104} ry={21} fill="#F7F4FB" />
          <polygon points="140,236 236,236 262,224 166,224" fill="#7A402A" />
          <polygon points="140,236 236,236 236,256 140,256" fill="#5B2E1E" />
          <polygon points="236,236 262,224 262,244 236,256" fill="#4A2416" />
        </g>
      )}

      {has("fruits") && (
        <g>
          {FRUITS.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill="#E8364F" />
              <circle cx={x - r / 3} cy={y - r / 3} r={r / 4} fill="#FF8A9A" />
              <path d={`M${x} ${y - r} q 4 -8 10 -8`} stroke="#2F8F4E" strokeWidth={3} fill="none" />
            </g>
          ))}
        </g>
      )}

      {particleSpec &&
        particles.map((p, i) => {
          const color = particleSpec.kind === "confetti" ? (CONFETTI_TONES[p.tone] ?? particleSpec.color) : particleSpec.color;
          switch (particleSpec.kind) {
            case "petal":
              return (
                <ellipse
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  rx={p.size}
                  ry={p.size * 0.55}
                  fill={color}
                  opacity={p.opacity}
                  transform={`rotate(${p.rotation} ${p.x} ${p.y})`}
                />
              );
            case "snow":
              return <circle key={i} cx={p.x} cy={p.y} r={p.size * 0.6} fill={color} opacity={p.opacity} />;
            case "star":
              return (
                <path
                  key={i}
                  d={`M${p.x} ${p.y - p.size} L${p.x + p.size * 0.3} ${p.y} L${p.x} ${p.y + p.size} L${p.x - p.size * 0.3} ${p.y} Z`}
                  fill={color}
                  opacity={p.opacity}
                />
              );
            case "confetti":
              return (
                <rect
                  key={i}
                  x={p.x}
                  y={p.y}
                  width={p.size * 1.4}
                  height={p.size * 0.6}
                  fill={color}
                  transform={`rotate(${p.rotation} ${p.x} ${p.y})`}
                />
              );
            case "rain":
              return (
                <line key={i} x1={p.x} y1={p.y} x2={p.x - 3} y2={p.y + p.size * 3} stroke={color} strokeWidth={1.2} opacity={p.opacity} />
              );
            default:
              return null;
          }
        })}
    </svg>
  );
}
