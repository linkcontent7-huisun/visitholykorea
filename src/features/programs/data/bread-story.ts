/**
 * 1호 「하늘에서 빵이 내린다면」 — 줄에서 보는 이야기 (2026-11-08 초안, 사장님 검토 전).
 *
 * 형식: 웹소설 말투 + 웹툰 칸 그림(StoryScenes.tsx 의 직접 그린 삽화).
 * 원칙: 출처로 확인한 사실만 쓴다. 칸마다 근거 출처 번호(src)를 단다.
 * 실존 인물은 뒷모습·실루엣으로만 그리고, 상호 로고는 그리지 않는다.
 * 종교 설명이 아니라 「도시의 역사」로 들려준다(칠곡형 — 누구나).
 */

export type SceneKey =
  | 'harbor'
  | 'train'
  | 'flour'
  | 'tent'
  | 'share'
  | 'line'
  | 'church1919'
  | 'tower'
  | 'ringer'
  | 'silence'
  | 'office'
  | 'capital'
  | 'walk';

export interface StoryPanel {
  scene: SceneKey;
  /** 웹소설식 서술 — 짧은 줄 여러 개 */
  lines: string[];
  /** 말풍선(인용) — 출처에 있는 말만 */
  bubble?: string;
  src: number[];
}

export interface StoryEpisode {
  no: number;
  title: string;
  place: string;
  minutes: number;
  panels: StoryPanel[];
  /** 다음 화 예고 — 다음 장소로 걷게 하는 한 줄 */
  next: string;
  /** 알고 가면 더 재미있는 이야기 — 출처 확인된 사실만 */
  more: { text: string; src: number[] }[];
  /**
   * 관련 영상(유튜브 등) — 사장님이 직접 찾아 넣는다(2026-11-08 지시). 비어 있으면 화면에 안 보인다.
   * 예: { title: '대전 근대문화탐방로', url: 'https://www.youtube.com/watch?v=...' }
   */
  videos: { title: string; url: string }[];
}

export interface StorySource {
  id: number;
  label: string;
  url: string;
}

export const STORY_SOURCES: StorySource[] = [
  { id: 1, label: '성심당 공식 누리집 「성심당이야기」', url: 'http://sungsimdang.co.kr/page/14' },
  {
    id: 2,
    label: '국가유산청 국가유산 디지털 서비스 「대전 대흥동성당」',
    url: 'https://digital.khs.go.kr/heri/heriDetail.do?ctptUid=13898859683603301524&ctptNo=4412506430000',
  },
  {
    id: 3,
    label: '연합뉴스(2019.9.6) 「50년 동안 대전 대흥동성당 지킨 종지기 조정형씨 은퇴」',
    url: 'https://www.yna.co.kr/view/AKR20190906104000063',
  },
  {
    id: 4,
    label: '가톨릭갤러리 「대전과 함께한 대흥동성당 100년」 시민포럼',
    url: 'https://photo.catholic.or.kr/bbs/newsView.asp?id=139572',
  },
  {
    id: 5,
    label: '대한민국역사박물관 근현대사아카이브 「구 충남도청 본관」',
    url: 'https://archive.much.go.kr/data/01/folderView.do?jobdirSeq=1280',
  },
  {
    id: 6,
    label: '국가유산청 국가유산 디지털 서비스 「대전 충청남도청 구 본관」',
    url: 'https://digital.khs.go.kr/heri/heriDetail.do?ctptUid=13898859679694301185&ctptNo=4412500180000',
  },
  {
    id: 7,
    label: '대전광역시 공식 블로그 「대흥동 문화1번지를 꿈꾼다, 공간1919」',
    url: 'https://blog.naver.com/storydaejeon/221124036895',
  },
  {
    id: 8,
    label: '가톨릭평화방송 「대전교구 주교좌 대흥동본당 100주년 기념전」',
    url: 'https://news.cpbc.co.kr/article/763825',
  },
];

export const BREAD_STORY: StoryEpisode[] = [
  {
    no: 1,
    title: '찐빵 아저씨의 약속',
    place: '성심당 앞, 줄 서는 동안',
    minutes: 4,
    panels: [
      {
        scene: 'harbor',
        lines: [
          '1950년 겨울, 흥남부두.',
          '대포 소리가 점점 가까워지고, 바닷가는 피란민으로 가득했다.',
          '함경남도 함주에서 과수원을 하던 한 가족이 마지막 배, 메러디스 빅토리호에 올랐다.',
        ],
        bubble: '우리 가족이 살아난다면 평생 가난한 사람들을 위해 살겠습니다.',
        src: [1],
      },
      {
        scene: 'train',
        lines: [
          '배는 크리스마스에 거제도에 닿았다.',
          '진해에서 몇 해를 산 뒤, 가족은 서울행 기차를 탔다.',
          '그런데 기차가 대전역에서 멈춰 섰다. 고장이었다.',
          '역 광장으로 나온 아버지는 생각했다. "여기서 살아 볼까?"',
        ],
        src: [1],
      },
      {
        scene: 'flour',
        lines: [
          '아버지는 목척교를 건너 대흥동의 성당을 찾아갔다.',
          '이야기를 들은 신부는 밀가루 두 포대를 내주었다.',
          '두 포대면 식구가 한동안 먹을 수 있었다. 하지만 부부는 다르게 생각했다.',
        ],
        bubble: '언제까지 도움만 받으며 살 순 없잖아요. 이걸로 찐빵 장사라도 합시다.',
        src: [1],
      },
      {
        scene: 'tent',
        lines: [
          '1956년, 대전역 앞 천막.',
          '김이 피어오르는 찐빵 솥 옆에, 「성심당」이라고 쓴 팻말이 비스듬히 서 있었다.',
          '대전에서 가장 유명한 빵집은 이렇게 시작됐다.',
        ],
        src: [1],
      },
      {
        scene: 'share',
        lines: [
          '아버지는 매일 장사를 일찍 끝내고 싶어 했다.',
          '남은 찐빵을 싸 들고 목척교 아래로 가야 했기 때문이다.',
          '전쟁으로 배고픈 사람들이 그곳에 모여 살았다.',
        ],
        bubble: '얘들아, 배고프지? 찐빵 같이 먹자!',
        src: [1],
      },
      {
        scene: 'line',
        lines: [
          '그리고 지금, 당신이 서 있는 이 줄.',
          '2012년, 성심당은 대전역 안에 다시 문을 열었다. 천막에서 시작한 지 56년 만이었다.',
          '「성심」은 거룩한 마음이라는 뜻이다.',
          '그런데, 그 밀가루 두 포대를 내준 성당은 지금 어디에 있을까?',
        ],
        src: [1],
      },
    ],
    next: '2화 「종지기를 찾습니다」 — 빵을 사면, 걸어서 대흥동성당으로.',
    more: [
      { text: '성심당의 경영 이념은 「모든 이가 다 좋게 여기는 일을 하십시오」입니다.', src: [1] },
      { text: '튀김소보로는 단팥빵·소보로·도넛을 한 번에 맛보는 「삼단 합체」 빵으로 만들어졌습니다.', src: [1] },
      { text: '포장빙수는 스티로폼 상자에 담아 3시간을 버텼다고 합니다. 놀이터 철봉에 매달아 실험했대요.', src: [1] },
      { text: '2005년 1월 큰불이 났지만, 직원들이 함께 복구해 6일 만에 다시 빵을 구웠습니다.', src: [1] },
      { text: '프란치스코 교황이 방한했을 때 성심당이 아침·점심 식사빵을 만들었습니다.', src: [1] },
      { text: '1년 중 성심당이 가장 붐비는 날은 성탄절입니다.', src: [1] },
    ],
    videos: [],
  },
  {
    no: 2,
    title: '종지기를 찾습니다',
    place: '대흥동성당 가는 길',
    minutes: 4,
    panels: [
      {
        scene: 'church1919',
        lines: [
          '1919년, 대전 목동에 대전의 첫 성당이 세워졌다.',
          '훗날 오기선 신부가 성당을 대흥동으로 옮기며 「대흥동 시대」를 열었다.',
          '밀가루 두 포대를 내준 바로 그 신부다.',
        ],
        src: [7, 8, 4, 1],
      },
      {
        scene: 'tower',
        lines: [
          '지금 보이는 성당은 1962년에 지어졌다.',
          '고딕 양식을 현대적으로 풀어낸 종탑, 기둥 하나 없이 넓은 내부.',
          '1960년대 한국 모더니즘 건축으로 인정받아 2014년 국가등록문화유산이 되었다.',
        ],
        src: [2],
      },
      {
        scene: 'ringer',
        lines: [
          '이 종탑에는 50년 동안 한 사람이 올랐다.',
          '1969년부터, 평일엔 하루 두 번, 일요일엔 세 번.',
          '120개의 계단을 걸어 올라 줄을 당겼다. 종지기 조정형 씨였다.',
          '사람이 직접 울리는 종소리는 대전 원도심의 상징이었다.',
        ],
        bubble: '그저 꾸준히 일하고 내 일을 마칠 수 있었다는 것이 보람입니다.',
        src: [3],
      },
      {
        scene: 'silence',
        lines: [
          '2019년 9월 22일, 그가 마지막 종을 쳤다. 성당이 100년을 맞은 해였다.',
          '성당은 종을 전자식으로 바꾸기로 했다.',
          '사람이 줄을 당기던 종지기의 시대는 거기서 끝났다.',
          '…그렇다면, 오늘 그 종소리를 기억할 사람은 누구일까?',
        ],
        src: [3],
      },
    ],
    next: '3화 「21일 동안의 수도」 — 성당에서 나와, 옛 충남도청으로.',
    more: [
      { text: '성당이 100년을 맞은 2019년, 기존 종 3개에 작은 종 8개를 더하고 전자식으로 바꾸기로 했습니다.', src: [3] },
      { text: '마지막 타종은 2019년 9월 22일 오전 10시 미사의 시작을 알리는 종이었습니다.', src: [3] },
      { text: '천주교 대전교구는 사람이 직접 종을 치는 성당이 대흥동성당뿐이었다고 설명했습니다.', src: [3] },
      { text: '성당 앞 주출입구 위의 지붕(캐노피)은 접은 종이처럼 꺾인 「절판 구조」로 만들어졌습니다.', src: [2] },
    ],
    videos: [],
  },
  {
    no: 3,
    title: '21일 동안의 수도',
    place: '옛 충남도청(대전근현대사전시관) 가는 길',
    minutes: 3,
    panels: [
      {
        scene: 'office',
        lines: [
          '1932년, 충청남도의 도청이 공주에서 대전으로 옮겨 왔다.',
          '밝은 갈색 타일을 입힌 새 청사는 지금 대전에 남은 가장 오래된 근대 관청 건물이다.',
        ],
        src: [5, 6],
      },
      {
        scene: 'capital',
        lines: [
          '1950년 7월, 전쟁이 터지자 대전이 임시 수도가 되었다.',
          '21일 동안, 이 건물은 정부 청사였다.',
          '흥남에서 배를 탄 그 가족이 피란길에 오르기 몇 달 전의 일이다.',
        ],
        src: [5, 6],
      },
      {
        scene: 'walk',
        lines: [
          '2013년, 이 건물은 대전근현대사전시관이 되었다.',
          '빵집의 줄, 성당의 종탑, 도청의 계단.',
          '오늘 걸은 세 곳은 모두, 전쟁을 지나 다시 일어선 한 도시의 이야기였다.',
        ],
        src: [5],
      },
    ],
    next: '이야기를 다 들으셨나요? 들은 이야기로 퀴즈를 풀면 포인트가 쌓입니다.',
    more: [
      { text: '충청남도의 도청은 조선시대 충청감영이 있던 공주에 있다가 대전으로 옮겨 왔습니다.', src: [5] },
      { text: '처음엔 2층 건물이었고, 1960년경 3층을 더 올렸습니다.', src: [5] },
      { text: '외벽은 1932년 당시 유행하던 밝은 갈색 「스크래치 타일」입니다. 가까이서 긁힌 무늬를 찾아보세요.', src: [5] },
      { text: '도청이 내포신도시로 옮겨 간 뒤, 2013년 10월 1일 대전근현대사전시관으로 문을 열었습니다.', src: [5] },
    ],
    videos: [],
  },
];

/**
 * 돌발 퀴즈 30문제 (2026-11-08 사장님 지시: 넉넉하게 준비하고 신청자 연령대·인원에 맞춰 골라 쓴다).
 * 모두 위 출처로 확인한 사실에서만 낸다. 맞히면 10포인트, 한 문제 한 번.
 * - for: 잘 맞는 대상(kid 아이 동반 · adult 성인 · senior 어르신 동반)
 * - level: 1 쉬움 · 2 보통 · 3 어려움
 * - 보기 2개(O/X)는 아이·어르신용 쉬운 문제
 */
export type QuizAudience = 'kid' | 'adult' | 'senior';

export interface StoryQuiz {
  id: string;
  episode: number;
  q: string;
  choices: string[];
  answer: number;
  explain: string;
  for: QuizAudience[];
  level: 1 | 2 | 3;
  src: number[];
}

const OX = ['O (맞아요)', 'X (아니에요)'];
const ALL: QuizAudience[] = ['kid', 'adult', 'senior'];

export const BREAD_QUIZ: StoryQuiz[] = [
  // ── 1화 성심당 (10)
  { id: 'b1-start', episode: 1, q: '성심당이 처음 문을 연 곳은 어디일까요?', choices: ['대전역 앞 천막', '서울 백화점', '은행동 2층 건물'], answer: 0, explain: '1956년, 대전역 앞 천막 찐빵집에서 시작했어요.', for: ALL, level: 1, src: [1] },
  { id: 'b1-flour', episode: 1, q: '대흥동의 성당에서 받은 것은 무엇이었을까요?', choices: ['쌀 한 가마', '밀가루 두 포대', '설탕 한 상자'], answer: 1, explain: '밀가루 두 포대로 찐빵 장사를 시작했어요.', for: ALL, level: 1, src: [1] },
  { id: 'b1-first-bread', episode: 1, q: '성심당이 처음 팔았던 빵은?', choices: ['찐빵', '튀김소보로', '생크림 케이크'], answer: 0, explain: '대전역 앞 천막에서 찐빵을 쪄서 팔았어요.', for: ALL, level: 1, src: [1] },
  { id: 'b1-year-ox', episode: 1, q: '성심당은 1956년에 시작했다. O일까요, X일까요?', choices: OX, answer: 0, explain: '맞아요. 1956년 대전역 앞에서 시작했어요.', for: ['kid', 'senior'], level: 1, src: [1] },
  { id: 'b1-ship', episode: 1, q: '흥남부두에서 가족이 탄 마지막 배의 이름은?', choices: ['메러디스 빅토리호', '타이타닉호', '거북선'], answer: 0, explain: '마지막 배 메러디스 빅토리호에 올랐어요.', for: ['adult', 'senior'], level: 2, src: [1] },
  { id: 'b1-christmas', episode: 1, q: '피란 배가 거제도에 닿은 날은?', choices: ['설날', '12월 25일 크리스마스', '추석'], answer: 1, explain: '크리스마스에 닿아 「크리스마스의 기적」이라고 불러요.', for: ALL, level: 2, src: [1] },
  { id: 'b1-train', episode: 1, q: '가족이 서울에 가지 않고 대전에 남게 된 까닭은?', choices: ['기차가 대전역에서 고장 나서', '서울에 눈이 많이 와서', '표를 잃어버려서'], answer: 0, explain: '기차가 대전역에서 고장 났고, 대전이 마음에 들어 남았어요.', for: ALL, level: 2, src: [1] },
  { id: 'b1-share', episode: 1, q: '남은 찐빵을 들고 매일 찾아간 곳은?', choices: ['목척교 아래', '대전역 매표소', '시장 입구'], answer: 0, explain: '목척교 아래 배고픈 사람들에게 나눠 주었어요.', for: ALL, level: 2, src: [1] },
  { id: 'b1-name', episode: 1, q: '「성심당」의 「성심」은 무슨 뜻일까요?', choices: ['거룩한 마음', '성실한 사람', '별의 중심'], answer: 0, explain: '성심은 거룩한 마음이라는 뜻이에요.', for: ['adult', 'senior'], level: 3, src: [1] },
  { id: 'b1-station-shop', episode: 1, q: '성심당이 대전역 안에 다시 문을 연 해는?', choices: ['1956년', '2012년', '2020년'], answer: 1, explain: '2012년, 천막에서 시작한 지 56년 만이에요.', for: ['adult'], level: 3, src: [1] },
  // ── 2화 대흥동성당 (10)
  { id: 'b2-built', episode: 2, q: '지금의 대흥동성당 건물이 지어진 해는?', choices: ['1919년', '1962년', '2014년'], answer: 1, explain: '1962년에 지어졌고, 2014년 국가등록문화유산이 되었어요.', for: ['adult', 'senior'], level: 2, src: [2] },
  { id: 'b2-first', episode: 2, q: '대전의 첫 성당이 세워진 해는?', choices: ['1919년', '1950년', '1962년'], answer: 0, explain: '1919년 목동에 세워졌어요. 2019년이 100주년이었죠.', for: ['adult', 'senior'], level: 2, src: [7, 8] },
  { id: 'b2-stairs', episode: 2, q: '종지기가 종을 치러 오른 종탑 계단은 몇 개였을까요?', choices: ['50개', '120개', '300개'], answer: 1, explain: '120개의 계단을 오르내렸어요.', for: ALL, level: 1, src: [3] },
  { id: 'b2-years', episode: 2, q: '종지기는 몇 년 동안 종을 쳤을까요?', choices: ['5년', '20년', '50년'], answer: 2, explain: '1969년부터 2019년까지 50년이에요.', for: ALL, level: 1, src: [3] },
  { id: 'b2-sunday', episode: 2, q: '일요일에는 하루에 몇 번 종을 쳤을까요?', choices: ['한 번', '두 번', '세 번'], answer: 2, explain: '평일엔 두 번, 일요일엔 세 번 쳤어요.', for: ALL, level: 2, src: [3] },
  { id: 'b2-ox-human', episode: 2, q: '대흥동성당의 종은 2019년까지 사람이 직접 쳤다. O일까요, X일까요?', choices: OX, answer: 0, explain: '맞아요. 종지기가 줄을 당겨 울렸어요.', for: ['kid', 'senior'], level: 1, src: [3] },
  { id: 'b2-pillar-ox', episode: 2, q: '대흥동성당 안에는 커다란 기둥이 줄지어 서 있다. O일까요, X일까요?', choices: OX, answer: 1, explain: '아니에요. 넓은 내부를 기둥 없이 지었어요.', for: ['kid', 'senior'], level: 2, src: [2] },
  { id: 'b2-heritage', episode: 2, q: '대흥동성당은 어떤 문화유산일까요?', choices: ['국가등록문화유산', '세계유산', '천연기념물'], answer: 0, explain: '2014년 국가등록문화유산이 되었어요.', for: ['adult', 'senior'], level: 2, src: [2] },
  { id: 'b2-new-bells', episode: 2, q: '종을 전자식으로 바꾸며 더하기로 한 작은 종은 몇 개?', choices: ['3개', '8개', '12개'], answer: 1, explain: '기존 종 3개에 작은 종 8개를 더하기로 했어요.', for: ['adult'], level: 3, src: [3] },
  { id: 'b2-priest', episode: 2, q: '성당을 목동에서 대흥동으로 옮기고, 밀가루를 내준 신부는?', choices: ['오기선 신부', '김대건 신부', '최양업 신부'], answer: 0, explain: '오기선 신부예요.', for: ['adult'], level: 3, src: [1, 4] },
  // ── 3화 옛 충남도청 (10)
  { id: 'b3-moved', episode: 3, q: '충청남도 도청이 공주에서 대전으로 옮겨 온 해는?', choices: ['1932년', '1950년', '2013년'], answer: 0, explain: '1932년에 옮겨 왔어요.', for: ['adult', 'senior'], level: 2, src: [5, 6] },
  { id: 'b3-capital', episode: 3, q: '1950년, 대전은 며칠 동안 임시 수도였을까요?', choices: ['7일', '21일', '100일'], answer: 1, explain: '7월 1일부터 21일 동안이었어요.', for: ALL, level: 2, src: [5] },
  { id: 'b3-before', episode: 3, q: '도청이 대전에 오기 전에는 어느 도시에 있었을까요?', choices: ['공주', '청주', '서울'], answer: 0, explain: '조선시대 충청감영이 있던 공주에 있었어요.', for: ALL, level: 1, src: [5] },
  { id: 'b3-museum', episode: 3, q: '옛 충남도청 건물은 지금 무엇으로 쓰일까요?', choices: ['대전근현대사전시관', '기차역', '도서관'], answer: 0, explain: '2013년부터 대전근현대사전시관이에요.', for: ALL, level: 1, src: [5] },
  { id: 'b3-tile', episode: 3, q: '옛 도청 외벽에 붙인 타일의 이름은?', choices: ['스크래치 타일', '모자이크 타일', '유리 타일'], answer: 0, explain: '밝은 갈색 스크래치 타일이에요. 긁힌 무늬를 찾아보세요.', for: ['adult', 'senior'], level: 3, src: [5] },
  { id: 'b3-floors', episode: 3, q: '처음 지었을 때 도청은 몇 층이었을까요?', choices: ['1층', '2층', '5층'], answer: 1, explain: '2층으로 지었고, 1960년경 3층을 더 올렸어요.', for: ['adult'], level: 3, src: [5] },
  { id: 'b3-oldest-ox', episode: 3, q: '옛 충남도청은 대전에 남은 근대 관청 건물 중 가장 오래되었다. O일까요, X일까요?', choices: OX, answer: 0, explain: '맞아요. 대전에 남은 근대 관청 건물 중 가장 오래되었어요.', for: ['kid', 'senior'], level: 1, src: [5] },
  { id: 'b3-war-ox', episode: 3, q: '한국전쟁 때 이 건물이 정부 청사로 쓰였다. O일까요, X일까요?', choices: OX, answer: 0, explain: '맞아요. 임시 수도 시절 정부 청사였어요.', for: ['kid', 'senior'], level: 1, src: [5, 6] },
  { id: 'b3-opened', episode: 3, q: '대전근현대사전시관이 문을 연 해는?', choices: ['2002년', '2013년', '2020년'], answer: 1, explain: '2013년 10월 1일에 문을 열었어요.', for: ['adult'], level: 3, src: [5] },
  { id: 'b3-link', episode: 3, q: '대전 임시 수도(1950년 7월)와 흥남 철수(1950년 12월) 중 먼저 일어난 일은?', choices: ['대전 임시 수도', '흥남 철수'], answer: 0, explain: '대전 임시 수도가 먼저예요. 다섯 달쯤 뒤 흥남 철수가 있었어요.', for: ['adult', 'senior'], level: 2, src: [1, 5] },
];

/**
 * 신청자에 맞춰 화마다 몇 문제를 고른다.
 * 아이가 있으면 kid·쉬운 문제를, 어르신이 있으면 senior(O/X 포함)를, 아니면 adult 를 먼저.
 */
/** 한 화에 보여 줄 문제 수 — 3화 × 3 = 9문제(최대 90P) */
export const QUIZ_PER_EPISODE = 3;

export function pickQuizzes(
  group: { children: number; seniors: number } | undefined,
  perEpisode = QUIZ_PER_EPISODE,
): StoryQuiz[] {
  const want: QuizAudience =
    group && group.children > 0 ? 'kid' : group && group.seniors > 0 ? 'senior' : 'adult';
  const out: StoryQuiz[] = [];
  for (const ep of [1, 2, 3]) {
    const pool = BREAD_QUIZ.filter((q) => q.episode === ep);
    const fit = pool.filter((q) => q.for.includes(want)).sort((a, b) => a.level - b.level);
    const rest = pool.filter((q) => !q.for.includes(want));
    out.push(...[...fit, ...rest].slice(0, perEpisode));
  }
  return out;
}
