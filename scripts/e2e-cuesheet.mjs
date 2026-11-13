// 나의PD 큐시트 점검: 만들기 → 편집(순서·시간) → 새로고침 후 유지 → 진행 모드 → 화면 사진
//   npm run build && node scripts/e2e-cuesheet.mjs
import { chromium, devices } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.SCREEN_DIR ?? "D:/Taeho/reports/2026-11-13/cuesheet";
const CHROME =
  process.env.CHROME_PATH ?? path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright/chromium-1243/chrome-win64/chrome.exe");
const PORT = 9019;
const BASE = `http://localhost:${PORT}`;
await fs.mkdir(OUT, { recursive: true });

const log = [];
const check = (cond, msg) => {
  if (!cond) throw new Error(`확인 실패: ${msg}`);
  log.push(`OK  ${msg}`);
};

const server = spawn(process.execPath, [path.join(ROOT, "node_modules/vite/bin/vite.js"), "preview", "--port", String(PORT), "--strictPort"], {
  cwd: ROOT,
  stdio: "ignore",
});
try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* 아직 안 떴어요 */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}/pd`);
  await page.screenshot({ path: path.join(OUT, "01-form.png"), fullPage: true });

  // 잘못된 입력은 안내만
  await page.fill("#pd-people", "1");
  await page.getByRole("button", { name: "큐시트 만들기" }).click();
  check(await page.getByRole("alert").isVisible(), "인원 1명이면 안내 문구가 떠요");
  await page.fill("#pd-people", "8");

  await page.getByRole("button", { name: "큐시트 만들기" }).click();
  await page.waitForURL(/\/pd\/sheet-/);
  const items = page.getByRole("list", { name: "큐시트" }).locator("> li");
  const n = await items.count();
  check(n >= 5, `코너 ${n}개가 나와요`);
  const text = await page.locator("main").innerText();
  check(text.includes("합계 90분"), "합계가 90분이에요");
  check(text.includes("퀴즈 라운드"), "퀴즈 라운드가 들어 있어요");
  check(text.includes("19:00"), "시작 시각 19:00 이 보여요");
  await page.screenshot({ path: path.join(OUT, "02-sheet.png"), fullPage: true });

  // 순서 바꾸기: 두 번째 코너를 아래로 → 제목이 바뀜
  const t1 = await items.nth(1).locator("h2").innerText();
  const t2 = await items.nth(2).locator("h2").innerText();
  await items.nth(1).getByRole("button", { name: /아래로/ }).click();
  check((await items.nth(1).locator("h2").innerText()) === t2 && (await items.nth(2).locator("h2").innerText()) === t1, "코너 순서가 바뀌어요");

  // 시간 늘리기 → 합계가 달라지고 안내가 떠요
  await items.nth(1).locator("input").fill("20");
  check((await page.locator("main").innerText()).includes("길어요"), "시간을 늘리면 '처음 요청보다 길어요' 안내가 떠요");

  // 새로고침해도 유지
  await page.reload();
  check((await page.locator("main").innerText()).includes("길어요"), "새로고침해도 편집 내용이 남아요");

  // 홈에 저장 목록
  await page.goto(`${BASE}/pd`);
  check(await page.getByRole("heading", { name: "내가 만든 큐시트" }).isVisible(), "홈에 저장된 큐시트 목록이 보여요");

  // 진행 모드
  await page.getByRole("link", { name: /회식 8명/ }).click();
  await page.getByRole("link", { name: "진행 모드" }).click();
  await page.waitForURL(/\/live$/);
  const timer = page.getByRole("timer");
  const before = await timer.innerText();
  await page.getByRole("button", { name: "시작" }).click();
  await page.waitForTimeout(2300);
  const after = await timer.innerText();
  check(before !== after, `타이머가 흘러요 (${before} → ${after})`);
  await page.getByRole("button", { name: "일시정지" }).click();
  const frozen = await timer.innerText();
  await page.waitForTimeout(1200);
  check((await timer.innerText()) === frozen, "일시정지하면 멈춰요");
  await page.getByRole("button", { name: "5분 더 쓰기" }).click();
  check((await timer.innerText()) !== frozen, "5분 더 쓰기를 누르면 남은 시간이 늘어요");
  await page.screenshot({ path: path.join(OUT, "03-live.png"), fullPage: true });
  await page.getByRole("button", { name: "다음 코너로" }).click();
  check((await page.locator("body").innerText()).includes("2 /"), "다음 코너로 넘어가요");
  await page.getByRole("link", { name: /큐시트로/ }).click();
  check((await page.locator("main").innerText()).includes("길어요"), "진행 중 늘린 5분이 큐시트에도 반영돼요");

  // 없는 큐시트
  await page.goto(`${BASE}/pd/없는것`);
  check(await page.getByText("큐시트를 찾지 못했어요").isVisible(), "없는 큐시트는 안내가 떠요");
  check(errors.length === 0, `화면 오류가 없어요 ${errors.join("|")}`);
  await browser.close();
  console.log(log.join("\n"));
} finally {
  server.kill();
}
