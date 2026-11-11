// 끝까지 한 판 돌려 보고 화면을 찍는 점검 스크립트 (Playwright + vite preview)
//   npm run build && npm run e2e:screens
// - 설치된 Chromium 을 그대로 써요 (playwright install 안 함). 경로는 CHROME_PATH 로 바꿀 수 있어요.
// - 헤드리스 Chromium 에는 음성이 없어서 speechSynthesis 를 가짜로 바꿔 끼워요.
//   가짜 음성 목록: 남성(InJoon) → 여성(Heami) 순서 — 앱이 여성 음성을 고르는지 확인해요.
// - 서버·DB 에 아무것도 쓰지 않아요. 기록은 브라우저 localStorage 뿐.
import { chromium, devices } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.SCREEN_DIR ?? "D:/Taeho/reports/2026-11-11/ai-game";
const CHROME =
  process.env.CHROME_PATH ?? path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright/chromium-1243/chrome-win64/chrome.exe");
const PORT = 9018;
const BASE = `http://localhost:${PORT}`;

const readJson = async (p) => JSON.parse(await fs.readFile(path.join(ROOT, p), "utf8"));
const movie = await readJson("src/data/quote-movie-lines.json");
const drama = await readJson("src/data/quote-drama-lines.json");
const song = await readJson("src/data/song-image-sample.json");
const byId = new Map([...movie.questions, ...drama.questions, ...song.questions].map((q) => [q.id, q]));

const log = [];
const check = (cond, msg) => {
  if (!cond) throw new Error(`확인 실패: ${msg}`);
  log.push(`OK  ${msg}`);
};

// ---------- 가짜 음성 ----------
function installFakeSpeech(voices) {
  window.__spoken = [];
  let current = null;
  let timers = [];
  const listeners = {};
  class FakeUtterance {
    constructor(text) {
      Object.assign(this, { text, lang: "", voice: null, rate: 1, pitch: 1, volume: 1, onstart: null, onend: null, onerror: null });
    }
  }
  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => voices,
    speak(u) {
      window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null, rate: u.rate, pitch: u.pitch });
      current = u;
      synth.speaking = true;
      timers.push(setTimeout(() => u.onstart && u.onstart({}), 20));
      timers.push(
        setTimeout(() => {
          synth.speaking = false;
          current = null;
          u.onend && u.onend({});
        }, 2500),
      );
    },
    cancel() {
      timers.forEach(clearTimeout);
      timers = [];
      if (current && current.onerror) current.onerror({ error: "interrupted" });
      current = null;
      synth.speaking = false;
    },
    pause() {},
    resume() {},
    addEventListener(t, f) {
      (listeners[t] ??= []).push(f);
    },
    removeEventListener(t, f) {
      listeners[t] = (listeners[t] ?? []).filter((x) => x !== f);
    },
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = FakeUtterance;
}

const KO_VOICES = [
  { name: "Microsoft InJoon Online (Natural) - Korean (Korea)", lang: "ko-KR", default: false, localService: false, voiceURI: "injoon" },
  { name: "Microsoft Heami - Korean (Korean)", lang: "ko-KR", default: false, localService: true, voiceURI: "heami" },
  { name: "Microsoft Zira - English (United States)", lang: "en-US", default: true, localService: true, voiceURI: "zira" },
];
const EN_ONLY = [KO_VOICES[2]];

// ---------- 서버 ----------
async function startPreview() {
  const proc = spawn(process.execPath, [path.join(ROOT, "node_modules/vite/bin/vite.js"), "preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  proc.stderr.on("data", (d) => process.stderr.write(d));
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return proc;
    } catch {
      /* 아직 안 뜸 */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  proc.kill();
  throw new Error("vite preview 가 뜨지 않았어요 (npm run build 를 먼저 했나요?)");
}

function watchErrors(page, name) {
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${name} pageerror: ${e.message}`));
  return errors;
}

const shot = (page, file, fullPage = true) => page.screenshot({ path: path.join(OUT, file), fullPage });
const currentQuestion = async (page) => byId.get(await page.getByTestId("question").getAttribute("data-question-id"));
const nextButton = (page) => page.getByRole("button", { name: /다음 문제|결과 보기/ });

async function goNext(page) {
  await page.waitForTimeout(300); // Enter 연타 방지 시간(250ms) 지나고
  await nextButton(page).click();
}

async function answer(page, text, { enter = true } = {}) {
  const input = page.getByLabel(/어느 작품의 대사일까요|어떤 노래일까요/);
  await input.fill(text);
  if (enter) await input.press("Enter");
  else await page.getByRole("button", { name: "확인" }).click();
}

// ---------- 실행 ----------
await fs.mkdir(OUT, { recursive: true });
const server = await startPreview();
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const mobile = { ...devices["Pixel 7"], deviceScaleFactor: 2, locale: "ko-KR" };
const allErrors = [];

try {
  // ===== 1. 휴대폰: 영화 명대사 한 판 =====
  const ctx = await browser.newContext(mobile);
  await ctx.addInitScript(installFakeSpeech, KO_VOICES);
  const page = await ctx.newPage();
  allErrors.push(...watchErrors(page, "mobile"));

  await page.goto(BASE);
  await page.getByRole("heading", { name: "퀴즈 묶음" }).waitFor();
  await page.waitForTimeout(400);
  await shot(page, "01-home.png");
  check((await page.locator("[data-pack-id]").count()) === 3, "홈에 퀴즈 묶음 3개");

  // 최신순 탭
  await page.getByRole("tab", { name: "최신순" }).click();
  check((await page.locator("[data-pack-id]").first().getAttribute("data-pack-id")) !== "song-image-sample", "최신순 정렬 동작");
  await page.getByRole("tab", { name: "인기순" }).click();

  await page.locator('[data-pack-id="movie-lines"]').click();
  await page.getByRole("heading", { name: "이렇게 해요" }).waitFor();
  await page.getByRole("button", { name: "소리 들어 보기" }).click();
  await page.waitForTimeout(200);
  const test = await page.evaluate(() => window.__spoken.at(-1));
  check(test?.lang === "ko-KR" && test?.voice === "Microsoft Heami - Korean (Korean)", `소리 확인: ko-KR 여성 음성(Heami) 선택 — ${test?.voice}`);
  await shot(page, "02-pack-start.png");

  await page.getByRole("button", { name: /문제 시작하기/ }).click();
  await page.getByTestId("question").waitFor();

  const total = movie.questions.length;
  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    const q = await currentQuestion(page);
    check(!!q, `${i + 1}번 문제 데이터 찾음 (${q?.id})`);

    if (i === 0) {
      // 자동 재생 + 대사 글자는 숨김
      await page.waitForFunction(() => window.__spoken.length >= 2);
      const spoken = await page.evaluate(() => window.__spoken.at(-1));
      check(spoken.text === (q.speakText ?? q.line), `자동 재생: "${spoken.text}"`);
      check(spoken.pitch === 1, "음높이 그대로 (흉내 연출 없음)");
      check((await page.getByTestId("quote-line").count()) === 0, "정답 전에는 대사 글자를 숨김");
      await page.waitForTimeout(250);
      await shot(page, "03-question.png");

      // 힌트: 초성 → 대사 보기
      await page.getByRole("button", { name: /힌트: 초성 보기/ }).click();
      await page.getByRole("button", { name: /대사 보기/ }).click();
      await page.getByTestId("quote-line").waitFor();
      check((await page.getByTestId("hints").innerText()).includes("초성"), "초성 힌트 표시");
      await page.waitForTimeout(400);
      await shot(page, "04-hint.png");

      await answer(page, q.answer); // Enter 로 제출
      await page.getByTestId("reveal").waitFor();
      check((await page.getByTestId("reveal").getAttribute("data-outcome")) === "correct", "정답 처리 (Enter 제출)");
      check((await page.getByTestId("reveal-source").innerText()).includes(String(q.year)), "정답 공개에 출처(작품명·연도)");
      check((await page.getByTestId("reveal-line").innerText()).includes(q.line), "정답 공개 뒤 대사 자막 표시");
      await page.waitForTimeout(500);
      await shot(page, "05-reveal-correct.png");
      correctCount++;
    } else if (i === 1) {
      await answer(page, "모르는영화");
      await page.getByText(/기회가 1번 남았어요/).waitFor();
      check(true, "첫 오답 뒤 기회 1번 남음 안내");
      await page.waitForTimeout(400);
      await shot(page, "06-wrong-first-try.png");
      await answer(page, "전혀다른제목", { enter: false });
      await page.getByTestId("reveal").waitFor();
      check((await page.getByTestId("reveal").getAttribute("data-outcome")) === "wrong", "두 번 틀리면 오답 공개");
      await page.waitForTimeout(500);
      await shot(page, "07-reveal-wrong.png");
    } else if (i === 2) {
      await page.getByRole("button", { name: /넘어갈게요/ }).click();
      await page.getByTestId("reveal").waitFor();
      check((await page.getByTestId("reveal").getAttribute("data-outcome")) === "skipped", "건너뛰기");
    } else {
      // 여러 형태의 정답: 영어 별칭 · 띄어쓰기 없앤 제목 · 괄호 연도 덧붙임 · 공식 제목
      const variants = [
        q.aliases.find((a) => /^[A-Za-z]/.test(a)) ?? q.answer,
        q.answer.replace(/\s/g, ""),
        `${q.answer} (${q.year})`,
        q.officialTitle ?? q.answer.toUpperCase(),
      ];
      const pick = variants[i % variants.length];
      // 두 문제는 첫 기회에 틀리고 두 번째에 맞혀요
      if (i === 5 || i === 9) await answer(page, "틀린답");
      await answer(page, pick);
      await page.getByTestId("reveal").waitFor();
      const outcome = await page.getByTestId("reveal").getAttribute("data-outcome");
      check(outcome === "correct", `${i + 1}번 "${pick}" → 정답 (${q.answer})`);
      correctCount++;
    }
    await goNext(page);
  }

  await page.getByTestId("result").waitFor();
  await page.getByTestId("share-card").waitFor();
  await page.waitForTimeout(600);
  const shareText = await page.getByTestId("share-text").innerText();
  check(shareText.includes(`${total}문제 중 ${correctCount}개 정답`), `결과: ${total}문제 중 ${correctCount}개 정답`);
  await shot(page, "08-results.png");

  // 공유 카드 이미지 그대로 저장
  const dataUrl = await page.getByTestId("share-card").getAttribute("src");
  await fs.writeFile(path.join(OUT, "09-share-card.png"), Buffer.from(dataUrl.split(",")[1], "base64"));
  check(dataUrl.length > 20_000, "공유 카드 이미지 생성");

  const best = await page.evaluate(() => localStorage.getItem("aigame:v1:best:movie-lines"));
  check(!!best && JSON.parse(best).correctCount === correctCount, "최고 기록 localStorage 저장");

  await page.goto(BASE);
  await page.getByText(/내 최고/).first().waitFor();
  check(true, "홈 카드에 내 최고 기록 표시");
  await shot(page, "10-home-with-best.png", false);

  // ===== 2. 노래 그림 샘플 =====
  await page.goto(`${BASE}/pack/song-image-sample`);
  await page.getByRole("button", { name: /문제 시작하기/ }).click();
  await page.getByTestId("question").waitFor();
  const sq = await currentQuestion(page);
  check((await page.getByText("샘플 그림 · AI 생성 아님").count()) > 0, "샘플 그림 표시");
  await page.getByRole("button", { name: /그림 설명 보기/ }).click();
  await page.waitForTimeout(300);
  await shot(page, "11-song-image-question.png");
  await answer(page, sq.answer);
  await page.getByTestId("reveal").waitFor();
  check((await page.getByTestId("reveal").getAttribute("data-outcome")) === "correct", `노래 그림 정답 (${sq.answer})`);
  await page.waitForTimeout(500);
  await shot(page, "12-song-image-reveal.png");
  await ctx.close();

  // ===== 3. 한국어 음성이 없는 기기 =====
  const ctx2 = await browser.newContext(mobile);
  await ctx2.addInitScript(installFakeSpeech, EN_ONLY);
  const page2 = await ctx2.newPage();
  allErrors.push(...watchErrors(page2, "no-voice"));
  await page2.goto(`${BASE}/play/drama-lines`);
  await page2.getByText(/한국어 음성이 없어요/).waitFor({ timeout: 5000 });
  await page2.getByTestId("quote-line").waitFor();
  check((await page2.getByRole("button", { name: /대사 보기/ }).count()) === 0, "한국어 음성 없음: 대사를 감점 없이 글자로 보여 줌");
  await page2.waitForTimeout(300);
  await shot(page2, "13-no-korean-voice.png");
  await ctx2.close();

  // ===== 4. 키보드만으로 (데스크톱) =====
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "ko-KR" });
  await ctx3.addInitScript(installFakeSpeech, KO_VOICES);
  const page3 = await ctx3.newPage();
  allErrors.push(...watchErrors(page3, "desktop"));
  await page3.goto(`${BASE}/play/drama-lines`);
  await page3.getByTestId("question").waitFor();
  check(await page3.evaluate(() => document.activeElement?.id === "answer-input"), "데스크톱: 문제 화면에서 입력칸에 바로 초점");
  const dq = await currentQuestion(page3);
  await page3.keyboard.type(dq.answer);
  await page3.keyboard.press("Enter");
  await page3.getByTestId("reveal").waitFor();
  check(await page3.evaluate(() => document.activeElement?.textContent?.includes("다음 문제")), "정답 공개 뒤 '다음 문제'에 초점");
  await page3.waitForTimeout(300);
  await page3.keyboard.press("Enter");
  await page3.getByTestId("question").waitFor();
  check(await page3.evaluate(() => document.activeElement?.id === "answer-input"), "Enter 로 다음 문제 → 입력칸 초점");
  await shot(page3, "14-desktop-keyboard.png", false);
  await ctx3.close();

  check(allErrors.length === 0, `브라우저 오류 없음${allErrors.length ? `: ${allErrors.join(" | ")}` : ""}`);
} finally {
  await browser.close();
  server.kill();
  console.log(log.join("\n"));
  console.log(`\n화면 저장 위치: ${OUT}`);
}
