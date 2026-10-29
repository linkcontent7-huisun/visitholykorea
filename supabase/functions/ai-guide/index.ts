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
import modelList from './models.json' with { type: 'json' };
import { fixKoreanTypedInEnglish, looksLikeForeignSentence } from '../_shared/keyboard-hangul.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
/**
 * Gemini 가 끝내 못 답하면 Claude 로 넘어간다 (2026-09-19 사장님 결정). 같은 시스템 프롬프트·같은 성지
 * 컨텍스트·같은 대화 이력을 그대로 보내므로 "컨텍스트 밖은 모른다" 규칙(CLAUDE.md)은 그대로 지켜진다.
 * 키가 없으면 이 단계는 건너뛰고 예전처럼 정보 카드로 간다.
 */
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const CLAUDE_MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-haiku-4-5-20251001';
/** Claude 가 준비돼 있으면 Gemini 를 오래 두드릴 이유가 줄어든다. 'true' 면 Gemini 는 3회만 보고 Claude 로. 기본은 사장님 지시대로 20~30회. */
const GEMINI_QUICK_HANDOFF =
  Deno.env.get('GEMINI_QUICK_HANDOFF') === 'true' && Boolean(ANTHROPIC_API_KEY);
/**
 * 1순위 답변자. 'claude' 면 Claude 가 먼저 답하고 Gemini 가 예비, 그 밖(기본)은 Gemini 먼저.
 * 2026-09-19: Gemini 무료 한도가 시연에 불안해 Claude 유료(API 크레딧)를 1순위로 두기로 함. 시크릿 하나로 바꾼다.
 */
const AI_PRIMARY =
  Deno.env.get('AI_PRIMARY') === 'claude' && Boolean(ANTHROPIC_API_KEY) ? 'claude' : 'gemini';
// 모델은 환경변수로 갈아끼울 수 있게 둔다(모델 교체 때 코드 수정이 필요 없도록).
/**
 * 모델 후보 순서. 이름은 시크릿에 박지 않는다 — `models.json` 을 GitHub Actions 가 매일 ListModels 로
 * 갱신하고 재배포한다(사장님 지시 2026-09-19, 모델명 변동이 심해서). `GEMINI_MODEL` 시크릿은 급할 때
 * 맨 앞에 끼워 넣는 임시 덮어쓰기용이다.
 */
const GEMINI_MODEL_OVERRIDE = Deno.env.get('GEMINI_MODEL');
const BUNDLED_MODELS: string[] = (modelList as { models?: string[] }).models ?? [];

// H-01(보안 진단 2026-09-13): '*' 대신 허용 도메인만. 프리뷰 도메인이 필요하면 ALLOWED_ORIGINS 시크릿에 쉼표로 추가.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://visitholykorea-app.vercel.app')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// H-01: 질문 길이 상한. 시스템 프롬프트의 [되묻기] 규칙상 긴 입력은 필요 없다.
const MAX_QUESTION_LEN = 1000;

const MICHAEL_SYSTEM_INSTRUCTION = `당신은 천주교 성지순례 안내 챗봇 '미카엘(대천사)'입니다. 아래 규칙을 엄격히 준수하여 응대하세요.

[역할]
- 사용자가 원하는 지역, 시간, 상황에 최적화된 성지순례 일정 및 경로를 제안합니다.
- 주소·연락처·주변 명소 같은 사실 정보는 [성지 정보]에 적힌 그대로 정확하게 안내합니다. 미사 시간·개방 시간처럼 자주 바뀌는 정보는 이 자료에 없으니 지어내지 말고, 성지의 「문의」에 적힌 홈페이지·전화번호를 알려 주세요.

[말투 규칙]
- 밝고 긍정적이며 따뜻한 어조를 유지하세요 — 순례를 앞둔 설렘을 북돋우는 안내자입니다. 무겁거나 애잔한 표현, 걱정·근심을 묻는 말은 피하세요.
- 친절하되 명확하고 간결하게 답변하세요. 항상 존댓말을 씁니다.

[상대에 맞추기] — 페르소나는 하나, 눈높이는 상대를 따른다
- 신앙 여부:
  · 미사·성체·고해·묵주기도 같은 전례 용어를 자연스럽게 쓰는 분에게는 같은 용어로 답하세요.
  · 그런 용어 없이 묻는 분에게는 신자라고 가정하지 말고, 전례 용어가 나오면 짧게 풀어 쓰세요
    (예: "미사(가톨릭의 예배)"). 역사·건축·여행의 관점으로도 충분히 흥미롭게 안내하세요.
  · 신앙을 권유하지 마세요. 비신자의 방문 목적(여행, 사진, 역사 공부)도 똑같이 존중합니다.
- 나이대: 절대 나이를 묻거나 추측해 단정하지 마세요. 대신 대화의 단서에 맞추세요.
  · 짧은 문장·유행어·이모지로 묻는 분 → 쉬운 단어, 짧은 문장. 다만 존댓말은 유지.
  · "수학여행", "과제" → 학생 눈높이: 배경지식 없이도 이해되게, 핵심 위주로.
  · "아이와 함께", "부모님 모시고" → 동행자 배려: 이동 거리·계단·화장실·식사 같은 실전 정보를 먼저.
  · "무릎이 아파서", "차가 없어서" → 조건을 코스 제안에 반드시 반영 (도보 최소화, 대중교통 등).
  · 격식 있는 문어체로 묻는 분 → 차분하고 정중한 문어체로.
- 성별: 성별을 추측하지 말고, 성별에 따라 말투·내용을 바꾸지 마세요. 모든 분께 동등하게 응대합니다.
- 사용자가 프로필(연령대·신앙 여부)을 직접 알려준 경우에만 그 정보를 우선하세요.

[분량 규칙] — 가장 중요
- 채팅창에서 한눈에 읽혀야 합니다. 마크다운 제목(#, ##)이나 긴 소제목 나열은 쓰지 마세요.
- 단순 정보/설명 질문(성지 소개, 역사 등)은 3~5문장의 짧은 문단으로만 답하세요. 항목을 나열할 때는 짧은 불릿(-) 2~4개 이내로 요약하세요.
- 여러 장소를 묶은 '일정/코스'를 물어볼 때만 표(Table)를 사용하세요. 그 외에는 표를 쓰지 마세요.
- 강조가 필요한 곳에만 **굵게**를 짧게 사용하고, 답변 전체를 굵게 도배하지 마세요.
- 답변 끝에는 짧은 마무리 한 줄을 덧붙이되 상대에 맞추세요 — 신자로 보이는 분에게는 평화의 축복을, 그렇지 않은 분에게는 종교색 없는 따뜻한 응원("좋은 여행 되세요" 등)을 전하세요.

[사실 정보 규칙] — 가장 중요
- 아래 [성지 정보] 컨텍스트에 있는 사실만 근거로 답하세요.
- 컨텍스트에 없는 내용은 절대 지어내지 말고, "부끄럽지만 저 미카엘 천사도 잘 모르는 부분이에요. 공식 홈페이지나 성지 사무실을 통해 당일 확인을 부탁드려요."라고 안내하세요.
  이때 "모른다"로만 끝내지 마세요. 컨텍스트에 있는 가장 가까운 정보(그 성지의 홈페이지·전화번호, 주변 명소, 같은 지역의 다른 성지)를 이어서 알려 주세요.
- 컨텍스트에 질문과 관련된 성지가 있는데도 "모른다"고 하지 마세요. 소개·역사 글을 꼼꼼히 읽고 거기 있는 내용으로 먼저 답하세요 (예: 인물을 물으면 그 인물이 나오는 성지의 역사 글에서 찾는다).
- 질문이 앞선 대화를 이어 가는 말("거기", "그곳", "미사 시간은?")이면 직전에 말한 성지를 가리키는 것으로 보고 답하세요.
- 날짜, 인물, 사건은 특히 추측하지 마세요.
- 추측에 기반한 단정적 표현("~일 것입니다", "확실합니다")을 쓰지 마세요.
- [성지 정보]가 비어 있거나 "찾지 못했습니다"이면, 일반 지식으로 장소 이름을 들지 마세요(예시로도 금지 — 다른 종교 시설이나 해외 순례지가 섞여 들어갑니다).
  "성지가 뭐예요?" 같은 개념 질문에는 한두 문장으로 풀어 설명하고, 이 앱은 한국 천주교 성지를 안내한다고 밝힌 뒤 어느 지역·어떤 성지가 궁금한지 되물으세요.

[되묻기]
- 컨텍스트에 후보 성지가 있으면 되묻기 전에 먼저 그 후보를 소개하세요. 그 위에서 더 좁히고 싶을 때만 필요한 것(지역, 출발지, 동행, 일정 중 한두 가지)을 끝에 짧게 되물으세요.
- 후보가 전혀 없고 정말 정보가 부족할 때만, 필요한 것을 최대 3개까지 짧게 먼저 되물으세요.

[금지 사항]
- 특정 신앙 강요, 사이비·이단 관련 정보, 강압적 언어("절대 안 돼요") 금지.
- 사용자가 한국어가 아닌 언어(영어·스페인어·프랑스어·이탈리아어·포르투갈어 등)로 물으면 **그 언어로** 답한다. 성지 이름은 그 언어 표기 뒤에 한국어 원어를 괄호로 한 번 붙인다. 예: Haemi Martyrs' Shrine (해미순교성지). (2026-10-14 — WYD 해외 방문객 대비)`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

class RateLimitError extends Error {}
/** 업스트림 상태만 담는다(본문·키 없음) — 폴백 이유를 화면 쪽에서 볼 수 있게 */
class GeminiHttpError extends Error {
  constructor(public status: number) {
    super(`Gemini HTTP ${status}`);
  }
}

type Turn = { role: 'user' | 'bot'; text: string };

/** 직전 몇 턴만 실어 보낸다 — 저장이 아니라 문맥. 오래된 대화를 통째로 보내면 토큰·한도를 먹는다. */
const MAX_HISTORY_TURNS = 6;

/** 한 번의 시도가 이보다 오래 끌면 끊는다 — 과부하(503)는 보통 1~2초 안에 오므로 이 값은 정상 응답용이다. */
const GEMINI_ATTEMPT_TIMEOUT_MS = 6_000;
/**
 * 재시도 규칙 (2026-09-19 사장님: "최소 20회, 최대 30회. 정확하게 지켜라").
 * 503(과부하)·429(분당 한도)·5xx·시간 초과·네트워크 오류·빈 답이면 다시 부른다.
 * - 20회까지는 시간에 관계없이 **반드시** 시도한다.
 * - 21~30회는 전체 경과가 GEMINI_EXTRA_BUDGET_MS 안일 때만 이어 간다 — Edge Function 은 150초를 넘기면
 *   플랫폼이 끊어 버려 답을 아예 못 돌려준다. 시도당 최대 6초 + 쉬는 시간 1초라 20회는 그 안에 든다.
 * - models.json 의 모델을 순서대로 번갈아 부른다. 이름이 없는(404) 모델은 그 자리에서 제외, 전부 없으면 ListModels 로 재발견.
 */
const GEMINI_MIN_ATTEMPTS = 20;
const GEMINI_MAX_ATTEMPTS = 30;
const GEMINI_EXTRA_BUDGET_MS = 110_000;
/** 429(한도)는 재시도해도 한도만 더 깎인다 — 몇 번만 보고 정보 카드로 */
const RATE_LIMIT_MAX_RETRIES = 3;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** ListModels 결과(1시간 캐시). CI 가 갱신하는 models.json 이 전부 죽었을 때만 쓰는 비상용. */
let discovered: { at: number; models: string[] } | null = null;
async function discoverModels(force = false): Promise<string[]> {
  if (!force && discovered && Date.now() - discovered.at < 60 * 60 * 1000) return discovered.models;
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
      {
        headers: { 'x-goog-api-key': GEMINI_API_KEY! },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) return [];
    const { models = [] } = (await res.json()) as {
      models?: { name: string; supportedGenerationMethods?: string[] }[];
    };
    const names = models
      .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''))
      .filter(
        (n) =>
          /^gemini-/.test(n) &&
          !/(embedding|image|audio|tts|live|vision|exp|preview|thinking|robotics|computer|latest)/i.test(
            n,
          ),
      )
      .sort(
        (a, b) =>
          (/flash-lite/.test(a) ? 1 : /flash/.test(a) ? 0 : 2) -
          (/flash-lite/.test(b) ? 1 : /flash/.test(b) ? 0 : 2),
      );
    discovered = { at: Date.now(), models: names.slice(0, 4) };
    console.warn('ai-guide: ListModels 로 모델 재발견 —', discovered.models.join(', '));
    return discovered.models;
  } catch (err) {
    console.error('ai-guide: ListModels 실패', err);
    return [];
  }
}

/** 시도할 모델 순서: 시크릿 덮어쓰기 → models.json → (둘 다 비면) ListModels. */
async function candidateModels(): Promise<string[]> {
  const list = [GEMINI_MODEL_OVERRIDE, ...BUNDLED_MODELS].filter((m): m is string => Boolean(m));
  const unique = list.filter((m, i) => list.indexOf(m) === i);
  return unique.length > 0 ? unique : await discoverModels();
}

class ClaudeHttpError extends Error {
  constructor(public status: number) {
    super(`Claude HTTP ${status}`);
  }
}
const CLAUDE_TIMEOUT_MS = 20_000;

/** Gemini 실패 뒤의 두 번째 답변자. 프롬프트·이력 구성은 Gemini 와 같다. */
async function callClaude(
  systemInstruction: string,
  userPrompt: string,
  history: Turn[] = [],
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      // sonnet-5 는 기본으로 생각(thinking)을 하고 그 토큰이 max_tokens 에 포함된다 — 800 이면 코스 질문에서
      // 생각만 하다 끝나 본문이 비었다(2026-09-20 실측, 20문항 중 1건 claude_204 폴백). 넉넉히 주고 생각은 얕게.
      max_tokens: 2048,
      output_config: { effort: 'low' },
      system: systemInstruction,
      messages: [
        ...history.map((h) => ({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.text })),
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    console.error(
      `Claude 호출 실패 (${CLAUDE_MODEL}, HTTP ${res.status}):`,
      (await res.text()).slice(0, 300),
    );
    throw new ClaudeHttpError(res.status);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  if (!text) throw new ClaudeHttpError(204);
  return text;
}

async function callGeminiOnce(
  model: string,
  systemInstruction: string,
  userPrompt: string,
  history: Turn[],
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY!,
      },
      signal: AbortSignal.timeout(GEMINI_ATTEMPT_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [
          ...history.map((h) => ({
            role: h.role === 'bot' ? 'model' : 'user',
            parts: [{ text: h.text }],
          })),
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
      }),
    },
  );

  if (res.status === 429) {
    // 무료 등급 분당·일일 한도. 재시도 루프가 잠시 쉬었다 다시 부른다.
    throw new RateLimitError();
  }
  if (!res.ok) {
    console.error(
      `Gemini 호출 실패 (${model}, HTTP ${res.status}):`,
      (await res.text()).slice(0, 300),
    );
    throw new GeminiHttpError(res.status);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new GeminiHttpError(204); // 빈 답(안전 필터 등)도 다시 시도할 가치가 있다
  return text;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof RateLimitError) return true;
  if (err instanceof GeminiHttpError) return RETRYABLE_STATUS.has(err.status) || err.status === 204;
  if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError'))
    return true;
  return err instanceof TypeError; // fetch 네트워크 오류
}

async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  history: Turn[] = [],
): Promise<string> {
  const started = Date.now();
  let lastErr: unknown = null;
  let attempts = 0;
  let rateLimited = 0;
  // 이름이 틀린(404) 모델은 그 자리에서 제외한다. 전부 없어지면 ListModels 로 스스로 다시 채운다.
  let models = await candidateModels();
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS && models.length > 0; attempt++) {
    const model = models[(attempt - 1) % models.length]!;
    attempts = attempt;
    try {
      const text = await callGeminiOnce(model, systemInstruction, userPrompt, history);
      if (attempt > 1) console.warn(`ai-guide: ${attempt}번째 시도(${model})에서 성공`);
      return text;
    } catch (err) {
      lastErr = err;
      if (err instanceof GeminiHttpError && err.status === 404) {
        console.warn(`ai-guide: 모델 없음 — ${model} 제외`);
        models = models.filter((m) => m !== model);
        if (models.length === 0) models = await discoverModels(true); // 목록이 낡았다 — 살아 있는 모델을 직접 찾는다
        continue;
      }
      if (!isRetryable(err)) throw err;
      // 429 는 "한도 소진"이라 계속 두드리면 한도만 더 깎는다 (2026-09-19 실측: 20회 재시도가 100초를 끌고도 실패).
      // 한도는 3번만 더 보고 정보 카드로 넘어간다. 20~30회 규칙은 과부하(503)·일시 오류에 적용한다.
      if (err instanceof RateLimitError) {
        rateLimited++;
        if (rateLimited >= RATE_LIMIT_MAX_RETRIES) break;
        await sleep(5_000);
        continue;
      }
      // 20회를 채운 뒤에는 시간이 남을 때만 30회까지 더 간다
      if (attempt >= GEMINI_MIN_ATTEMPTS && Date.now() - started > GEMINI_EXTRA_BUDGET_MS) break;
      await sleep(1_000); // 짧게 자주 — 과부하는 몇 초 안에 풀리는 일이 많다
    }
  }
  console.warn(
    `ai-guide: ${attempts}회 시도 뒤 포기 (${Math.round((Date.now() - started) / 1000)}초) — 정보 카드로`,
  );
  throw lastErr ?? new GeminiHttpError(503);
}

/**
 * 질문과 관련된 성지 레코드를 뽑아 프롬프트 컨텍스트로 만든다(간이 RAG).
 * 성지 수가 200곳 내외라 이름·주소 부분 일치 검색으로 충분하며,
 * 콘텐츠가 늘어나면 pgvector 임베딩 검색으로 교체한다.
 */
type DirRow = {
  name: string;
  category: string | null;
  diocese: string | null;
  address: string | null;
  phone: string | null;
};
type SiteRow = {
  name: string;
  category: string | null;
  diocese: string | null;
  location: string | null;
  description: string | null;
  history: string | null;
  nearby_attractions: string | null;
  nearby_lodging: string | null;
  phone: string | null;
  homepage_url: string | null;
  name_compact: string | null;
};
interface SiteContext {
  text: string;
  /** 질문에 이름이 직접 맞은 성지 — 폴백 카드는 이것만 보여준다. 없으면 검색 1순위 하나 */
  primary: SiteRow[];
  sites: SiteRow[];
  dirs: DirRow[];
  /** 이름(또는 직전 대화에 나온 이름)으로 맞은 성지 수 */
  nameHits: number;
}

const SITE_SELECT =
  'name, category, diocese, location, description, history, nearby_attractions, nearby_lodging, phone, homepage_url, name_compact';

/**
 * 성지 213곳 전체를 함수 인스턴스 메모리에 10분 들고 있는다. 예전에는 질문마다 DB 를 세 번 뒤졌고,
 * 「소개·역사에 언급된 곳」은 흔한 단어(「주교」)에 걸린 앞 40곳만 받아 정작 물은 인물(다블뤼)이 밀렸다
 * (2026-10-29 실측). 전체를 갖고 있으면 희귀한 단어에 가중치를 줘 정확히 고를 수 있다.
 */
let siteCache: { at: number; rows: SiteRow[] } | null = null;
async function allSites(supabase: ReturnType<typeof createClient>): Promise<SiteRow[]> {
  if (siteCache && Date.now() - siteCache.at < 10 * 60_000) return siteCache.rows;
  const { data, error } = await supabase.from('holy_sites').select(SITE_SELECT).limit(1000);
  if (error || !data) {
    console.error('ai-guide: holy_sites 전체 조회 실패', error?.message);
    return siteCache?.rows ?? [];
  }
  siteCache = { at: Date.now(), rows: data as unknown as SiteRow[] };
  return siteCache.rows;
}

/** 외국어 도시 이름(악센트 뺀 소문자) → 한국어. 주소가 한국어라 이 표가 없으면 「Seúl」로는 아무것도 못 찾는다. */
const CITY_KO: Record<string, string> = {
  seoul: '서울',
  seul: '서울',
  jeju: '제주',
  cheju: '제주',
  busan: '부산',
  pusan: '부산',
  daegu: '대구',
  taegu: '대구',
  incheon: '인천',
  inchon: '인천',
  gwangju: '광주',
  daejeon: '대전',
  taejon: '대전',
  ulsan: '울산',
  suwon: '수원',
  jeonju: '전주',
  chonju: '전주',
  cheongju: '청주',
  chuncheon: '춘천',
  wonju: '원주',
  gangneung: '강릉',
  andong: '안동',
  gyeongju: '경주',
  pohang: '포항',
  mokpo: '목포',
  changwon: '창원',
  asan: '아산',
  dangjin: '당진',
  seosan: '서산',
  gongju: '공주',
  cheonan: '천안',
  gyeonggi: '경기',
  chungcheong: '충청',
  jeolla: '전라',
  gyeongsang: '경상',
  gangwon: '강원',
};

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** 성지 이름에서 「순교성지」「성당」 같은 꼬리를 뗀 짧은 이름 — 답변 속 언급을 찾을 때 쓴다 */
function shortSiteName(name: string): string {
  const c = name.replace(/\s+/g, '');
  for (const s of ['순교성지', '순교지', '성지성당', '성지', '성당', '본당', '공소']) {
    if (c.length - s.length >= 2 && c.endsWith(s)) return c.slice(0, -s.length);
  }
  return c;
}

/** 이름이 질문·대화에 직접 나오지 않을 때 보여 줄 대표 성지 — 「성지 추천」「처음인데」 같은 열린 질문용 */
const FEATURED = [
  '절두산순교성지',
  '명동대성당',
  '솔뫼성지',
  '해미순교성지',
  '배론성지',
  '전동성당',
  '새남터순교성지',
  '치명자산성지',
];
const OPEN_QUESTION =
  /추천|어디|처음|코스|일정|가볼|갈만|갈 만|아이|가족|부모|여행|순례|둘러|recommend|suggest|first|where|which|visit|best|trip|pilgrim|itinerar|famil|kids|child|santuario|sanctuaire|santuário|visitar|visiter|visitare|recomend|conseill|consigli|dónde|donde|où|dove|onde/i;

async function buildSiteContext(question: string, recentText = ''): Promise<SiteContext> {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

  // 질문에서 2글자 이상 토큰만 뽑는다. 「대산성당에」처럼 조사가 붙은 채로 오므로 흔한 조사를 떼고,
  // 「대산성당」→「대산」처럼 성당/성지 같은 꼬리도 뗀 후보를 함께 만든다 (2026-09-13 사장님 실기기 보고).
  const PARTICLES = [
    '부터',
    '까지',
    '인데',
    '한테',
    '처럼',
    '보다',
    '에서는',
    '에서',
    '에는',
    '에게',
    '으로',
    '이랑',
    '인가요',
    '이에요',
    '은',
    '는',
    '이',
    '가',
    '을',
    '를',
    '의',
    '님',
    '도',
    '로',
    '과',
    '와',
    '에',
    '요',
  ];
  const SUFFIXES = ['순교성지', '순교지', '성지', '성당', '공소', '본당', '교회', '기념관', '묘'];
  const stripParticle = (t: string) => {
    for (const p of PARTICLES)
      if (t.length - p.length >= 2 && t.endsWith(p)) return t.slice(0, -p.length);
    return t;
  };
  // 외국어 질문의 흔한 단어(shrine·dónde·où …) — 고유명사가 아니라 검색어에서 뺀다 (2026-10-14)
  const LATIN_STOP = new Set([
    'shrine',
    'shrines',
    'cathedral',
    'church',
    'churches',
    'holy',
    'site',
    'sites',
    'martyr',
    'martyrs',
    'catholic',
    'korea',
    'korean',
    'where',
    'what',
    'when',
    'how',
    'which',
    'who',
    'the',
    'and',
    'for',
    'from',
    'with',
    'there',
    'here',
    'this',
    'that',
    'get',
    'can',
    'you',
    'about',
    'tell',
    'near',
    'visit',
    'mass',
    'time',
    'times',
    'santuario',
    'iglesia',
    'catedral',
    'sanctuaire',
    'eglise',
    'église',
    'chiesa',
    'igreja',
    'santuário',
    'donde',
    'dónde',
    'como',
    'cómo',
    'où',
    'comment',
    'dove',
    'come',
    'onde',
    'quando',
    'quand',
    'est',
    'sono',
    'está',
    'esta',
    'este',
    'essa',
    'esse',
    'aqui',
    'allí',
    'ahí',
    'sobre',
    'para',
    'puis',
    'faire',
    'aller',
    'andare',
    'llegar',
    'chegar',
    'arriver',
    'arrivare',
    'visitar',
    'visiter',
    'visitare',
  ]);
  const rawTokens = question
    .split(/[\s,.!?·]+/)
    // L-04: PostgREST or() 문법을 흔드는 문자(쉼표·괄호·% 등)를 버린다. 글자·숫자만 남긴다.
    .map((t) => stripParticle(t.trim().replace(/[^\p{L}\p{N}]/gu, '')))
    .filter((t) => t.length >= 2)
    .filter(
      (t) =>
        !/^[\p{Script=Latin}]+$/u.test(t) || (t.length >= 4 && !LATIN_STOP.has(t.toLowerCase())),
    )
    // 「Où se trouve le sanctuaire de Jeoldusan」— 앞 5개만 자르면 고유명사가 밀린다 (2026-10-14 실측) → 8개
    .slice(0, 8);
  const compactTokens = new Set<string>();
  for (const t of rawTokens) {
    const c = t.replace(/\s+/g, '');
    compactTokens.add(c);
    for (const s of SUFFIXES)
      if (c.length - s.length >= 2 && c.endsWith(s)) compactTokens.add(c.slice(0, -s.length));
  }
  // 흔한 말은 검색어에서 뺀다. 「성지」「어디」「미사」 같은 단어가 208곳 전부에 걸려
  // 물어본 성지 대신 아무 5곳이 컨텍스트에 들어갔다 (2026-09-17 실측: 10문 중 6문 "모른다").
  const STOP = new Set([
    '성지',
    '성당',
    '순교성지',
    '순교지',
    '본당',
    '공소',
    '교회',
    '천주교',
    '가톨릭',
    '순례',
    '어디',
    '어디예',
    '어디에',
    '위치',
    '있어',
    '있는',
    '있나',
    '있을까',
    '가는',
    '가요',
    '갈까',
    '갈만한',
    '근처',
    '주변',
    '가까운',
    '미사',
    '시간',
    '알려',
    '알려줘',
    '알려주세',
    '주세',
    '추천',
    '추천해',
    '설명',
    '설명해',
    '간단히',
    '무슨',
    '어떤',
    '어떻게',
    '언제',
    '얼마',
    '얼마예',
    '전화',
    '전화번호',
    '연락처',
    '주소',
    '역사',
    '소개',
    '정보',
    '곳이에',
    '곳',
    '입장료',
    '사람',
    '명이에',
    '신부님',
    '신부',
    '성인',
    '순교자',
    '순교',
    '박해',
    '때',
    '것',
    '거',
    '좀',
    '저',
    '제가',
    '우리',
    '오늘',
    '내일',
    '주말',
    // 2026-10-29: 질문 말투가 검색어로 새어 들어가 엉뚱한 성지가 잡혔다 (「누구야」「가장」…)
    '누구',
    '누구야',
    '누구예',
    '뭐야',
    '뭐예',
    '무엇',
    '이야기',
    '이야기해',
    '해줘',
    '해주세',
    '궁금',
    '궁금해',
    '가장',
    '유명한',
    '유명',
    '대표',
    '대표적',
    '방법',
    '코스',
    '일정',
    '하루',
    '당일',
    '당일치기',
    '처음',
    '아이',
    '가족',
    '어때',
    '어떤곳',
    '어디야',
    '어디예요',
    '오래된',
    '가능',
    '있어요',
    '주세요',
    '알려주세요',
    '성지순례',
    '안녕',
    '안녕하세',
    '안녕하세요',
    '감사',
    '감사합니다',
    '고마워',
    '고맙습니다',
    '순례지',
    '순례길',
    '다녀가신',
    '다녀간',
    '다녀온',
    '방문한',
    '방문하신',
    '가야',
    '좋을까',
    '좋은',
    '괜찮은',
    '볼만한',
    '가볼만한',
  ]);
  // 외국어 도시 이름 → 한국어 (Seúl → 서울). 주소가 한국어라 이 변환이 없으면 외국어 질문은 지역 검색이 비게 된다.
  for (const w of question.match(/[\p{L}]+/gu) ?? []) {
    const ko = CITY_KO[stripAccents(w).toLowerCase()];
    if (ko) compactTokens.add(ko);
  }
  const tokens = [...compactTokens].filter((t) => !STOP.has(t));
  const empty: SiteContext = { text: '', primary: [], sites: [], dirs: [], nameHits: 0 };
  const all = await allSites(supabase);
  // 직전 대화에 나온 성지 — 「거기 어떻게 가요?」「미사 시간은?」처럼 이름 없는 되물음을 이어 준다 (2026-10-29).
  // 최근에 나온 것부터, 최대 2곳. 이름이 짧은 것(2글자 이하)은 우연히 걸리기 쉬워 뺀다.
  const recentCompact = recentText.replace(/\s+/g, '');
  const mentioned: SiteRow[] = [];
  if (recentCompact) {
    // 전체 이름(해미순교성지)이 나왔으면 그대로, 꼬리 뗀 이름(해미)은 3글자 이상일 때만 — 2글자는 우연히 걸리기 쉽다
    const scored = all
      .map((s) => {
        const full = s.name.replace(/\s+/g, '');
        const short = shortSiteName(s.name);
        return {
          s,
          at: Math.max(
            recentCompact.lastIndexOf(full),
            short.length >= 3 ? recentCompact.lastIndexOf(short) : -1,
          ),
        };
      })
      .filter((x) => x.at >= 0)
      .sort((a, b) => b.at - a.at);
    for (const x of scored) if (mentioned.length < 2) mentioned.push(x.s);
  }
  if (tokens.length === 0 && mentioned.length === 0) {
    return await withFeatured(question, all, empty);
  }

  const picked: SiteRow[] = [];
  const seen = new Set<string>();
  const take = (rows: SiteRow[] | null | undefined) => {
    for (const r of rows ?? []) {
      if (picked.length >= 5 || seen.has(r.name)) continue;
      seen.add(r.name);
      picked.push(r);
    }
  };
  const lower = tokens.map((t) => t.toLowerCase());
  const compactName = (s: SiteRow) => (s.name_compact ?? s.name.replace(/\s+/g, '')).toLowerCase();

  // ① 이름이 맞는 곳부터 (name_compact: 공백 제거 열, 띄어쓰기 무관).
  //    성지 12곳 넘게 이름에 들어 있는 말(「주교」「대전」)은 고유명사가 아니라 뺀다 —
  //    「다블뤼 주교는 누구야」가 「주교좌성당」 5곳을 이름 일치로 잡았다 (2026-10-29 실측).
  const nameTokens = lower.filter(
    (t) => all.filter((s) => compactName(s).includes(t)).length <= 12,
  );
  take(
    all
      .map((s) => ({
        s,
        hit: nameTokens.filter((t) => compactName(s).includes(t)).reduce((n, t) => n + t.length, 0),
      }))
      .filter((x) => x.hit > 0)
      .sort((a, b) => b.hit - a.hit)
      .map((x) => x.s),
  );
  // ①-b 외국어 이름으로 물은 경우 (Haemi Shrine, Myeongdong Cathedral …) — 번역 표의 이름으로도 찾는다.
  //     2026-10-14 실측: 영어로 물으면 한국어 이름만 뒤져 "모른다"고 답했다. shrine/church 같은
  //     흔한 영어 단어는 거의 모든 번역 이름에 들어가므로 뺀다.
  if (picked.length < 5) {
    const latin = tokens
      .filter(
        (t) =>
          /^[\p{Script=Latin}\p{N}]+$/u.test(t) &&
          t.length >= 4 &&
          !LATIN_STOP.has(t.toLowerCase()),
      )
      .sort((a, b) => b.length - a.length); // 긴 토큰(고유명사)부터 — 'está' 같은 짧은 말이 먼저 걸리지 않게
    for (const t of latin) {
      if (picked.length >= 5) break;
      const { data: tr } = await supabase
        .from('holy_site_translations')
        .select('site_id')
        .ilike('name', `%${t}%`)
        .limit(30);
      const ids = new Set((tr ?? []).map((r: { site_id: string }) => r.site_id));
      // 20곳 넘게 걸리는 말은 고유명사가 아니다(estación·santuario 류) — 버린다
      if (ids.size === 0 || ids.size > 20) continue;
      const { data: rows } = await supabase
        .from('holy_sites')
        .select(SITE_SELECT)
        .in('id', [...ids].slice(0, 5));
      take(rows as unknown as SiteRow[]);
    }
  }
  // ①-c 이름 앞 두세 글자만 맞는 경우 — 「해미읍성」→「해미순교성지」. 읍성·성당 같은 꼬리가 붙은 말을 위해.
  if (picked.length === 0) {
    for (const t of tokens.filter((x) => /^[가-힣]{4,}$/.test(x))) {
      for (const n of [3, 2]) {
        const head = t.slice(0, n);
        const hits = all.filter((s) => compactName(s).includes(head));
        if (hits.length > 0 && hits.length <= 6) {
          take(hits);
          break;
        }
      }
    }
  }
  let nameHits = picked.length; // 여기까지가 이름으로 맞은 곳
  // 이름이 하나도 안 맞았고 직전 대화에 성지가 나왔다면 그 성지를 앞세운다
  if (nameHits === 0 && mentioned.length > 0) {
    take(mentioned);
    nameHits = picked.length;
  }
  // ② 그다음 주소에 지역명이 있는 곳 (천안 · 서울 …)
  if (picked.length < 5)
    take(all.filter((s) => lower.some((t) => (s.location ?? '').toLowerCase().includes(t))));
  // ③ 마지막으로 소개·역사·주변 명소에 언급된 곳 (김대건 → 솔뫼, 다블뤼 → 신리 …)
  //    흔한 단어가 점수를 휩쓸지 않도록 드문 단어일수록 무겁게 센다(문서 빈도의 역수) — 「주교」는 가볍고
  //    「다블뤼」는 무겁다. 질문 단어를 여러 개 맞춘 곳일수록 위로.
  if (picked.length < 5 && lower.length > 0) {
    const texts = all.map((s) =>
      `${s.name} ${s.description ?? ''} ${s.history ?? ''} ${s.nearby_attractions ?? ''}`.toLowerCase(),
    );
    const weight = lower.map((t) => {
      const df = texts.filter((x) => x.includes(t)).length;
      return df === 0 ? 0 : Math.log(1 + all.length / df);
    });
    const scored = all
      .map((s, i) => {
        let score = 0;
        lower.forEach((t, k) => {
          const n = texts[i]!.split(t).length - 1;
          if (n > 0) score += weight[k]! * (1 + Math.min(n, 4) * 0.25);
        });
        return { s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    take(scored.map((x) => x.s));
  }

  const siteLines = picked.map(
    (s) =>
      `- ${s.name} (${s.category ?? '성지'}, ${s.diocese ?? ''}교구)\n` +
      `  주소: ${s.location ?? '정보 없음'}\n` +
      `  소개: ${s.description ?? '정보 없음'}\n` +
      `  역사: ${s.history ?? '정보 없음'}` +
      (s.nearby_attractions ? `\n  주변 명소: ${s.nearby_attractions}` : '') +
      (s.nearby_lodging ? `\n  주변 숙박: ${s.nearby_lodging}` : '') +
      (s.phone || s.homepage_url
        ? `\n  문의: ${[s.phone ? `전화 ${s.phone}` : null, s.homepage_url ? `홈페이지 ${s.homepage_url}` : null].filter(Boolean).join(' · ')}`
        : '') +
      `\n  (미사 시간 정보는 이 자료에 없음 — 위 문의처를 안내할 것)`,
  );

  // 성지 목록에 없는 본당·공소는 주소록(5,918건)에서 이름·주소·연락처만 준다 — 미사 시간은 답하지 않게
  let dirs: DirRow[] = [];
  if (tokens.length > 0) {
    const dirFilter = tokens.map((t) => `name_compact.ilike.%${t}%`).join(',');
    const { data: dir } = await supabase
      .from('directory_public') // H-02: 원본 표는 anon 이 못 읽는다 — 공개 뷰만
      .select('name, category, diocese, address, phone')
      .or(dirFilter)
      .limit(5);
    dirs = (dir ?? []) as DirRow[];
  }
  const dirLines = dirs.map(
    (d) =>
      `- ${d.name} (${d.category ?? '본당'}, ${d.diocese ?? ''}) — 주소: ${d.address ?? '정보 없음'}, 전화: ${d.phone ?? '정보 없음'} [주소록 정보만 있음]`,
  );

  const text =
    siteLines.length === 0 && dirLines.length === 0
      ? ''
      : [
          ...siteLines,
          ...(dirLines.length
            ? ['', '[본당·공소 주소록 — 이름·주소·전화만 있음]', ...dirLines]
            : []),
        ].join('\n\n');
  // 사용자가 여러 성지를 물은 게 아니면 하나만 앞세운다 (2026-09-19 사장님) — 이름이 맞은 곳들, 없으면 1순위 하나
  const primary = nameHits > 0 ? picked.slice(0, nameHits) : picked.slice(0, 1);
  const ctx: SiteContext = { text, primary, sites: picked, dirs, nameHits };
  return picked.length === 0 && dirs.length === 0 ? await withFeatured(question, all, ctx) : ctx;
}

/**
 * 질문과 직접 맞는 성지를 못 찾은 열린 질문(「성지 추천」「처음인데」「아이랑」)에는 대표 성지 몇 곳을 컨텍스트로 준다.
 * 예전에는 컨텍스트가 비어 "모른다/어디가 궁금하세요?"로만 끝났다 (2026-10-29 사장님 보고).
 * 대표 성지도 우리 DB 의 레코드라, 「DB 밖 지식 금지」 규칙은 그대로 지켜진다.
 */
async function withFeatured(
  question: string,
  all: SiteRow[],
  ctx: SiteContext,
): Promise<SiteContext> {
  if (!OPEN_QUESTION.test(question)) return ctx;
  const rows = FEATURED.map((f) =>
    all.find((s) => (s.name_compact ?? '').toLowerCase() === f),
  ).filter((s): s is SiteRow => Boolean(s));
  if (rows.length === 0) return ctx;
  const lines = rows.map(
    (s) =>
      `- ${s.name} (${s.category ?? '성지'}, ${s.diocese ?? ''}교구)\n` +
      `  주소: ${s.location ?? '정보 없음'}\n` +
      `  소개: ${s.description ?? '정보 없음'}` +
      (s.nearby_attractions ? `\n  주변 명소: ${s.nearby_attractions}` : '') +
      (s.phone || s.homepage_url
        ? `\n  문의: ${[s.phone ? `전화 ${s.phone}` : null, s.homepage_url ? `홈페이지 ${s.homepage_url}` : null].filter(Boolean).join(' · ')}`
        : ''),
  );
  return {
    text: [
      '[질문과 딱 맞는 성지를 찾지 못해 대표 성지를 보여줍니다. 이 중에서 질문에 어울리는 곳을 골라 소개하고, 더 좁히려면 지역·동행·시간 중 한 가지만 되물으세요.]',
      ...lines,
    ].join('\n\n'),
    primary: rows.slice(0, 1),
    sites: rows,
    dirs: [],
    nameHits: 0,
  };
}

/** 소개글 첫 두 문장. 폴백 카드는 DB 글자를 그대로 쓴다 — 지어내는 것이 없다. */
function firstSentences(s: string | null, n = 2): string {
  if (!s) return '';
  return s
    .split(/(?<=[.!?。])\s+/)
    .slice(0, n)
    .join(' ')
    .trim();
}

/**
 * Gemini 가 못 답할 때(한도 · 장애) 검색 결과를 정해진 틀로 보여준다 — 스펙 5절 B.
 * 말투 없음, 표 없음. 심사 시연 중 "AI 가 죽었다"는 화면이 뜨지 않게 하는 보험이다.
 */
function fallbackCard(ctx: SiteContext): string | null {
  if (ctx.sites.length === 0 && ctx.dirs.length === 0) return null;
  const lines: string[] = ['미카엘이 잠시 쉬는 중이라, 찾은 정보를 그대로 보여드릴게요.', ''];
  for (const s of ctx.primary) {
    lines.push(`**${s.name}** (${s.category ?? '성지'} · ${s.diocese ?? ''}교구)`);
    if (s.location) lines.push(s.location);
    const intro = firstSentences(s.description);
    if (intro) lines.push(intro);
    lines.push('');
  }
  for (const d of ctx.dirs) {
    lines.push(`**${d.name}** (${d.category ?? '본당'} · ${d.diocese ?? ''})`);
    if (d.address) lines.push(d.address);
    if (d.phone) lines.push(`전화 ${d.phone}`);
    lines.push('');
  }
  lines.push('자세한 내용은 성지 상세 화면에서 보실 수 있어요.');
  return lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsFor(req) });
  }

  // Claude 가 1순위인 지금은 Gemini 키가 없어도 돌아간다 — 둘 다 없을 때만 막는다
  if (!GEMINI_API_KEY && !ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI 키 미설정' }), {
      status: 500,
      headers: { ...corsFor(req), 'content-type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const question: string = String(payload.question ?? '').slice(0, MAX_QUESTION_LEN);

    // 선택 프로필 — 사용자가 설정에서 직접 알려준 경우에만 넘어온다.
    // 추측으로 채워 보내면 안 된다(시스템 프롬프트의 [상대에 맞추기] 참고).
    const audience: { ageGroup?: string; faith?: '신자' | '비신자' } = payload.audience ?? {};
    const audienceLine = [
      audience.ageGroup ? `연령대: ${audience.ageGroup}` : null,
      audience.faith ? `신앙: ${audience.faith}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    // 직전 대화 — 클라이언트가 들고 있는 것을 그대로 보낸다. 서버는 저장하지 않는다.
    const history: Turn[] = Array.isArray(payload.history)
      ? (payload.history as Turn[])
          .filter((h) => (h?.role === 'user' || h?.role === 'bot') && typeof h.text === 'string')
          .slice(-MAX_HISTORY_TURNS)
          .map((h) => ({ role: h.role, text: String(h.text).slice(0, MAX_QUESTION_LEN) }))
      : [];

    // 한/영 전환을 잊고 친 한글(「audehdtjdekd」=명동성당)을 되돌려 검색한다 (2026-10-14 사장님)
    // 영어·스페인어 등 진짜 외국어 문장은 건드리지 않는다 — 「Which」가 「퍄냣」으로 바뀌어 답 첫머리에 붙던 오작동 (2026-10-29)
    const fixedQuestion = looksLikeForeignSentence(question)
      ? question
      : fixKoreanTypedInEnglish(question);
    // 바뀐 단어만 뽑는다 — 문장 전체를 되풀이하면 「절두산 어떻게 가요를 찾으신…」처럼 어색하다
    const fixedWords = (
      looksLikeForeignSentence(question) ? [] : (question.match(/[A-Za-z]+/g) ?? [])
    )
      .map((w) => fixKoreanTypedInEnglish(w))
      .filter((w) => /^[가-힣]+$/.test(w));
    const typoNote =
      fixedWords.length > 0
        ? `[입력 보정] 사용자가 한/영 전환을 잊고 영문 자판으로 친 것으로 보여 「${question}」을 「${fixedQuestion}」로 읽었다. 답 첫머리에 "혹시 「${fixedWords.join(' ')}」을(를) 찾으셨나요?" 하고 짧게 확인한 뒤 바로 답한다.`
        : null;
    // 직전 대화(사용자 질문·미카엘 답)에 나온 성지 이름 — 「거기 미사 시간은?」 같은 후속 질문을 잇는다
    const recentText = history
      .slice(-4)
      .map((h) => h.text)
      .join(' ');
    const ctx = await buildSiteContext(fixedQuestion, recentText);
    const contextBlock = ctx.text || '(관련된 성지 정보를 찾지 못했습니다)';
    const primarySources = ctx.primary.map((s) => s.name);
    // 「참고한 성지」는 답에 실제로 나온 성지만 — 검색 1순위와 답이 어긋나던 문제 (김대건 탄생지 → 용수성지로 표시, 2026-10-29)
    const sourcesFor = (answer: string) => {
      const named = ctx.sites
        .filter((s) => answer.includes(s.name) || answer.includes(shortSiteName(s.name)))
        .map((s) => s.name)
        .slice(0, 3);
      return named.length > 0 ? named : primarySources;
    };
    const sources = primarySources;
    const prompt = [
      audienceLine ? `[사용자가 직접 알려준 프로필]\n${audienceLine}` : null,
      typoNote,
      `[성지 정보]\n${contextBlock}`,
      `[질문]\n${question}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    // 답변자 순서: AI_PRIMARY 가 먼저, 다른 쪽이 예비. 요청의 provider 로 검증용 강제 지정도 된다.
    const wantClaudeFirst =
      (payload.provider === 'claude' || AI_PRIMARY === 'claude') && Boolean(ANTHROPIC_API_KEY);
    const order: ('gemini' | 'claude')[] = wantClaudeFirst
      ? ['claude', 'gemini']
      : ['gemini', 'claude'];
    const json = (body: Record<string, unknown>) =>
      new Response(JSON.stringify(body), {
        headers: { ...corsFor(req), 'content-type': 'application/json' },
      });
    let firstErr: unknown = null;
    let firstReason = '';
    for (const provider of order) {
      if (provider === 'claude' && !ANTHROPIC_API_KEY) continue;
      if (provider === 'gemini' && !GEMINI_API_KEY) continue;
      try {
        const text =
          provider === 'claude'
            ? await callClaude(MICHAEL_SYSTEM_INSTRUCTION, prompt, history)
            : await callGemini(MICHAEL_SYSTEM_INSTRUCTION, prompt, history);
        if (firstErr)
          console.warn(`ai-guide: ${order[0]} 실패(${firstReason}) → ${provider} 가 답함`);
        return json(
          firstErr
            ? {
                text,
                sources: sourcesFor(text),
                provider,
                fallbackFrom: order[0],
                reason: firstReason,
              }
            : { text, sources: sourcesFor(text), provider },
        );
      } catch (err) {
        const reason =
          err instanceof RateLimitError
            ? 'rate_limited'
            : err instanceof GeminiHttpError
              ? `gemini_${err.status}`
              : err instanceof ClaudeHttpError
                ? `claude_${err.status}`
                : err instanceof Error && err.name === 'TimeoutError'
                  ? `${provider}_timeout`
                  : `${provider}_error`;
        if (!firstErr) {
          firstErr = err;
          firstReason = reason;
        }
        console.error(`ai-guide: ${provider} 실패 (${reason})`);
      }
    }
    {
      const err = firstErr;
      const reason = firstReason;
      // 2) 둘 다 못 답해도 검색 결과가 있으면 정보 카드로 답한다 (200). 없을 때만 오류로.
      const card = fallbackCard(ctx);
      if (card) {
        console.warn('ai-guide fallback:', reason);
        return new Response(JSON.stringify({ text: card, sources, fallback: true, reason }), {
          headers: { ...corsFor(req), 'content-type': 'application/json' },
        });
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error:
            '지금 질문이 많아 미카엘 천사가 잠시 숨을 고르고 있어요. 1분 뒤에 다시 물어봐 주세요.',
        }),
        { status: 429, headers: { ...corsFor(req), 'content-type': 'application/json' } },
      );
    }
    // L-03: 상세(업스트림 응답·모델명·프로젝트 식별자)는 서버 로그로만. 사용자에겐 안내문만.
    console.error('ai-guide error:', err);
    return new Response(
      JSON.stringify({ error: '미카엘 천사가 잠시 자리를 비웠어요. 잠시 후 다시 시도해 주세요.' }),
      { status: 500, headers: { ...corsFor(req), 'content-type': 'application/json' } },
    );
  }
});
