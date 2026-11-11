import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const REPO = path.resolve(ROOT, "..", "..");
export const QUEUE_FILE = path.join(ROOT, "data-queue", "songs.json");
export const CANDIDATES_DIR = path.join(ROOT, "candidates");
export const PACK_FILE = path.join(REPO, "src", "data", "song-image-daily.json");

export function candidatesDir(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`날짜 형식이 이상해요: ${date}`);
  return path.join(CANDIDATES_DIR, date);
}
