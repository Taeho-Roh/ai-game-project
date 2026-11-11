import { describe, expect, it } from "vitest";
import { buildImagePrompt, SAFETY_RULES } from "./lib/prompt.mjs";
import { validateSong } from "./lib/queue.mjs";

const song = {
  id: "test-song",
  title: "테스트 노래",
  artist: "테스트 가수",
  year: 2020,
  aliases: ["Test Song"],
  genre: "팝",
  scene: "A calm harbor town at night with small boats on dark water.",
  sceneKo: "잔잔한 항구의 밤이에요.",
  status: "pending",
};

describe("그림 프롬프트 만들기", () => {
  it("분위기 설명(scene)을 넣고, 제목·가수·연도·별칭은 넣지 않아요", () => {
    const p = buildImagePrompt({ ...song, lyrics: "절대 새면 안 되는 가사 한 줄" });
    expect(p).toContain(song.scene);
    for (const secret of [song.title, song.artist, String(song.year), ...song.aliases]) expect(p).not.toContain(secret);
  });

  it("곡 객체에서 scene 외의 필드는 읽지도 않아요 (가사가 새는 길을 막기)", () => {
    const read = [];
    const spy = new Proxy(song, {
      get(target, prop) {
        read.push(String(prop));
        return target[prop];
      },
    });
    buildImagePrompt(spy);
    expect(read).toEqual(["scene"]);
  });

  it("가사 필드가 있는 곡은 대기열 검사에서 걸려요", () => {
    expect(validateSong({ ...song, lyrics: "..." }).join()).toContain("가사 금지");
    expect(validateSong({ ...song, 가사: "..." }).join()).toContain("가사 금지");
    expect(validateSong(song)).toEqual([]);
  });

  it("글자 없음 · 실존 인물 없음 · 앨범 표지 모방 금지 지시가 항상 들어가요", () => {
    const p = buildImagePrompt(song);
    expect(p).toMatch(/no text at all/i);
    expect(p).toMatch(/no letters, no numbers/i);
    expect(p).toMatch(/no real people, no faces/i);
    expect(p).toMatch(/Do not imitate any existing album cover/i);
    for (const rule of SAFETY_RULES) expect(p).toContain(rule);
  });

  it.each([
    ["가사", "A road with lyrics written in the sky"],
    ["앨범", "앨범 표지 같은 장면"],
    ["얼굴", "a smiling face close up"],
    ["가수", "the singer on stage"],
    ["글자", "big letters spelling a word"],
    ["뮤직비디오", "a scene from the music video"],
    ["영문 album cover", "an album cover with a sunset"],
  ])("분위기 설명에 금지어(%s)가 있으면 거절해요", (_n, scene) => {
    expect(() => buildImagePrompt({ ...song, scene })).toThrow(/금지어/);
    expect(validateSong({ ...song, scene, sceneKo: song.sceneKo }).join()).toContain("금지어");
  });

  it("설명에 제목이나 가수 이름이 들어가면 대기열 검사에서 걸려요", () => {
    expect(validateSong({ ...song, scene: "A sign that says 테스트 노래 over the road" }).join()).toContain("제목·가수");
    expect(validateSong({ ...song, sceneKo: "테스트 가수 가 부르던" }).join()).toContain("제목·가수");
  });

  it("surface 처럼 금지어를 일부로 품은 평범한 단어는 괜찮아요", () => {
    expect(() => buildImagePrompt({ ...song, scene: "Light on the surface of a quiet lake" })).not.toThrow();
  });

  it("scene 이 비어 있으면 거절해요", () => {
    expect(() => buildImagePrompt({ ...song, scene: "  " })).toThrow();
  });
});
