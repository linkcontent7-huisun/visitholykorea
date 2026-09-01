/**
 * 오늘의 질문 — 성지의 역사에서 길어 올린 성찰 질문 하나.
 *
 * 한 줄 기록의 빈 입력창은 쓰기 어렵지만, 질문이 있으면 답하게 된다.
 * 질문은 종교 언어를 쓰지 않는다 — 신자에게는 묵상이 되고, 비신자에게는
 * 그 장소가 자기 이야기가 되는 문이 된다. 체류 시간이 짧은 방문자(WYD
 * 해외 청년 포함)도 3분이면 질문 하나에 답을 남길 수 있다.
 *
 * 원칙: 성지별 질문은 그곳의 **널리 알려진 역사적 사실**에서만 뽑는다.
 * 역사를 모르는 성지에 지어낸 사연을 붙이지 않는다(더미 금지) — 그런 곳은
 * 분류 공통 질문으로 폴백한다.
 */

export interface ReflectionQuestion {
  ko: string;
  en: string;
}

/** 역사가 확인된 성지의 이름 → 질문. 앞에서부터 첫 일치를 쓴다. */
const NAME_QUESTIONS: ReadonlyArray<readonly [string, ReflectionQuestion]> = [
  [
    '절두산', // 한강가 참수 순교터
    {
      ko: '강은 그날을 기억합니다. 당신이 잊고 싶지 않은 하루는 언제인가요?',
      en: 'The river remembers that day. What day do you never want to forget?',
    },
  ],
  [
    '솔뫼', // 김대건 신부 탄생지 — 15세에 마카오 유학길에 오름
    {
      ko: '열다섯의 김대건은 집을 떠났습니다. 당신은 무엇을 위해 떠나 본 적이 있나요?',
      en: 'At fifteen, Kim Taegon left home. What have you ever left home for?',
    },
  ],
  [
    '해미', // 이름이 기록되지 않은 순교자들의 땅 (여숫골)
    {
      ko: '이곳 순교자 다수는 이름이 남지 않았습니다. 이름이 남지 않아도 지킬 가치가 있는 것은 무엇일까요?',
      en: 'Most who died here left no names. What is worth keeping even if your name is never remembered?',
    },
  ],
  [
    '배론', // 박해를 피해 옹기 굽던 토굴 교우촌·신학당
    {
      ko: '이곳 사람들은 숨어서도 배움을 이어갔습니다. 숨어서라도 계속하고 싶은 일이 있나요?',
      en: 'People here kept learning even in hiding. Is there something you would keep doing, even in hiding?',
    },
  ],
  [
    '갈매못', // 바닷가 처형지
    {
      ko: '바다 앞에서, 당신은 어떤 두려움을 내려놓고 싶나요?',
      en: 'Standing before the sea, what fear would you like to lay down?',
    },
  ],
  [
    '명동', // 한국 교회의 중심 — 공동체가 세운 대성당
    {
      ko: '이 성당은 한 사람이 아니라 공동체가 세웠습니다. 당신을 지금의 당신으로 만든 사람들은 누구인가요?',
      en: 'No single person built this cathedral — a community did. Who made you who you are?',
    },
  ],
  [
    '약현', // 한국 최초의 벽돌 성당 — 모든 것의 처음
    {
      ko: '이곳은 한국 최초의 벽돌 성당입니다. 당신의 수많은 처음 중, 가장 소중한 처음은 무엇인가요?',
      en: 'This was the first brick church in Korea. Of all your firsts, which one matters most?',
    },
  ],
  [
    '전동', // 호남 첫 순교터 위에 세워진 성당
    {
      ko: '이 아름다운 성당은 아픈 자리 위에 세워졌습니다. 아픔 위에 무엇을 세울 수 있을까요?',
      en: 'This beautiful church stands on a painful ground. What can be built upon pain?',
    },
  ],
  [
    '되재', // 한옥 성당 — 낯선 신앙이 한국의 모습으로
    {
      ko: '낯선 것이 이 땅의 모습을 입은 집입니다. 낯선 것을 온전히 내 것으로 만든 경험이 있나요?',
      en: 'Here, something foreign took a Korean form. When did something foreign become truly yours?',
    },
  ],
  [
    '나바위', // 한옥·양옥 절충 성당
    {
      ko: '낯선 것이 이 땅의 모습을 입은 집입니다. 낯선 것을 온전히 내 것으로 만든 경험이 있나요?',
      en: 'Here, something foreign took a Korean form. When did something foreign become truly yours?',
    },
  ],
  [
    '풍수원', // 박해를 피해 모여 산 교우촌에서 자란 성당
    {
      ko: '쫓기던 사람들이 모여 살며 서로의 피난처가 된 곳입니다. 당신이 가장 안전하다고 느끼는 곳은 어디인가요?',
      en: 'The hunted gathered here and became each other’s refuge. Where do you feel truly safe?',
    },
  ],
];

/** 분류 공통 질문 — 역사를 모르는 성지에 사연을 지어내지 않기 위한 폴백. */
const CATEGORY_QUESTIONS: Record<string, ReflectionQuestion> = {
  순교성지: {
    ko: '당신이 끝까지 지키고 싶은 것은 무엇인가요?',
    en: 'What would you hold on to, to the very end?',
  },
  주교좌성당: {
    ko: '오늘, 누구를 위해 초 하나를 켜고 싶나요?',
    en: 'Who would you light a candle for today?',
  },
  역사사적지: {
    ko: '백 년 뒤의 사람들에게 당신은 무엇을 남기고 싶나요?',
    en: 'What would you like to leave for people a hundred years from now?',
  },
  순례길: {
    ko: '이 길 위에 내려놓고 가고 싶은 것 하나는 무엇인가요?',
    en: 'What is one thing you want to set down on this road?',
  },
};

const DEFAULT_QUESTION: ReflectionQuestion = {
  ko: '지금 이 순간, 당신의 마음은 어디에 머물고 있나요?',
  en: 'Where does your heart rest at this moment?',
};

/** 성지 이름·분류로 오늘의 질문을 정한다. 항상 하나를 반환한다. */
export function resolveReflectionQuestion(
  siteName: string,
  category: string | null,
): ReflectionQuestion {
  for (const [pattern, question] of NAME_QUESTIONS) {
    if (siteName.includes(pattern)) return question;
  }
  const categoryQuestion = category ? CATEGORY_QUESTIONS[category] : undefined;
  return categoryQuestion ?? DEFAULT_QUESTION;
}
