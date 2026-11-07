/**
 * 체험여행 프로그램 (2026-11-03, 한남대 바이브코딩 본선 시연용 1호).
 *
 * 내용은 제출한 아이디어 제안서(`docs/50-research/벤치마킹/제출용/`)를 그대로 옮겼다.
 * 시각은 **예시 일정**이다 — 성당·성심당·한남대와 협의 전이라 화면에도 「추후 협의」로 밝힌다.
 * 기관이 직접 등록하는 단계가 오면 이 파일 대신 DB 표에서 읽는다.
 */

export interface ProgramStop {
  time: string;
  place: string;
  /** 그 자리에서 하는 체험 — 없으면 이동·관람 */
  activity?: string;
}

export interface ProgramCourse {
  code: 'A' | 'B';
  name: string;
  summary: string;
  stops: ProgramStop[];
}

export interface ExperienceProgram {
  slug: string;
  /** 이 프로그램 카드를 띄울 교구(holy_sites.region) */
  region: string;
  series: string;
  /** 주최 기관 — 접수 동의 문구에 「명단을 받는 곳」으로 나온다 */
  organizer: string;
  title: string;
  hook: string;
  lines: string[];
  experiences: { name: string; detail: string }[];
  courses: ProgramCourse[];
  notice: string;
}

export const PROGRAMS: ExperienceProgram[] = [
  {
    slug: 'bread-from-heaven',
    region: '대전',
    series: '체험여행 1호 · 대전',
    organizer: '한남대',
    title: '하늘에서 빵이 내린다면',
    hook: '빵 줄에서 시작해, 종소리로 이어지는 하루',
    lines: [
      '성심당 앞 기다림은 이야기를 듣는 시간이 되고,',
      '대흥동성당의 종은 직접 찾아보는 수수께끼가 되고,',
      '선비의 집과 선교사의 집은 나란히 비교해 보는 교실이 됩니다.',
    ],
    experiences: [
      { name: '줄 사이 20분', detail: '기다리는 시간에 맞춰 듣는 오디오 이야기' },
      { name: '종지기를 찾습니다', detail: '2019년까지 사람이 치던 종 — 작은 종 기념품' },
      { name: '두 집 비교 관찰', detail: '동춘당과 한남대 선교사촌을 나란히' },
      { name: '돌발 퀴즈', detail: '들은 이야기로 퀴즈를 풀고 포인트 적립' },
    ],
    courses: [
      {
        code: 'A',
        name: '원도심 도보',
        summary: '대전역에서 걸어서 이어지는 코스',
        stops: [
          { time: '10:00', place: '대전역 집결' },
          { time: '10:20~11:00', place: '성심당', activity: '줄 사이 20분' },
          { time: '11:20~12:20', place: '대흥동성당', activity: '종지기를 찾습니다' },
          { time: '12:40~13:30', place: '대전근현대사전시관(옛 충남도청)', activity: '돌발 퀴즈' },
        ],
      },
      {
        code: 'B',
        name: '대덕구',
        summary: '숲길을 걷고 두 집을 비교하는 코스',
        stops: [
          { time: '10:00', place: '계족산 황톳길 입구 집결' },
          { time: '10:00~11:00', place: '계족산 황톳길 한 구간' },
          { time: '11:30~12:20', place: '동춘당', activity: '두 집 비교 관찰 ①' },
          { time: '12:40~13:30', place: '한남대 선교사촌', activity: '두 집 비교 관찰 ② · 돌발 퀴즈' },
        ],
      },
    ],
    notice: '시범 운영 프로그램입니다. 일정·인원·비용은 기관과 협의해 확정할 예정입니다.',
  },
];

export function findProgram(slug: string | undefined): ExperienceProgram | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export function programsForRegion(region: string | undefined): ExperienceProgram[] {
  return region ? PROGRAMS.filter((p) => p.region === region) : [];
}
