# 오디오 도슨트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 성지 상세의 단발 TTS 버튼을 챕터형 오디오 가이드 플레이어로 바꾸고, 절두산·명동·약현 3곳의 문헌 기반 초안 원고를 싣는다.

**Architecture:** 원고는 `data/docent/*.json`(기존 템플릿 형식)으로 저장소에 두고 Vite glob 로 빌드 시 읽는다. 순수 함수 `buildChapters` 가 성지 본문(+원고)을 챕터 목록으로 바꾸고, `useDocentPlayer` 훅이 브라우저 TTS 로 챕터를 재생한다. DB·마이그레이션 변경 없음.

**Tech Stack:** React 19 · TypeScript · vitest · window.speechSynthesis · Vite `import.meta.glob`

**Spec:** `docs/superpowers/specs/2026-08-27-audio-docent-design.md`

## Global Constraints

- 의존성 방향 `pages → features → shared` 준수, 역방향 import 금지
- 주석·UI 문구는 한국어, "왜"를 남긴다
- 더미 데이터 금지 — 초안 원고에는 "초안 — 현장 확인 전" 배지 표시
- 근거 없는 서술 금지 — 초안 원고는 DB 원문 + 공식 홈페이지 확인 내용만, 포인트마다 `sourceNote`
- rem 기반 Tailwind 크기·앱 토큰(`app-*`, `brand-*`) 사용
- 커밋 전 `npm run verify` 통과

---

### Task 1: 챕터 빌더 (`buildChapters`)

**Files:**
- Create: `src/features/docent/lib/chapters.ts`
- Test: `src/features/docent/lib/chapters.test.ts`

**Interfaces:**
- Produces:

```ts
export interface DocentPoint {
  seq: number;
  title: string;
  location: string | null;
  narration: string;
  lookFor: string | null;
  forEveryone: string | null;
}
export interface DocentScript {
  siteId: string;
  siteName: string;
  status: 'draft' | 'verified';
  intro: { narration: string };
  points: DocentPoint[];
  outro: { narration: string };
}
export interface DocentChapter {
  id: string; // 'intro' | 'point-1'... | 'history' | 'outro'
  title: string;
  narration: string;
  location: string | null;
  lookFor: string | null;
}
export function buildChapters(
  basic: { name: string; description: string | null; history: string | null },
  script: DocentScript | null,
  language: 'ko' | 'en',
): DocentChapter[];
```

동작 규칙:
- `script` 가 있고 `language === 'ko'` → `여는 말(intro) → 포인트 n개 → 맺음말(outro)`
- `script` 가 없거나 `language === 'en'` (포인트 원고는 한국어뿐이므로) →
  `여는 말(description) → 역사(history) → 맺음말(고정 맺음 문구)`.
  description/history 가 null 이면 그 챕터는 뺀다. 남는 본문 챕터가 0개면 빈 배열.
- 고정 맺음 문구(앱 문구이지 성지 데이터가 아니므로 더미 금지에 안 걸린다):
  ko `'함께 걸어주셔서 감사합니다. 평화로운 순례 되시길 바랍니다.'`
  en `'Thank you for walking with us. May your pilgrimage be peaceful.'`
- 챕터 제목: ko `여는 말`/`역사`/`맺음말`, en `Welcome`/`History`/`Farewell`. 포인트는 원고의 title.

- [ ] **Step 1: 실패하는 테스트 작성** — `chapters.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { buildChapters, type DocentScript } from './chapters';

const basic = { name: '절두산 순교성지', description: '소개문', history: '역사문' };
const script: DocentScript = {
  siteId: 'id-1',
  siteName: '절두산 순교성지',
  status: 'draft',
  intro: { narration: '여는 말입니다' },
  points: [
    { seq: 1, title: '순교자 기념상', location: '입구 왼쪽', narration: '설명', lookFor: '십자가', forEveryone: null },
  ],
  outro: { narration: '맺음말입니다' },
};

describe('buildChapters', () => {
  it('원고가 없으면 소개·역사·맺음말로 구성한다', () => {
    const result = buildChapters(basic, null, 'ko');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
    expect(result[0]?.narration).toBe('소개문');
  });

  it('소개·역사가 둘 다 없으면 빈 배열 — 맺음말만 읽어줄 수는 없다', () => {
    expect(buildChapters({ name: 'x', description: null, history: null }, null, 'ko')).toEqual([]);
  });

  it('원고가 있으면 여는 말·포인트·맺음말로 구성한다', () => {
    const result = buildChapters(basic, script, 'ko');
    expect(result.map((c) => c.id)).toEqual(['intro', 'point-1', 'outro']);
    expect(result[1]?.location).toBe('입구 왼쪽');
    expect(result[1]?.lookFor).toBe('십자가');
  });

  it('영어 모드에서는 한국어 원고 대신 번역 본문 챕터를 쓴다', () => {
    const result = buildChapters(basic, script, 'en');
    expect(result.map((c) => c.id)).toEqual(['intro', 'history', 'outro']);
    expect(result[0]?.title).toBe('Welcome');
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/features/docent` → FAIL (chapters 모듈 없음)
- [ ] **Step 3: `chapters.ts` 구현** — 위 인터페이스와 동작 규칙 그대로. 순수 함수, import 없음(타입 제외)
- [ ] **Step 4: 통과 확인** — `npx vitest run src/features/docent` → PASS
- [ ] **Step 5: 커밋** — `git add src/features/docent && git commit -m "feat: 도슨트 챕터 빌더 — 원고 유무·언어에 따라 챕터 구성"`

### Task 2: 원고 로더

**Files:**
- Create: `src/features/docent/data/scripts.ts`
- Test: `src/features/docent/data/scripts.test.ts`

**Interfaces:**
- Consumes: `DocentScript` (Task 1)
- Produces:

```ts
/** 검증을 테스트하기 위해 glob 결과를 인자로 받는 순수 함수를 분리한다 */
export function indexDocentScripts(modules: Record<string, unknown>): Map<string, DocentScript>;
export function getDocentScript(siteId: string | undefined): DocentScript | null;
```

검증 규칙: `siteId` 가 문자열이고, `intro.narration` 이 비어 있지 않고, `points` 가 1개 이상인 것만 채택. `_템플릿.json`(siteId: null)과 형식이 깨진 파일은 조용히 제외 — 원고 파일 하나가 깨졌다고 앱이 죽으면 안 된다.

- [ ] **Step 1: 실패하는 테스트 작성** — 템플릿 모양 객체(siteId null)와 정상 원고를 넣어, 정상 원고만 Map 에 남는지. JSON 모듈은 `{ default: ... }` 로 감싸일 수 있으므로 두 형태 모두 처리하는지도 확인
- [ ] **Step 2: 실패 확인** — `npx vitest run src/features/docent` → FAIL
- [ ] **Step 3: 구현** — `getDocentScript` 는 `import.meta.glob('/data/docent/*.json', { eager: true })` 결과를 모듈 로드 시 한 번 `indexDocentScripts` 로 색인
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 커밋** — `git commit -m "feat: 도슨트 원고 로더 — data/docent/*.json 을 빌드 시 색인"`

### Task 3: 플레이어 훅 + UI

**Files:**
- Create: `src/features/docent/hooks/use-docent-player.ts`
- Create: `src/features/docent/components/DocentPlayer.tsx`
- Test: `src/features/docent/components/DocentPlayer.test.tsx`

**Interfaces:**
- Consumes: `DocentChapter` (Task 1)
- Produces:

```ts
export function useDocentPlayer(chapters: DocentChapter[], language: 'ko' | 'en'): {
  currentIndex: number;
  isPlaying: boolean;
  playFrom: (index: number) => void; // 해당 챕터부터 재생(끝나면 자동으로 다음 챕터)
  toggle: () => void;                // 재생/일시정지(speechSynthesis pause/resume)
  stop: () => void;
};
// DocentPlayer props
{ chapters: DocentChapter[]; isDraft: boolean; language: 'ko' | 'en' }
```

훅 동작: `utterance.onend` 에서 다음 챕터 자동 재생, 마지막이면 정지. `lang` 은 en→`en-US`, ko→`ko-KR`, `rate 0.95` (기존 값 유지). 언마운트·챕터 배열 변경 시 `speechSynthesis.cancel()`. iOS 사파리는 `pause()` 가 불안정하므로 toggle 의 일시정지는 `cancel()` 후 같은 챕터 처음부터 다시 재생하는 방식도 허용 — 구현 시 단순한 쪽을 택하고 주석으로 남긴다.

UI: 챕터 목록(번호·제목·현재 챕터 강조), 챕터 행을 누르면 `playFrom`, 상단에 재생/일시정지 버튼과 `현재/전체` 표시. 포인트 챕터는 `location`("찾아가는 위치")과 `lookFor`("눈여겨볼 것")를 작은 글씨로 병기. `isDraft` 면 상단에 "초안 — 현장 확인 전" 배지(amber 계열). `chapters.length === 0` 이면 null 반환.

- [ ] **Step 1: 실패하는 테스트 작성** — jsdom 에는 speechSynthesis 가 없으므로 `vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() })` + `vi.stubGlobal('SpeechSynthesisUtterance', class { ... })`. 검증: 챕터 3개 렌더 → 목록에 제목 3개, 초안 배지 표시, 챕터 클릭 시 `speechSynthesis.speak` 호출
- [ ] **Step 2: 실패 확인** — FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 커밋** — `git commit -m "feat: 오디오 도슨트 플레이어 — 챕터 재생·자동 이어듣기"`

### Task 4: 성지 상세에 연결

**Files:**
- Modify: `src/pages/SiteDetailPage.tsx` (기존 TTS 버튼·`toggleSpeech`·`isSpeaking` 제거)

**Interfaces:**
- Consumes: `buildChapters`, `getDocentScript`, `DocentPlayer`

- [ ] **Step 1: 교체** — "성지 이야기" 섹션 헤더의 Volume2 버튼과 관련 상태·effect 를 지우고, 본문 카드 위에:

```tsx
const script = getDocentScript(site.id);
const chapters = buildChapters(
  { name: view?.name ?? site.name, description: view?.description ?? site.description, history: view?.history ?? site.history },
  script,
  language,
);
// ...
<DocentPlayer chapters={chapters} isDraft={script?.status === 'draft'} language={language} />
```

- [ ] **Step 2: 전체 검증** — `npm run verify` → PASS (기존 테스트 188개 + 신규)
- [ ] **Step 3: 커밋** — `git commit -m "feat: 성지 상세의 읽어주기 버튼을 오디오 도슨트 플레이어로 교체"`

### Task 5: 초안 원고 3곳 (절두산·명동·약현)

**Files:**
- Create: `data/docent/절두산-순교성지.json`, `data/docent/명동대성당.json`, `data/docent/약현성당.json`

**Interfaces:** 기존 `data/docent/_템플릿.json` 형식. `siteId` 는 DB 실측값(2026-08-27):
- 절두산 순교성지 `3f20f0d4-e2df-4b33-9d9c-a8c77ac679cd`
- 명동대성당 `4b4199cf-2236-4842-8996-38ee9d36e542`
- 약현성당 (중림동성당) `59613365-3ed5-47df-a65e-7fbac90156a4`

작성 규칙(스펙의 근거 제한을 그대로):
- 근거는 DB 원문(`scripts/tmp-docent-sources.json` 로 내려받음) + **공식 홈페이지**(절두산 jeoldusan.or.kr, 서울대교구·굿뉴스 성지 안내, 명동대성당 mdsd.or.kr)에서 이번 세션에 실제로 확인한 내용만
- 포인트마다 `sourceNote` 에 출처 명시, 확인 못 한 디테일은 쓰지 않는다
- `status: "draft"`, `surveyedBy: "현장: 미조사 / 원고: Claude (문헌 기반 초안)"`, `surveyedAt: "2026-08-27"`
- 문체: 구어체 존댓말 3~6문장 (TTS 로 읽힌다), 포인트 4~6개
- 포인트 뼈대(공식 자료에서 확인되는 범위로 조정):
  절두산 = 입구·순교자 기념상 → 잠두봉(절두산 이름의 유래) → 기념성당 → 성해실(28위) → 박물관 → 한강 전망
  명동 = 언덕길 진입 → 성당 외관(고딕·종탑 47m) → 내부·스테인드글라스 → 지하 성당(유해 안장) → 1987년 민주화 운동
  약현 = 언덕과 서소문 조망 → 성당 외관(로마네스크·1892) → 내부 → 서소문 순교지와의 관계

- [ ] **Step 1: 공식 홈페이지 확인** — WebFetch/검색으로 각 성지 공식 안내문을 읽고 사실 목록을 만든다
- [ ] **Step 2: JSON 3개 작성** — 템플릿 형식·위 규칙 준수. `photos` 는 빈 배열(사진 없음을 지어내지 않는다)
- [ ] **Step 3: 로더 통과 확인** — `npx vitest run src/features/docent` PASS + `npm run build` 로 glob 이 실제 파일을 집는지 확인
- [ ] **Step 4: 커밋** — `git commit -m "content: 절두산·명동·약현 도슨트 초안 원고 (문헌 기반, draft)"`

### Task 6: 화면 확인·문서 정리

**Files:**
- Modify: `docs/이어서-할-일.md` (3.8 항목 갱신)
- Delete: `scripts/tmp-fetch-docent.ts`, `scripts/tmp-docent-sources.json` (gitignore 대상 임시 파일)

- [ ] **Step 1: dev 서버에서 확인** — 절두산 상세를 열어 챕터 목록·재생·다음 챕터 이동·초안 배지를 실제로 누르고 스크린샷
- [ ] **Step 2: `npm run verify`** — PASS
- [ ] **Step 3: 문서 갱신** — 3.8 에 "플레이어 구현 완료(2026-08-27), 초안 3곳, 현장 검증 대기" 반영. 임시 파일 삭제
- [ ] **Step 4: 커밋** — `git commit -m "docs: 도슨트 진행 상태 갱신 — 플레이어·초안 3곳"`
