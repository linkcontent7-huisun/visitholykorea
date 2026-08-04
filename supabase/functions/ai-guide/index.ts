/**
 * AI 순례 가이드 '미카엘' — Supabase Edge Function (Deno).
 *
 * 두 가지 이유로 클라이언트가 아니라 여기서 Gemini를 호출한다.
 *  1. API 키를 브라우저 번들에 노출하지 않는다.
 *  2. 답변 범위를 우리 성지 DB로 제한해 환각(hallucination)을 통제한다.
 *     종교 성지의 역사·전례 정보는 틀리면 신뢰가 바로 무너지는 영역이라,
 *     "컨텍스트에 없으면 모른다고 답하라"를 시스템 프롬프트에 못 박아 둔다.
 *
 * 배포:
 *   supabase secrets set GEMINI_API_KEY=...
 *   supabase functions deploy ai-guide
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// 모델은 환경변수로 갈아끼울 수 있게 둔다(모델 교체 때 코드 수정이 필요 없도록).
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MICHAEL_SYSTEM_INSTRUCTION = `당신은 천주교 성지순례 안내 챗봇 '미카엘(대천사)'입니다. 아래 규칙을 엄격히 준수하여 응대하세요.

[역할]
- 사용자가 원하는 지역, 시간, 상황에 최적화된 성지순례 일정 및 경로를 제안합니다.
- 성당 미사 시간, 개방 여부 등 사실 정보는 정확하게 안내합니다.

[말투 규칙]
- 따뜻하고 은혜로우며, 순례자의 영성을 북돋우는 천사 같은 어조를 유지하세요.
- 친절하되 명확하고 간결하게 답변하세요.

[분량 규칙] — 가장 중요
- 채팅창에서 한눈에 읽혀야 합니다. 마크다운 제목(#, ##)이나 긴 소제목 나열은 쓰지 마세요.
- 단순 정보/설명 질문(성지 소개, 역사 등)은 3~5문장의 짧은 문단으로만 답하세요. 항목을 나열할 때는 짧은 불릿(-) 2~4개 이내로 요약하세요.
- 여러 장소를 묶은 '일정/코스'를 물어볼 때만 표(Table)를 사용하세요. 그 외에는 표를 쓰지 마세요.
- 강조가 필요한 곳에만 **굵게**를 짧게 사용하고, 답변 전체를 굵게 도배하지 마세요.
- 답변 끝에는 신자에게는 평화를, 비신자에게는 따뜻한 위로를 전하는 짧은 축복 문구를 한 줄만 덧붙이세요.

[사실 정보 규칙] — 가장 중요
- 아래 [성지 정보] 컨텍스트에 있는 사실만 근거로 답하세요.
- 컨텍스트에 없는 내용은 절대 지어내지 말고, "부끄럽지만 저 미카엘 천사도 잘 모르는 부분이에요. 공식 홈페이지나 성지 사무실을 통해 당일 확인을 부탁드려요."라고 안내하세요.
- 날짜, 인물, 사건은 특히 추측하지 마세요.
- 추측에 기반한 단정적 표현("~일 것입니다", "확실합니다")을 쓰지 마세요.

[되묻기]
- 질문이 모호하거나 정보가 부족하면 바로 답하지 말고, 필요한 것(지역, 출발지, 인원, 일정 등)을 최대 3개까지 짧게 먼저 되물으세요.

[금지 사항]
- 특정 신앙 강요, 사이비·이단 관련 정보, 강압적 언어("절대 안 돼요") 금지.`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

async function callGemini(systemInstruction: string, userPrompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini 호출 실패 (HTTP ${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as GeminiResponse;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * 질문과 관련된 성지 레코드를 뽑아 프롬프트 컨텍스트로 만든다(간이 RAG).
 * 성지 수가 200곳 내외라 이름·주소 부분 일치 검색으로 충분하며,
 * 콘텐츠가 늘어나면 pgvector 임베딩 검색으로 교체한다.
 */
async function buildSiteContext(question: string): Promise<string> {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

  // 질문에서 2글자 이상 토큰만 뽑아 OR 검색한다.
  const tokens = question
    .split(/[\s,.!?·]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 5);

  if (tokens.length === 0) return '';

  const orFilter = tokens
    .flatMap((t) => [`name.ilike.%${t}%`, `location.ilike.%${t}%`, `description.ilike.%${t}%`])
    .join(',');

  const { data, error } = await supabase
    .from('holy_sites')
    .select('name, category, diocese, location, description, history')
    .or(orFilter)
    .limit(5);

  if (error || !data?.length) return '';

  return data
    .map(
      (s) =>
        `- ${s.name} (${s.category ?? '성지'}, ${s.diocese ?? ''}교구)\n` +
        `  주소: ${s.location ?? '정보 없음'}\n` +
        `  소개: ${s.description ?? '정보 없음'}\n` +
        `  역사: ${s.history ?? '정보 없음'}`,
    )
    .join('\n\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY 미설정' }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const question: string = payload.question ?? '';

    const context = await buildSiteContext(question);
    const prompt = context
      ? `[성지 정보]\n${context}\n\n[질문]\n${question}`
      : `[성지 정보]\n(관련된 성지 정보를 찾지 못했습니다)\n\n[질문]\n${question}`;

    const text = await callGemini(MICHAEL_SYSTEM_INSTRUCTION, prompt);

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-guide error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
