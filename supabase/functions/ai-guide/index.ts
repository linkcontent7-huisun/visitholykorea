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
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.6-flash';

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
- 성당 미사 시간, 개방 여부 등 사실 정보는 정확하게 안내합니다.

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
- 날짜, 인물, 사건은 특히 추측하지 마세요.
- 추측에 기반한 단정적 표현("~일 것입니다", "확실합니다")을 쓰지 마세요.

[되묻기]
- 질문이 모호하거나 정보가 부족하면 바로 답하지 말고, 필요한 것(지역, 출발지, 인원, 일정 등)을 최대 3개까지 짧게 먼저 되물으세요.

[금지 사항]
- 특정 신앙 강요, 사이비·이단 관련 정보, 강압적 언어("절대 안 돼요") 금지.`;

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
const GEMINI_ATTEMPT_TIMEOUT_MS = 12_000;
/**
 * 재시도 규칙 (2026-09-19 사장님: "무료 키라 최소 20번은 다시 시도").
 * 503(과부하)·429(분당 한도)·시간 초과·네트워크 오류면 짧게 쉬었다 다시 부른다.
 * 횟수는 20번까지, 그러나 **전체 대기는 GEMINI_TOTAL_BUDGET_MS 를 넘기지 않는다** — 사용자를 1분 넘게
 * 세워 둘 수는 없다. 503 은 1초 안에 오므로 20번을 다 써도 예산 안에 든다. 두 번째 시도부터는
 * 보조 모델(GEMINI_FALLBACK_MODEL)과 번갈아 부른다 — 한 모델이 막혀도 다른 모델은 비어 있을 때가 많다.
 */
const GEMINI_MAX_ATTEMPTS = 20;
const GEMINI_TOTAL_BUDGET_MS = 40_000;
const GEMINI_FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-3.6-flash-lite';
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      max_tokens: 800,
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
  // 이름이 틀린(404) 모델은 그 자리에서 제외한다 — 보조 모델 이름이 바뀌어도 주 모델로 계속 간다
  const models = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL].filter((m, i, a) => m && a.indexOf(m) === i);
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS && models.length > 0; attempt++) {
    const model = models[(attempt - 1) % models.length]!;
    try {
      const text = await callGeminiOnce(model, systemInstruction, userPrompt, history);
      if (attempt > 1) console.warn(`ai-guide: ${attempt}번째 시도(${model})에서 성공`);
      return text;
    } catch (err) {
      lastErr = err;
      if (err instanceof GeminiHttpError && err.status === 404) {
        console.warn(`ai-guide: 모델 없음 — ${model} 제외`);
        models.splice(models.indexOf(model), 1);
        continue;
      }
      if (!isRetryable(err)) throw err;
      // 429 는 분당 한도라 좀 더 쉰다. 그 밖은 0.5초부터 배로 늘려 최대 4초.
      const backoff =
        err instanceof RateLimitError
          ? 5_000
          : Math.min(500 * 2 ** Math.min(attempt - 1, 3), 4_000);
      const elapsed = Date.now() - started;
      if (elapsed + backoff > GEMINI_TOTAL_BUDGET_MS) {
        console.warn(`ai-guide: ${attempt}번 시도 뒤 시간 예산 초과 — 정보 카드로`);
        break;
      }
      await sleep(backoff);
    }
  }
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
interface SiteContext {
  text: string;
  /** 질문에 이름이 직접 맞은 성지 — 「참고한 성지」와 폴백 카드는 이것만 보여준다. 없으면 검색 1순위 하나 */
  primary: SiteContext['sites'];
  sites: {
    name: string;
    category: string | null;
    diocese: string | null;
    location: string | null;
    description: string | null;
  }[];
  dirs: DirRow[];
}

async function buildSiteContext(question: string): Promise<SiteContext> {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

  // 질문에서 2글자 이상 토큰만 뽑는다. 「대산성당에」처럼 조사가 붙은 채로 오므로 흔한 조사를 떼고,
  // 「대산성당」→「대산」처럼 성당/성지 같은 꼬리도 뗀 후보를 함께 만든다 (2026-09-13 사장님 실기기 보고).
  const PARTICLES = [
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
  const rawTokens = question
    .split(/[\s,.!?·]+/)
    // L-04: PostgREST or() 문법을 흔드는 문자(쉼표·괄호·% 등)를 버린다. 글자·숫자만 남긴다.
    .map((t) => stripParticle(t.trim().replace(/[^\p{L}\p{N}]/gu, '')))
    .filter((t) => t.length >= 2)
    .slice(0, 5);
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
  ]);
  const tokens = [...compactTokens].filter((t) => !STOP.has(t));
  if (tokens.length === 0) return { text: '', primary: [], sites: [], dirs: [] };

  type Row = {
    name: string;
    category: string | null;
    diocese: string | null;
    location: string | null;
    description: string | null;
    history: string | null;
  };
  const picked: Row[] = [];
  const seen = new Set<string>();
  const take = (rows: Row[] | null | undefined) => {
    for (const r of rows ?? []) {
      if (picked.length >= 5 || seen.has(r.name)) continue;
      seen.add(r.name);
      picked.push(r);
    }
  };
  const SELECT = 'name, category, diocese, location, description, history';
  // ① 이름이 맞는 곳부터 (name_compact: 공백 제거 열, 띄어쓰기 무관)
  take(
    (
      await supabase
        .from('holy_sites')
        .select(SELECT)
        .or(tokens.map((t) => `name_compact.ilike.%${t}%`).join(','))
        .limit(5)
    ).data,
  );
  const nameHits = picked.length; // 여기까지가 이름으로 맞은 곳
  // ② 그다음 주소에 지역명이 있는 곳 (천안 · 서울 …)
  if (picked.length < 5)
    take(
      (
        await supabase
          .from('holy_sites')
          .select(SELECT)
          .or(tokens.map((t) => `location.ilike.%${t}%`).join(','))
          .limit(5)
      ).data,
    );
  // ③ 마지막으로 소개·역사에 언급된 곳 (김대건 → 솔뫼 …)
  if (picked.length < 5)
    take(
      (
        await supabase
          .from('holy_sites')
          .select(SELECT)
          .or(tokens.flatMap((t) => [`description.ilike.%${t}%`, `history.ilike.%${t}%`]).join(','))
          .limit(5)
      ).data,
    );

  const siteLines =
    picked.length === 0
      ? []
      : picked.map(
          (s) =>
            `- ${s.name} (${s.category ?? '성지'}, ${s.diocese ?? ''}교구)\n` +
            `  주소: ${s.location ?? '정보 없음'}\n` +
            `  소개: ${s.description ?? '정보 없음'}\n` +
            `  역사: ${s.history ?? '정보 없음'}`,
        );

  // 성지 목록에 없는 본당·공소는 주소록(5,918건)에서 이름·주소·연락처만 준다 — 미사 시간은 답하지 않게
  const dirFilter = tokens.map((t) => `name_compact.ilike.%${t}%`).join(',');
  const { data: dir } = await supabase
    .from('directory_public') // H-02: 원본 표는 anon 이 못 읽는다 — 공개 뷰만
    .select('name, category, diocese, address, phone')
    .or(dirFilter)
    .limit(5);
  const dirs = (dir ?? []) as DirRow[];
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
  return { text, primary, sites: picked, dirs };
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

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY 미설정' }), {
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

    const ctx = await buildSiteContext(question);
    const contextBlock = ctx.text || '(관련된 성지 정보를 찾지 못했습니다)';
    const sources = ctx.primary.map((s) => s.name);
    const prompt = [
      audienceLine ? `[사용자가 직접 알려준 프로필]\n${audienceLine}` : null,
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
      try {
        const text =
          provider === 'claude'
            ? await callClaude(MICHAEL_SYSTEM_INSTRUCTION, prompt, history)
            : await callGemini(MICHAEL_SYSTEM_INSTRUCTION, prompt, history);
        if (firstErr)
          console.warn(`ai-guide: ${order[0]} 실패(${firstReason}) → ${provider} 가 답함`);
        return json(
          firstErr
            ? { text, sources, provider, fallbackFrom: order[0], reason: firstReason }
            : { text, sources, provider },
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
