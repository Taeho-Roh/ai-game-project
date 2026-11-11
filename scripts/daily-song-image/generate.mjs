// 오늘의 노래 그림 후보 만들기.
//   node scripts/daily-song-image/generate.mjs --dry-run            프롬프트만 출력 (아무것도 쓰지 않고, 돈도 안 들어요)
//   node scripts/daily-song-image/generate.mjs --provider openai    진짜 호출 (OPENAI_API_KEY 필요, 4장 ≈ 60원)
//   node scripts/daily-song-image/generate.mjs --provider gemini    진짜 호출 (GEMINI_API_KEY 필요, 4장 ≈ 220원)
// 옵션: --count 4  --date 2026-11-12  --song <곡 id>
// 결과: scripts/daily-song-image/candidates/<날짜>/1.png ~ 4.png + meta.json
import fs from "node:fs";
import path from "node:path";
import { parseArgs, todayString } from "./lib/args.mjs";
import { QUEUE_FILE, candidatesDir } from "./lib/paths.mjs";
import { loadQueue, nextPending, queueStats } from "./lib/queue.mjs";
import { buildImagePrompt } from "./lib/prompt.mjs";
import { getProvider } from "./providers/index.mjs";

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function run(argv = process.argv.slice(2), env = process.env, log = console.log) {
  const args = parseArgs(argv);
  const dryRun = args["dry-run"] === true;
  const date = typeof args.date === "string" ? args.date : todayString();
  const count = Number(args.count ?? 4);
  if (!Number.isInteger(count) || count < 1 || count > 8) throw new Error("--count 는 1~8 사이 정수");

  const queue = loadQueue(QUEUE_FILE);
  const stats = queueStats(queue);
  const song = nextPending(queue, typeof args.song === "string" ? args.song : undefined);
  if (!song) {
    log("대기열이 비었어요. data-queue/songs.json 에 곡을 더 추가해 주세요.");
    return { done: true };
  }
  const provider = getProvider(typeof args.provider === "string" ? args.provider : "openai", { env });
  const prompt = buildImagePrompt(song);
  const outDir = candidatesDir(date);
  const cost = provider.estimatedWonPerImage * count;

  log(`대기열: 전체 ${stats.total}곡 · 완료 ${stats.done} · 남음 ${stats.pending}`);
  log(`오늘의 곡: ${song.title} — ${song.artist} (${song.year})  [id: ${song.id}]`);
  log(`제공자: ${provider.name} / 모델: ${provider.model} / 후보 ${count}장 / 예상 비용 약 ${cost}원`);
  log(`저장 위치: ${outDir}`);
  log("---------- 그림 프롬프트 (가사·제목·가수 없음) ----------");
  log(prompt);
  log("----------------------------------------------------------");

  if (dryRun) {
    log("[dry-run] 아무것도 쓰지 않았고 API 도 부르지 않았어요.");
    return { dryRun: true, song, prompt };
  }
  if (!provider.isConfigured()) {
    throw new Error(`${provider.envVar} 환경변수가 없어서 실제 생성은 하지 않아요. (확인만 하려면 --dry-run)`);
  }
  if (fs.existsSync(path.join(outDir, "meta.json")) && !args.force) {
    throw new Error(`${outDir} 에 이미 후보가 있어요. 다시 만들려면 --force (돈이 다시 들어요).`);
  }

  const images = await provider.generate({ prompt, count });
  fs.mkdirSync(outDir, { recursive: true });
  const files = images.map((img, i) => {
    const name = `${i + 1}.${EXT[img.mime] ?? "png"}`;
    fs.writeFileSync(path.join(outDir, name), img.bytes);
    return { file: name, mime: img.mime };
  });
  const meta = {
    songId: song.id,
    date,
    provider: provider.name,
    model: provider.model,
    prompt,
    createdAt: new Date().toISOString(),
    candidates: files,
  };
  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
  log(`후보 ${files.length}장을 만들었어요. 다음: node scripts/daily-song-image/pick.mjs --date ${date}`);
  return { meta };
}

if (process.argv[1]?.endsWith("generate.mjs")) {
  run().catch((e) => {
    console.error(`오류: ${e.message}`);
    process.exit(1);
  });
}
