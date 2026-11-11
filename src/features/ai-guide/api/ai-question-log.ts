/**
 * 미카엘 질문·답 익명 기록 — 답변 품질 개선과 재학습 자료용 (2026-11-11 사장님 지시).
 *
 * `ai-chat.repository` (로그인한 사람의 대화 이어 보기)와는 **별개**다. 여기는 로그인 여부와 상관없이
 * 질문과 답을 계정과 연결하지 않고 쌓는다 — 표 `ai_question_logs`, 앱은 넣기만 할 수 있다.
 *
 * 이 함수는 **절대 던지지 않는다.** 표가 아직 없거나, 권한이 없거나, 네트워크가 끊겨도
 * 대화 화면에는 아무 영향이 없어야 한다 (기록은 덤이고 대화가 본업이다).
 */

import { supabase } from '@/shared/api/supabase';

export interface QuestionLogEntry {
  question: string;
  answer: string;
  /** 질문할 때의 화면 언어 */
  language: string;
  sources: string[];
  /** 서버가 답하지 못해 준비된 문구로 대신했는가 */
  fallback: boolean;
  signedIn: boolean;
}

const TABLE = 'ai_question_logs';

export async function logQuestion(entry: QuestionLogEntry): Promise<void> {
  const question = entry.question.trim().slice(0, 2000);
  if (!question) return;
  try {
    const { error } = await supabase.from(TABLE).insert({
      question,
      answer: entry.answer.slice(0, 8000),
      language: entry.language.slice(0, 8),
      sources: entry.sources.slice(0, 20),
      fallback: entry.fallback,
      signed_in: entry.signedIn,
    });
    if (error) console.warn('logQuestion skipped:', error.message);
  } catch (e) {
    console.warn('logQuestion skipped:', e);
  }
}
