// AI 없이도 항상 되는 템플릿 생성기 — 같은 입력이면 같은 큐시트가 나와요.
// 음주 강요 게임은 목록에 넣지 않아요. 배경음은 곡 이름 없이 분위기 키워드만 적어요.
import {
  EVENT_LABEL,
  MAX_TOTAL,
  MIN_TOTAL,
  type CueInput,
  type CueSheet,
  type EventKind,
  type Mood,
  type Segment,
} from "./types";
import { isValidTime, quizMinutes } from "./time";

interface Corner {
  key: string;
  title: string;
  /** 권장 분 */
  ideal: number;
  min: number;
  script: string[];
  cue: string;
  props: string[];
  planB: string;
  /** 이 인원 이상일 때만 */
  minPeople?: number;
  /** 지정하면 이 행사에서만 */
  events?: EventKind[];
  moods?: Mood[];
}

const GAMES: Corner[] = [
  {
    key: "speed-quiz",
    title: "몸으로 말해요",
    ideal: 15,
    min: 8,
    script: ["팀을 나눌게요. 제시어를 받은 한 분이 말 없이 몸으로만 설명해요.", "제한 시간은 한 문제당 30초예요. 맞히면 1점!", "가장 많이 맞힌 팀이 우승이에요."],
    cue: "타이머 틱톡 / 정답 딩동 / 자막 '30초'",
    props: ["제시어 카드(미리 20장)", "타이머"],
    planB: "제시어 카드가 없으면 폰 메모장에 단어를 적어 보여 주세요.",
    minPeople: 4,
    events: ["dinner", "workshop", "club", "family"],
  },
  {
    key: "choseong",
    title: "초성 퀴즈",
    ideal: 12,
    min: 6,
    script: ["화면에 초성만 보여 드려요. 손 먼저 든 분에게 기회를 드려요.", "주제는 음식, 노래 제목, 동네 이름이에요.", "오답은 감점 없이 다음 사람에게 넘어가요."],
    cue: "정답 딩동 / 오답 삐빅 / 자막 '초성 힌트'",
    props: ["초성 문제 15개(폰 메모)"],
    planB: "문제가 모자라면 이름·지역 초성으로 즉석에서 만들어요.",
  },
  {
    key: "two-truths",
    title: "두 개의 진실, 하나의 거짓",
    ideal: 15,
    min: 8,
    script: ["자기 이야기 세 가지를 말해요. 둘은 진짜, 하나는 거짓이에요.", "나머지 분들은 거짓을 골라 손을 들어요.", "속은 사람이 많을수록 이야기꾼이 이겨요."],
    cue: "조용한 긴장감 / 정답 공개 때 드럼롤",
    props: ["없음"],
    planB: "말이 안 나오면 '올해 처음 해 본 일'로 주제를 좁혀 주세요.",
    moods: ["calm", "lively"],
    events: ["dinner", "workshop", "club", "family"],
  },
  {
    key: "relay-word",
    title: "끝말잇기 릴레이",
    ideal: 10,
    min: 5,
    script: ["오른쪽 사람에게 이어 가요. 3초 안에 못 이으면 탈락이에요.", "주제를 '음식'으로 좁혀 볼게요.", "마지막까지 남은 분이 다음 코너 첫 질문권을 가져요."],
    cue: "3초 카운트 / 탈락 효과음 / 자막 '다음 사람'",
    props: ["없음"],
    planB: "탈락자가 서운해하면 응원 역할을 맡겨 계속 참여시켜요.",
    moods: ["compete", "lively"],
    events: ["dinner", "workshop", "club", "family"],
  },
  {
    key: "balance",
    title: "밸런스 게임",
    ideal: 10,
    min: 5,
    script: ["두 가지 중 하나를 골라 양쪽으로 나누어 서 주세요.", "고른 이유를 한 분씩 들어 볼게요.", "정답은 없어요. 웃기면 이긴 거예요."],
    cue: "경쾌한 전환 효과음 / 자막 'A vs B'",
    props: ["질문 10개(폰 메모)"],
    planB: "움직이기 어려운 자리면 손 번쩍 투표로 바꿔요.",
    moods: ["calm", "lively"],
  },
  {
    key: "team-mission",
    title: "팀 미션: 물건 찾기",
    ideal: 15,
    min: 10,
    script: ["제시어에 맞는 물건을 가장 먼저 가져오는 팀이 이겨요.", "첫 제시어는 '파란색인 것'이에요. 시작!", "안전 때문에 뛰지 말고 빠르게 걸어 주세요."],
    cue: "신나는 질주 분위기 / 종료 땡 / 자막 '남은 시간'",
    props: ["타이머", "점수판"],
    planB: "공간이 좁으면 '지갑 속에서 찾기'로 바꿔요.",
    minPeople: 6,
    moods: ["compete", "lively"],
    events: ["workshop", "club", "family"],
  },
  {
    key: "praise",
    title: "칭찬 릴레이",
    ideal: 10,
    min: 5,
    script: ["옆 사람에게 구체적인 칭찬을 한 가지씩 해 주세요.", "'일 잘한다'보다 '지난주 자료가 보기 편했다'가 좋아요.", "칭찬받은 분은 한마디로 답해요."],
    cue: "따뜻한 잔잔한 분위기 / 자막 '칭찬 한 스푼'",
    props: ["없음"],
    planB: "쑥스러워하면 쪽지에 적어서 읽어 주는 방식으로 바꿔요.",
    moods: ["calm"],
    events: ["dinner", "workshop", "club", "family"],
  },
  {
    key: "viewer-vote",
    title: "시청자 투표 대결",
    ideal: 12,
    min: 6,
    script: ["채팅으로 A 또는 B를 투표해 주세요. 30초 드려요.", "많이 나온 쪽이 오늘의 미션을 정해요.", "결과 발표 전에 잠깐 예측해 볼게요."],
    cue: "투표 진행 효과음 / 결과 발표 팡파르 / 자막 '투표 마감'",
    props: ["투표 화면 또는 채팅 창"],
    planB: "참여가 적으면 진행자가 직접 한 표를 던지며 분위기를 띄워요.",
    events: ["live"],
  },
];

const OPEN: Record<EventKind, Corner> = {
  dinner: {
    key: "open",
    title: "오프닝·자기소개",
    ideal: 5,
    min: 3,
    script: ["오늘 진행을 맡은 ○○입니다. 짧은 게임 몇 개로 편하게 시작할게요.", "자리에서 이름과 요즘 빠진 것 한 가지만 말해 주세요.", "승패보다 웃음이 우선이에요."],
    cue: "밝은 시작 효과음 / 자막 '오늘의 편성표'",
    props: ["오늘 순서 안내(이 화면 공유)"],
    planB: "어색하면 진행자가 먼저 시범으로 소개해요.",
  },
  workshop: {
    key: "open",
    title: "오프닝·목표 공유",
    ideal: 5,
    min: 3,
    script: ["오늘 시간 순서를 먼저 알려 드릴게요.", "게임은 팀워크를 푸는 용도예요. 끝나면 본 논의로 이어져요.", "휴대폰은 게임 때만 꺼내 주세요."],
    cue: "차분하고 밝은 시작음 / 자막 '오늘의 흐름'",
    props: ["순서표", "타이머"],
    planB: "참석자가 늦으면 첫 코너를 가볍게 늘려요.",
  },
  club: {
    key: "open",
    title: "오프닝·인사",
    ideal: 5,
    min: 3,
    script: ["모두 환영해요! 오늘은 게임으로 가까워지는 시간이에요.", "이름표나 별명을 먼저 말해 주세요.", "규칙은 하나, 서로 웃으며 응원하기예요."],
    cue: "신나는 시작음 / 자막 '환영합니다'",
    props: ["이름표"],
    planB: "처음 만난 사이면 짝 소개로 시작해요.",
  },
  family: {
    key: "open",
    title: "오프닝·모임 인사",
    ideal: 5,
    min: 3,
    script: ["오늘은 다 같이 웃는 시간으로 만들어 봐요.", "어른도 아이도 같은 규칙으로 해요.", "이기든 지든 박수 먼저!"],
    cue: "따뜻한 시작음 / 자막 '오늘의 가족 놀이'",
    props: ["작은 상품 또는 스티커"],
    planB: "아이가 지루해하면 쉬운 코너를 앞으로 당겨요.",
  },
  live: {
    key: "open",
    title: "오프닝·인사와 오늘 순서",
    ideal: 5,
    min: 3,
    script: ["안녕하세요! 오늘의 방송을 시작합니다.", "오늘은 이런 순서로 진행해요. 채팅으로 참여해 주세요.", "끝까지 보시면 마지막에 작은 이벤트가 있어요."],
    cue: "인트로 효과음 / 자막 '오늘의 편성표'",
    props: ["오늘 순서 자막"],
    planB: "시청자가 적으면 지난 방송 하이라이트로 시간을 벌어요.",
  },
};

const CLOSE: Corner = {
  key: "close",
  title: "마무리·한 줄 소감",
  ideal: 5,
  min: 3,
  script: ["오늘 가장 웃겼던 순간을 한 줄씩 말해 주세요.", "우승팀에게 박수! 모두 수고하셨어요.", "사진 한 장 남기고 마무리할게요."],
  cue: "엔딩 효과음 / 자막 '오늘 수고했어요'",
  props: ["단체 사진", "상품(있다면)"],
  planB: "시간이 부족하면 소감을 한 단어로 줄여요.",
};

const ICE: Corner = {
  key: "ice",
  title: "아이스브레이킹",
  ideal: 8,
  min: 5,
  script: ["가까운 두 분씩 짝을 지어 주세요.", "서로 '요즘 가장 자주 먹는 음식'을 물어봐요.", "상대 답을 1분 뒤 전체에게 소개해 주세요."],
  cue: "가벼운 대화용 잔잔한 배경 / 자막 '짝 인터뷰'",
  props: ["없음"],
  planB: "홀수 인원이면 진행자가 한 팀에 합류해요.",
};

const BREAK: Corner = {
  key: "break",
  title: "휴식",
  ideal: 10,
  min: 5,
  script: ["잠시 쉬어 갈게요. 화장실과 음료 시간이에요.", "시간이 되면 이어서 시작해요."],
  cue: "휴식 타이머 화면 / 잔잔한 분위기",
  props: ["타이머"],
  planB: "늦게 오는 분이 많으면 2분만 늘려요.",
};

function quizCorner(minutes: number): Corner {
  return {
    key: "quiz",
    title: "퀴즈 라운드 (명대사 맞히기)",
    ideal: minutes,
    min: minutes,
    script: ["이제 퀴즈 시간이에요. 폰으로 대사를 들려 드릴게요.", "어느 영화·드라마인지 먼저 외치는 분이 점수를 가져요.", "10문제를 풀고 가장 높은 팀이 이겨요."],
    cue: "퀴즈 시작 효과음 / 정답 딩동 / 자막 '이 대사, 어디서?'",
    props: ["퀴즈 사이트 열린 폰 1대", "스피커 또는 큰 소리"],
    planB: "소리가 안 나오면 '대사 보기' 힌트를 열어 글자로 진행해요.",
  };
}

let seq = 0;
function makeId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

function toSegment(c: Corner, kind: Segment["kind"], minutes: number): Segment {
  return {
    id: makeId(c.key),
    kind,
    title: c.title,
    minutes,
    script: c.script.slice(),
    cue: c.cue,
    props: c.props.slice(),
    planB: c.planB,
  };
}

export function validateInput(input: CueInput): string | null {
  if (!Number.isInteger(input.people) || input.people < 2 || input.people > 200) return "인원은 2명에서 200명 사이로 입력해 주세요.";
  if (!Number.isInteger(input.totalMinutes) || input.totalMinutes < MIN_TOTAL || input.totalMinutes > MAX_TOTAL)
    return `총 시간은 ${MIN_TOTAL}분에서 ${MAX_TOTAL}분 사이로 입력해 주세요.`;
  if (!isValidTime(input.startTime)) return "시작 시각을 올바르게 입력해 주세요.";
  return null;
}

/**
 * 총 시간을 코너별로 나눠요. 각 코너는 최소 시간부터 시작해 권장 시간까지 한 분씩 번갈아 채우고,
 * 그래도 남으면 마무리 바로 앞 코너에 보태서 합계가 항상 총 시간과 같게 해요.
 * (총 시간이 최소 합계보다 작으면 호출하는 쪽에서 코너를 줄여서 불러야 해요.)
 */
export function allocate(total: number, corners: { ideal: number; min: number }[]): number[] {
  const out = corners.map((c) => c.min);
  let remaining = total - out.reduce((a, b) => a + b, 0);
  if (remaining < 0) throw new Error("총 시간이 코너 최소 시간의 합보다 짧아요.");
  while (remaining > 0) {
    let progressed = false;
    for (let i = 0; i < out.length && remaining > 0; i++) {
      if (out[i]! < corners[i]!.ideal) {
        out[i]! += 1;
        remaining -= 1;
        progressed = true;
      }
    }
    if (!progressed) {
      out[Math.max(0, out.length - 2)]! += remaining;
      remaining = 0;
    }
  }
  return out;
}

type Planned = { corner: Corner; kind: Segment["kind"] };

export function generateCueSheet(input: CueInput, now: Date = new Date()): CueSheet {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const { eventKind, people, totalMinutes, mood, includeQuiz } = input;
  const needBreak = totalMinutes >= 90;
  const quiz = includeQuiz && eventKind !== "live" ? quizCorner(quizMinutes(10)) : null;
  const open = OPEN[eventKind];
  const needIce = totalMinutes >= 45 && people >= 4;

  const fixedMin = open.min + CLOSE.min + (needBreak ? BREAK.min : 0) + (quiz ? quiz.min : 0) + (needIce ? ICE.min : 0);
  const gameBudget = Math.max(0, totalMinutes - fixedMin);

  const pool = GAMES.filter((g) => (!g.minPeople || people >= g.minPeople) && (!g.events || g.events.includes(eventKind)));
  // 분위기에 맞는 코너를 앞으로
  const ranked = pool.slice().sort((a, b) => Number(!!b.moods?.includes(mood)) - Number(!!a.moods?.includes(mood)));
  const count = Math.min(5, ranked.length, Math.floor(gameBudget / 8));
  const games = ranked.slice(0, count);

  const order: Planned[] = [{ corner: open, kind: "open" }];
  if (needIce) order.push({ corner: ICE, kind: "ice" });
  const half = Math.ceil(games.length / 2);
  games.slice(0, half).forEach((g) => order.push({ corner: g, kind: "game" }));
  if (needBreak) order.push({ corner: BREAK, kind: "break" });
  if (quiz) order.push({ corner: quiz, kind: "quiz" });
  games.slice(half).forEach((g) => order.push({ corner: g, kind: "game" }));
  order.push({ corner: CLOSE, kind: "close" });

  // 게임이 하나도 안 들어가고 시간이 남으면, 가장 맞는 게임 하나는 꼭 넣어요 (오프닝·마무리만 있는 큐시트 방지)
  if (games.length === 0 && ranked[0] && totalMinutes - fixedMin >= ranked[0].min) {
    order.splice(order.length - 1, 0, { corner: ranked[0], kind: "game" });
  }

  const effective = (o: Planned) => (o.kind === "quiz" ? { ideal: o.corner.ideal, min: o.corner.ideal } : o.corner);
  let plan = order;
  const minSum = (list: Planned[]) => list.reduce((s, o) => s + effective(o).min, 0);
  // 시간이 모자라면 퀴즈 → 휴식 → 아이스브레이킹 순으로 덜어 내요
  for (const drop of ["quiz", "break", "ice"] as const) {
    if (minSum(plan) <= totalMinutes) break;
    plan = plan.filter((o) => o.kind !== drop);
  }
  const minutes = allocate(totalMinutes, plan.map(effective));

  const segments = plan.map((o, i) => toSegment(o.corner, o.kind, minutes[i]!));
  return {
    id: makeId("sheet"),
    title: `${EVENT_LABEL[eventKind]} ${people}명 · ${totalMinutes}분`,
    startTime: input.startTime,
    people,
    eventKind,
    mood,
    requestedMinutes: totalMinutes,
    includeQuiz: !!quiz,
    segments,
    createdAt: now.toISOString(),
  };
}
