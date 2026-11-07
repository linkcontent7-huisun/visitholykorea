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
  },
];
