// 곡 대기열(data-queue/songs.json) 읽기·검사·상태 바꾸기.
// 대기열에는 "우리가 직접 쓴 분위기 설명"만 있고 가사는 어디에도 없어요.
import fs from "node:fs";

/** 대기열 항목에 있으면 안 되는 필드 이름 (가사 유입 방지) */
export const BANNED_FIELDS = ["lyrics", "lyric", "가사"];

/** 분위기 설명에 들어가면 안 되는 말 — 가사·앨범 표지·실존 인물·글자 */
export const FORBIDDEN_SCENE_WORDS = [
  "lyric", "album", "cover art", "poster", "logo", "caption", "text", "letter", "word",
  "face", "portrait", "selfie", "celebrity", "idol", "singer", "band member", "performer", "music video", "mv",
  "가사", "앨범", "표지", "포스터", "로고", "자막", "글자", "얼굴", "초상", "아이돌", "가수", "뮤직비디오",
];

const STATUSES = new Set(["pending", "done"]);

/** 한 단어가 장면 설명에 "단어"로 들어 있는지 (영문은 단어 경계, 한글은 포함) */
export function containsWord(haystack, needle) {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (/^[a-z ]+$/.test(n)) return new RegExp(`(^|[^a-z])${n.replace(/ /g, "[ -]")}(s|es)?($|[^a-z])`).test(h);
  return h.includes(n);
}

/** 곡 하나의 문제점 목록 (없으면 빈 배열) */
export function validateSong(song) {
  const errs = [];
  const at = (m) => errs.push(`[${song?.id ?? "?"}] ${m}`);
  if (!song || typeof song !== "object") return ["곡 항목이 객체가 아니에요"];
  for (const f of ["id", "title", "artist", "genre", "scene", "sceneKo"]) {
    if (typeof song[f] !== "string" || !song[f].trim()) at(`${f} 가 비어 있어요`);
  }
  if (!/^[a-z0-9-]+$/.test(song.id ?? "")) at("id 는 영문 소문자·숫자·하이픈만");
  if (!Number.isInteger(song.year) || song.year < 1950 || song.year > 2100) at(`연도가 이상해요: ${song.year}`);
  if (!Array.isArray(song.aliases)) at("aliases 는 배열이어야 해요");
  if (!STATUSES.has(song.status)) at(`status 는 pending 또는 done: ${song.status}`);
  for (const f of BANNED_FIELDS) if (f in song) at(`"${f}" 필드는 둘 수 없어요 (가사 금지)`);
  const sceneTexts = [song.scene, song.sceneKo].filter((s) => typeof s === "string");
  for (const t of sceneTexts) {
    for (const w of FORBIDDEN_SCENE_WORDS) if (containsWord(t, w)) at(`분위기 설명에 금지어가 있어요: "${w}"`);
    for (const secret of [song.title, song.artist, ...(song.aliases ?? [])]) {
      if (typeof secret === "string" && secret.trim().length >= 2 && t.toLowerCase().includes(secret.toLowerCase())) {
        at(`분위기 설명에 제목·가수·별칭이 들어 있어요: "${secret}"`);
      }
    }
  }
  return errs;
}

export function validateQueue(queue) {
  if (!queue || !Array.isArray(queue.songs)) return ["songs 배열이 없어요"];
  const errs = [];
  const ids = new Set();
  for (const s of queue.songs) {
    errs.push(...validateSong(s));
    if (ids.has(s?.id)) errs.push(`[${s.id}] id 가 겹쳐요`);
    ids.add(s?.id);
  }
  return errs;
}

export function loadQueue(file) {
  const queue = JSON.parse(fs.readFileSync(file, "utf8"));
  const errs = validateQueue(queue);
  if (errs.length) throw new Error(`곡 대기열 검사 실패:\n- ${errs.join("\n- ")}`);
  return queue;
}

export function saveQueue(file, queue) {
  fs.writeFileSync(file, JSON.stringify(queue, null, 2) + "\n", "utf8");
}

/** 다음 차례(pending 중 맨 앞) 곡. id 를 주면 그 곡 (이미 done 이면 오류). 없으면 null */
export function nextPending(queue, id) {
  if (id) {
    const s = queue.songs.find((x) => x.id === id);
    if (!s) throw new Error(`대기열에 없는 곡이에요: ${id}`);
    if (s.status !== "pending") throw new Error(`이미 끝난 곡이에요: ${id}`);
    return s;
  }
  return queue.songs.find((s) => s.status === "pending") ?? null;
}

/** done 으로 바꾼 새 대기열을 돌려줘요 (원본은 그대로) */
export function markDone(queue, id, info) {
  if (!queue.songs.some((s) => s.id === id)) throw new Error(`대기열에 없는 곡이에요: ${id}`);
  return {
    ...queue,
    songs: queue.songs.map((s) => (s.id === id ? { ...s, status: "done", ...info } : s)),
  };
}

export function queueStats(queue) {
  const done = queue.songs.filter((s) => s.status === "done").length;
  return { total: queue.songs.length, done, pending: queue.songs.length - done };
}
