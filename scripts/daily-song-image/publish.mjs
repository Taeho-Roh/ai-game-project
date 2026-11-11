// 고른 그림을 R2 에 올리고 노래 그림 묶음에 추가해요.
//   node scripts/daily-song-image/publish.mjs --date 2026-11-12 --dry-run   할 일만 출력 (아무것도 바꾸지 않아요)
//   node scripts/daily-song-image/publish.mjs --date 2026-11-12             진짜 실행 (R2 환경변수 필요)
// 순서: ① R2 업로드 → ② src/data/song-image-daily.json 에 문제 추가 → ③ 대기열에서 곡을 done 으로.
// 업로드가 실패하면 ②③ 은 하지 않아요. 그 뒤에는 npm test → 검수(needsReview → false) → 배포(대표 승인)로 이어져요.
import fs from "node:fs";
import path from "node:path";
import { parseArgs, todayString } from "./lib/args.mjs";
import { PACK_FILE, QUEUE_FILE, candidatesDir } from "./lib/paths.mjs";
import { loadQueue, markDone, saveQueue } from "./lib/queue.mjs";
import { addQuestion, buildQuestion, loadPackOrNew, objectKey, savePack } from "./lib/pack.mjs";
import { createR2Client, missingR2Env } from "./lib/r2.mjs";

export async function run(argv = process.argv.slice(2), env = process.env, log = console.log, deps = {}) {
  const args = parseArgs(argv);
  const dryRun = args["dry-run"] === true;
  const date = typeof args.date === "string" ? args.date : todayString();
  const dir = candidatesDir(date);

  const metaFile = path.join(dir, "meta.json");
  const chosenFile = path.join(dir, "chosen.json");
  if (!fs.existsSync(metaFile)) throw new Error(`후보가 없어요: ${metaFile}`);
  if (!fs.existsSync(chosenFile)) throw new Error(`고른 그림이 없어요: pick.mjs 를 먼저 (또는 --auto-pick-first)`);
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  const chosen = JSON.parse(fs.readFileSync(chosenFile, "utf8"));
  if (chosen.songId !== meta.songId) throw new Error("meta.json 과 chosen.json 의 곡이 달라요");

  const queue = loadQueue(QUEUE_FILE);
  const song = queue.songs.find((s) => s.id === meta.songId);
  if (!song) throw new Error(`대기열에 없는 곡: ${meta.songId}`);
  if (song.status === "done") throw new Error(`이미 올린 곡이에요: ${song.id}`);

  const key = objectKey(song, date, chosen.file);
  const missing = missingR2Env(env);
  const base = (env.R2_PUBLIC_BASE_URL ?? "https://<R2 공개 주소>").replace(/\/+$/, "");
  const publicUrl = `${base}/${key}`;
  const question = buildQuestion({ song, publicUrl, model: meta.model, auto: chosen.auto === true });

  log(`곡: ${song.title} — ${song.artist} (${song.year})${chosen.auto ? "  [자동 선택 · 낮은 품질]" : ""}`);
  log(`고른 그림: ${chosen.file} → R2 ${key}`);
  log(`AI 표시: "AI 생성 · ${meta.model}"`);
  log(`묶음에 추가될 문제:\n${JSON.stringify(question, null, 2)}`);

  if (dryRun) {
    log(missing.length ? `[dry-run] R2 환경변수 없음: ${missing.join(", ")} (실제 실행 때 필요)` : "[dry-run] R2 환경변수 확인됨.");
    log("[dry-run] 업로드·파일 수정을 하지 않았어요.");
    return { dryRun: true, question, key };
  }
  if (missing.length) throw new Error(`R2 환경변수가 없어서 올리지 않아요: ${missing.join(", ")}`);

  const r2 = deps.r2 ?? createR2Client({ env });
  const body = fs.readFileSync(path.join(dir, chosen.file));
  const uploaded = await r2.putObject(key, body, chosen.mime ?? "image/png");
  log(`R2 업로드 완료: ${uploaded.url}`);

  const pack = addQuestion(loadPackOrNew(PACK_FILE, date), buildQuestion({ song, publicUrl: uploaded.url, model: meta.model, auto: chosen.auto === true }));
  savePack(PACK_FILE, pack);
  saveQueue(QUEUE_FILE, markDone(queue, song.id, { doneAt: date, pickedBy: chosen.auto ? "auto" : "human" }));
  log(`묶음에 추가 완료 (${pack.questions.length}문제). 다음: npm test → 검수 → 배포는 대표 승인 후.`);
  return { uploaded, pack };
}

if (process.argv[1]?.endsWith("publish.mjs")) {
  run().catch((e) => {
    console.error(`오류: ${e.message}`);
    process.exit(1);
  });
}
