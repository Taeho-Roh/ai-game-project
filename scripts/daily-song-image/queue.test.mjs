import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QUEUE_FILE } from "./lib/paths.mjs";
import { loadQueue, markDone, nextPending, queueStats, saveQueue, validateQueue } from "./lib/queue.mjs";
import { buildImagePrompt } from "./lib/prompt.mjs";
import { addQuestion, buildQuestion, emptyDailyPack, objectKey } from "./lib/pack.mjs";
import { signPut, missingR2Env } from "./lib/r2.mjs";
import { getProvider } from "./providers/index.mjs";
import { validatePack } from "../../src/quiz/validate";

const real = loadQueue(QUEUE_FILE);

describe("실제 곡 대기열 (data-queue/songs.json)", () => {
  it("약 30곡이고 검사를 통과해요", () => {
    expect(real.songs.length).toBeGreaterThanOrEqual(25);
    expect(validateQueue(real)).toEqual([]);
  });

  it("모든 곡의 프롬프트가 만들어지고 제목·가수가 들어 있지 않아요", () => {
    for (const s of real.songs) {
      const p = buildImagePrompt(s);
      for (const secret of [s.title, s.artist, ...s.aliases]) expect(p.toLowerCase(), s.id).not.toContain(secret.toLowerCase());
    }
  });
});

describe("대기열 다루기", () => {
  const q = {
    songs: [
      { ...real.songs[0], status: "done" },
      { ...real.songs[1], status: "pending" },
      { ...real.songs[2], status: "pending" },
    ],
  };

  it("다음 차례는 pending 중 맨 앞", () => {
    expect(nextPending(q).id).toBe(real.songs[1].id);
  });

  it("id 로 고를 수 있지만 이미 끝난 곡·없는 곡은 오류", () => {
    expect(nextPending(q, real.songs[2].id).id).toBe(real.songs[2].id);
    expect(() => nextPending(q, real.songs[0].id)).toThrow(/이미 끝/);
    expect(() => nextPending(q, "nope")).toThrow(/없는 곡/);
  });

  it("전부 done 이면 null", () => {
    expect(nextPending({ songs: q.songs.map((s) => ({ ...s, status: "done" })) })).toBeNull();
  });

  it("markDone 은 새 대기열을 돌려주고 원본은 안 바꿔요", () => {
    const next = markDone(q, real.songs[1].id, { doneAt: "2026-11-12" });
    expect(next.songs[1].status).toBe("done");
    expect(next.songs[1].doneAt).toBe("2026-11-12");
    expect(q.songs[1].status).toBe("pending");
    expect(queueStats(next)).toEqual({ total: 3, done: 2, pending: 1 });
    expect(() => markDone(q, "nope", {})).toThrow();
  });

  it("id 겹침·잘못된 status 를 잡아요", () => {
    const dup = { songs: [real.songs[0], real.songs[0]] };
    expect(validateQueue(dup).join()).toContain("겹쳐요");
    expect(validateQueue({ songs: [{ ...real.songs[0], status: "weird" }] }).join()).toContain("status");
  });

  it("저장하고 다시 읽어도 같아요 (임시 폴더)", () => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "dsi-")), "songs.json");
    saveQueue(f, q);
    expect(loadQueue(f)).toEqual(q);
  });
});

describe("묶음에 넣기", () => {
  const song = real.songs[0];
  const q = buildQuestion({ song, publicUrl: "https://img.example/x.png", model: "gpt-image-1-mini" });

  it("만든 문제는 형식 검사를 통과하고 AI 표시·검수 필요가 붙어요", () => {
    const pack = addQuestion(emptyDailyPack("2026-11-12"), { ...q, gameType: "song_image" });
    const withType = { ...pack, questions: pack.questions.map((x) => ({ ...x, gameType: "song_image" })) };
    expect(validatePack(withType)).toEqual([]);
    expect(q.image).toMatchObject({ kind: "file", aiModel: "gpt-image-1-mini" });
    expect(q.needsReview).toBe(true);
    expect(JSON.stringify(q)).not.toMatch(/lyric|가사/);
  });

  it("자동 선택한 그림은 표시를 남겨요", () => {
    expect(buildQuestion({ song, publicUrl: "u", model: "m", auto: true }).autoPicked).toBe(true);
    expect(q.autoPicked).toBeUndefined();
  });

  it("같은 문제를 두 번 넣을 수 없어요", () => {
    const pack = addQuestion(emptyDailyPack("2026-11-12"), q);
    expect(() => addQuestion(pack, q)).toThrow(/이미/);
  });

  it("R2 경로", () => {
    expect(objectKey(song, "2026-11-12", "2.png")).toBe(`song-image/${song.id}-2026-11-12.png`);
  });
});

describe("키가 없으면 아무것도 부르지 않아요", () => {
  it("제공자·R2 는 환경변수가 없으면 설정 안 됨으로 보고, 호출하면 오류", async () => {
    for (const name of ["openai", "gemini"]) {
      const prov = getProvider(name, { env: {}, fetchImpl: () => { throw new Error("네트워크를 부르면 안 돼요"); } });
      expect(prov.isConfigured()).toBe(false);
      await expect(prov.generate({ prompt: "x", count: 1 })).rejects.toThrow(/환경변수/);
    }
    expect(missingR2Env({})).toHaveLength(5);
  });

  it("OpenAI·Gemini 응답 해석 (가짜 서버)", async () => {
    const b64 = Buffer.from("png-bytes").toString("base64");
    const calls = [];
    const fake = (body) => async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => body };
    };
    const o = getProvider("openai", { env: { OPENAI_API_KEY: "k" }, fetchImpl: fake({ data: [{ b64_json: b64 }, { b64_json: b64 }] }) });
    expect((await o.generate({ prompt: "p", count: 2 })).length).toBe(2);
    expect(JSON.parse(calls[0].init.body)).toMatchObject({ model: "gpt-image-1-mini", n: 2, prompt: "p" });
    const g = getProvider("gemini", { env: { GEMINI_API_KEY: "k" }, fetchImpl: fake({ candidates: [{ content: { parts: [{ inlineData: { data: b64, mimeType: "image/png" } }] } }] }) });
    expect((await g.generate({ prompt: "p", count: 3 })).length).toBe(3);
    expect(calls.length).toBe(1 + 3);
  });

  it("R2 서명은 같은 입력이면 같고 필요한 헤더가 있어요", () => {
    const base = { host: "acc.r2.cloudflarestorage.com", bucket: "b", key: "song-image/a.png", body: Buffer.from("x"), contentType: "image/png", accessKeyId: "AK", secretAccessKey: "SK", now: new Date("2026-01-02T03:04:05Z") };
    const a = signPut(base);
    expect(signPut(base)).toEqual(a);
    expect(a.url).toBe("https://acc.r2.cloudflarestorage.com/b/song-image/a.png");
    expect(a.headers["x-amz-date"]).toBe("20260102T030405Z");
    expect(a.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AK\/20260102\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
    expect(signPut({ ...base, secretAccessKey: "other" }).headers.Authorization).not.toBe(a.headers.Authorization);
  });
});
