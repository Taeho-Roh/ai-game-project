// 고른 그림을 노래 그림 묶음(src/data/song-image-daily.json)에 넣는 순수 함수들.
import fs from "node:fs";

export const DAILY_PACK_ID = "song-image-daily";

export function emptyDailyPack(date) {
  return {
    id: DAILY_PACK_ID,
    gameType: "song_image",
    title: "오늘의 노래 그림",
    description: "매일 한 장씩 AI 가 그린 노래 분위기 그림을 보고 제목을 맞혀요.",
    createdAt: date,
    editorRank: 4,
    tags: ["노래", "그림", "AI 생성"],
    questions: [],
  };
}

/** 곡 + 고른 그림 → 문제 한 개. 가사는 어디에도 없고, "AI 생성 · 모델 이름" 표시용 aiModel 을 넣어요. */
export function buildQuestion({ song, publicUrl, model, auto = false }) {
  return {
    id: `sd-${song.id}`,
    answer: song.title,
    aliases: song.aliases,
    artist: song.artist,
    year: song.year,
    genre: song.genre,
    sourceNote: `${song.artist} 〈${song.title}〉(${song.year})`,
    sceneDescription: song.sceneKo,
    image: { kind: "file", src: publicUrl, alt: song.sceneKo, aiModel: model },
    // 사람이 확인하기 전에는 항상 true (제목·연도·그림). 자동 선택한 그림은 따로 표시해요.
    needsReview: true,
    ...(auto ? { autoPicked: true } : {}),
  };
}

export function addQuestion(pack, question) {
  if (pack.questions.some((q) => q.id === question.id)) throw new Error(`이미 묶음에 있는 문제예요: ${question.id}`);
  return { ...pack, questions: [...pack.questions, question] };
}

export function loadPackOrNew(file, date) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : emptyDailyPack(date);
}

export function savePack(file, pack) {
  fs.writeFileSync(file, JSON.stringify(pack, null, 2) + "\n", "utf8");
}

/** R2 에 올릴 파일 경로 */
export function objectKey(song, date, file) {
  const ext = file.split(".").pop();
  return `song-image/${song.id}-${date}.${ext}`;
}
