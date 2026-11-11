// 퀴즈 묶음 목록 — 지금은 이 폴더의 JSON 파일이 전부예요 (DB 없음).
// 새 묶음을 추가하려면: JSON 파일을 만들고 아래 RAW_PACKS 에 한 줄 추가 → npm test 로 검사.
import type { QuizPack, QuotePack, SongImagePack } from "@/quiz/types";
import movieLines from "./quote-movie-lines.json";
import dramaLines from "./quote-drama-lines.json";
import songImageSample from "./song-image-sample.json";

type RawPack = { gameType: string; questions: object[] } & Record<string, unknown>;

/** JSON 에는 문제마다 gameType 을 적지 않아요. 묶음의 gameType 을 문제에 붙여 줘요. */
function fromJson(raw: RawPack): QuizPack {
  const questions = raw.questions.map((q) => ({ ...q, gameType: raw.gameType }));
  if (raw.gameType === "quote_tts") return { ...raw, questions } as unknown as QuotePack;
  if (raw.gameType === "song_image") return { ...raw, questions } as unknown as SongImagePack;
  throw new Error(`모르는 게임 종류: ${raw.gameType}`);
}

const RAW_PACKS: RawPack[] = [movieLines, dramaLines, songImageSample];

export const PACKS: QuizPack[] = RAW_PACKS.map(fromJson);

export function getPack(id: string | undefined): QuizPack | undefined {
  return PACKS.find((p) => p.id === id);
}

export type PackSort = "popular" | "new";

export function sortPacks(packs: readonly QuizPack[], sort: PackSort): QuizPack[] {
  const arr = [...packs];
  if (sort === "popular") {
    // 서버 플레이 수가 생기기 전까지는 운영자가 정한 순위(editorRank)로 — 샘플은 항상 뒤로
    arr.sort((a, b) => Number(!!a.sample) - Number(!!b.sample) || a.editorRank - b.editorRank);
  } else {
    arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.editorRank - b.editorRank);
  }
  return arr;
}
