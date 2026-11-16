import type { Language } from '@/shared/i18n/dictionary';

/**
 * 「성지순례, 처음이라면」 안내 글 (`/guide`).
 *
 * 구글 '성지순례' 검색어를 노린 글이다(2026-11-16 사장님 결정). 검색하는 사람 대부분이 처음 가려는 사람이라
 * 그 질문에 답하는 글이 있어야 검색엔진이 이 단어와 사이트를 잇는다.
 * 확인 안 된 사실(성지별 휴무일·순례 수첩 도장)은 넣지 않았다. 외국어는 한국어 검토가 끝난 뒤 옮긴다 — 그 전엔 한국어를 보인다.
 */
export interface GuideSection {
  heading: string;
  body?: string;
  /** 앱 안 화면으로 이어지는 항목 — to 는 paths 의 키 */
  items?: { text: string; to?: 'nearby' | 'compass' | 'routes' | 'records' | 'search' }[];
}

export interface GuideContent {
  title: string;
  lead: string;
  sections: GuideSection[];
}

const KO: GuideContent = {
  title: '성지순례, 처음이라면',
  lead: '성지순례는 신앙의 선조들이 살고, 기도하고, 목숨을 바친 자리를 찾아가 기도하는 여정입니다. 한국에는 박해 시대 순교자들의 자취가 남은 천주교 성지가 전국에 200곳 넘게 있습니다.',
  sections: [
    {
      heading: '1. 어디로 갈까요',
      items: [
        { text: '가까운 곳부터 — 지금 위치에서 가까운 성지를 찾습니다.', to: 'nearby' },
        {
          text: '마음 가는 대로 — 오늘의 성지가 지금 마음에 맞는 곳을 골라 줍니다.',
          to: 'compass',
        },
        { text: '하루 코스로 — 여러 성지를 이어 걷는 순례 코스를 고릅니다.', to: 'routes' },
        { text: '이름이나 지역으로 — 성지 이름·지역으로 바로 찾습니다.', to: 'search' },
      ],
    },
    {
      heading: '2. 떠나기 전에 확인할 것',
      items: [
        {
          text: '미사 시간 — 성지마다 다르고 바뀔 수 있습니다. 성지 페이지의 시간을 보고, 성지 사무실에 한 번 더 확인하세요.',
        },
        { text: '여는 시간 — 성지마다 개방 시간이 다릅니다. 떠나기 전에 확인하세요.' },
        { text: '가는 길 — 성지 페이지의 길찾기를 누르면 지도로 바로 이어집니다.' },
      ],
    },
    {
      heading: '3. 성지에서',
      items: [
        { text: '조용히 머뭅니다. 미사나 기도 중인 분들을 배려해 주세요.' },
        { text: '다녀온 성지는 순례 기록에 쌓입니다.', to: 'records' },
      ],
    },
    {
      heading: '4. 신자가 아니어도 괜찮나요?',
      body: '네. 성지는 누구에게나 열려 있습니다. 역사와 자연 속에서 쉬어 가는 시간으로도 충분합니다.',
    },
  ],
};

export const GUIDE: Partial<Record<Language, GuideContent>> & { ko: GuideContent } = { ko: KO };
