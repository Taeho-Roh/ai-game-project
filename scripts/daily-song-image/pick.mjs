// 후보 4장 중 1장 고르기 (사람이 고르는 게 원칙 — 기획 보고서).
//   node scripts/daily-song-image/pick.mjs --date 2026-11-12        로컬 검수 화면을 열어요 (http://127.0.0.1:9028)
//   node scripts/daily-song-image/pick.mjs --date 2026-11-12 --choose 2   화면 없이 번호로 고르기
//   node scripts/daily-song-image/pick.mjs --date 2026-11-12 --auto-pick-first
//       ※ 사람이 보지 않고 1번을 자동 선택해요. "맞힐 수 있지만 너무 쉽지 않은" 그림이라는 보장이 없어 품질이 낮아요.
//         (이상한 그림·글자가 섞인 그림이 그대로 나갈 수 있음 — 임시·테스트용)
// 결과: candidates/<날짜>/chosen.json
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { parseArgs, todayString } from "./lib/args.mjs";
import { QUEUE_FILE, candidatesDir } from "./lib/paths.mjs";
import { loadQueue } from "./lib/queue.mjs";

export function readMeta(dir) {
  const f = path.join(dir, "meta.json");
  if (!fs.existsSync(f)) throw new Error(`후보가 없어요: ${f} (먼저 generate.mjs)`);
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

export function writeChosen(dir, meta, index, { auto = false, now = new Date() } = {}) {
  const cand = meta.candidates[index - 1];
  if (!cand) throw new Error(`1~${meta.candidates.length} 번 중에서 골라 주세요`);
  const chosen = { songId: meta.songId, file: cand.file, mime: cand.mime, index, auto, pickedAt: now.toISOString() };
  fs.writeFileSync(path.join(dir, "chosen.json"), JSON.stringify(chosen, null, 2) + "\n", "utf8");
  return chosen;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function reviewPage(meta, song, existing) {
  const cards = meta.candidates
    .map(
      (c, i) => `<form method="post" action="/choose" class="card">
  <img src="/img/${esc(c.file)}" alt="후보 ${i + 1}">
  <input type="hidden" name="index" value="${i + 1}">
  <button type="submit">${i + 1}번으로 정하기</button>
</form>`,
    )
    .join("\n");
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>오늘의 그림 고르기</title>
<style>body{font-family:Pretendard,system-ui,sans-serif;margin:24px;background:#faf7f2;color:#222}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.card{background:#fff;border-radius:12px;padding:12px;box-shadow:0 1px 4px #0002}
img{width:100%;border-radius:8px;display:block}button{margin-top:8px;width:100%;padding:12px;font-size:16px;border:0;border-radius:8px;background:#222;color:#fff;cursor:pointer}
.note{background:#fff3cd;padding:10px 14px;border-radius:8px}</style>
<h1>오늘의 그림 고르기 — ${esc(meta.date)}</h1>
<p><b>${esc(song?.title ?? meta.songId)}</b> · ${esc(song?.artist ?? "")} (${esc(song?.year ?? "")}) · ${esc(meta.provider)} / ${esc(meta.model)}</p>
<p class="note">고르는 기준: 노래를 아는 사람은 <b>맞힐 수 있지만 너무 쉽지 않은</b> 그림 · 글자·로고·얼굴이 없는 그림 · 실제 앨범 표지·뮤직비디오와 닮지 않은 그림.
이상하면 넷 다 버리고 다시 만들어요(generate.mjs --force).</p>
${existing ? `<p class="note">이미 ${existing.index}번을 골랐어요${existing.auto ? " (자동 선택)" : ""}. 다시 누르면 바뀌어요.</p>` : ""}
<div class="grid">${cards}</div></html>`;
}

function startServer(dir, meta, song, port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/") {
      const chosenFile = path.join(dir, "chosen.json");
      const existing = fs.existsSync(chosenFile) ? JSON.parse(fs.readFileSync(chosenFile, "utf8")) : null;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(reviewPage(meta, song, existing));
    } else if (req.method === "GET" && url.pathname.startsWith("/img/")) {
      const name = path.basename(url.pathname);
      const cand = meta.candidates.find((c) => c.file === name);
      if (!cand) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": cand.mime });
      res.end(fs.readFileSync(path.join(dir, name)));
    } else if (req.method === "POST" && url.pathname === "/choose") {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        try {
          const index = Number(new URLSearchParams(body).get("index"));
          const chosen = writeChosen(dir, meta, index);
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<meta charset="utf-8"><p>${chosen.index}번으로 정했어요. 창을 닫고 터미널에서 Ctrl+C 로 끝내 주세요. 다음: publish.mjs</p>`);
          console.log(`${chosen.index}번으로 정했어요 → ${path.join(dir, "chosen.json")}`);
        } catch (e) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end(e.message);
        }
      });
    } else {
      res.writeHead(404).end();
    }
  });
  // 이 컴퓨터에서만 열리게 127.0.0.1 로만 묶어요
  server.listen(port, "127.0.0.1", () => console.log(`검수 화면: http://127.0.0.1:${port}  (끝내려면 Ctrl+C)`));
  return server;
}

export function run(argv = process.argv.slice(2), log = console.log) {
  const args = parseArgs(argv);
  const date = typeof args.date === "string" ? args.date : todayString();
  const dir = candidatesDir(date);
  const meta = readMeta(dir);

  if (args["auto-pick-first"] === true) {
    log("경고: --auto-pick-first 는 사람이 보지 않고 1번을 고르는 낮은 품질 옵션이에요. 임시·테스트용으로만 쓰세요.");
    const chosen = writeChosen(dir, meta, 1, { auto: true });
    log(`1번 자동 선택 → ${path.join(dir, "chosen.json")}`);
    return chosen;
  }
  if (args.choose !== undefined) {
    const chosen = writeChosen(dir, meta, Number(args.choose));
    log(`${chosen.index}번으로 정했어요 → ${path.join(dir, "chosen.json")}`);
    return chosen;
  }
  const song = loadQueue(QUEUE_FILE).songs.find((s) => s.id === meta.songId);
  return startServer(dir, meta, song, Number(args.port ?? 9028));
}

if (process.argv[1]?.endsWith("pick.mjs")) {
  try {
    run();
  } catch (e) {
    console.error(`오류: ${e.message}`);
    process.exit(1);
  }
}
