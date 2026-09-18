/**
 * AI 순례 가이드 '미카엘' 클라이언트.
 *
 * Gemini API 키는 클라이언트 번들에 넣지 않는다(넣으면 누구나 추출해 쓸 수 있다).
 * 대신 Supabase Edge Function `ai-guide` 를 호출하고, 키·프롬프트·컨텍스트 주입은
 * 서버에서 처리한다. 함수 구현은 `supabase/functions/ai-guide/index.ts` 참고.
 */

import { supabase } from '@/shared/api/supabase';

/** 호출부가 이 값과 비교해 "정말 실패했는지"를 판단할 수 있도록 export 한다. */
export const FALLBACK_ANSWER =
  '죄송합니다. 현재 가이드 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.';

/**
 * 사용자가 설정에서 직접 알려준 경우에만 채워 보낸다.
 * 앱이 추측해서 채우면 안 된다 — 눈높이 맞춤은 기본적으로 서버 프롬프트가
 * 대화 단서로 처리하고, 이 값은 그것을 덮어쓰는 명시적 신호다.
 */
export interface AiGuideAudience {
  ageGroup?: '10대' | '20대' | '30대' | '40대' | '50대' | '60대 이상';
  faith?: '신자' | '비신자';
}

export interface ChatTurn {
  role: 'user' | 'bot';
  text: string;
}

export interface AiGuideAnswer {
  text: string;
  /** Gemini 가 못 답해 서버가 검색 결과를 정보 카드로 돌려준 경우 — 화면에 작은 띠로 알린다 */
  fallback: boolean;
  /** 답의 근거가 된 성지 이름 — 「참고한 성지」 한 줄 */
  sources: string[];
}

interface AskPayload {
  mode: 'ask';
  question: string;
  audience?: AiGuideAudience;
  /** 직전 대화 몇 턴 — 서버는 저장하지 않고 문맥으로만 쓴다 */
  history?: ChatTurn[];
}

/** 요청에 실어 보내는 직전 턴 수. 서버(MAX_HISTORY_TURNS)와 같다. */
export const HISTORY_TURNS = 6;

async function invoke(payload: AskPayload): Promise<AiGuideAnswer | null> {
  const { data, error } = await supabase.functions.invoke<{ text: string; fallback?: boolean; sources?: string[] }>(
    'ai-guide',
    { body: payload },
  );
  if (error) {
    console.error('ai-guide invoke error:', error);
    return null;
  }
  const text = data?.text?.trim();
  if (!text) return null;
  return { text, fallback: Boolean(data?.fallback), sources: data?.sources ?? [] };
}

/**
 * 자유 질문에 답한다. 답변은 마크다운으로 돌아오므로 화면에서 그대로 렌더링한다.
 * 답변 범위는 서버에서 성지 DB 컨텍스트로 제한된다. `history` 는 직전 대화(문맥용).
 */
export async function askAIGuide(
  question: string,
  history: ChatTurn[] = [],
  audience?: AiGuideAudience,
): Promise<AiGuideAnswer> {
  const answer = await invoke({ mode: 'ask', question, audience, history: history.slice(-HISTORY_TURNS) });
  return answer ?? { text: FALLBACK_ANSWER, fallback: true, sources: [] };
}
