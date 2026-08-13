# Supabase 프로젝트 정리 계획 (2026-08-10)

> 두 개의 Supabase 프로젝트가 섞여 있어 "고쳤는데 왜 안 바뀌지"가 반복되는 상태를 끝내기 위한 문서.
> 공모전 마감(2026-09-21) 전에 정리하는 것을 전제로 한다.

---

## 1. 확인된 현재 상태

말이 아니라 **실제로 확인한 것만** 적는다.

| 항목 | 확인 결과 | 확인 방법 |
|---|---|---|
| `.env.local` 이 가리키는 곳 | **`kaahuoqzkgshihypzzyh`** (구) | 파일 직접 읽음 |
| 라이브 사이트가 쓰는 곳 | **`kaahuoqzkgshihypzzyh`** (구) | 배포된 JS 번들에서 URL 추출 |
| 신 프로젝트 `stdmbtyppkyncasplmae` | **미확인** | anon 키가 없어 접속 못 함 |

**결론: 데이터는 신 프로젝트로 옮겼다지만, 앱은 여전히 구 프로젝트를 본다.**
지금까지 "신 프로젝트가 현행"이라고 알고 있던 것은 사실이 아니었다.

### 구 프로젝트(kaahuo)에 실제로 들어 있는 것

| 테이블 | 행수 | 비고 |
|---|---|---|
| `holy_sites` | 208 | anon 읽기 가능 (public-read 정책) |
| `catholic_directory` | 5,918 | anon 읽기 가능. **단 앱 코드에서 아직 안 씀** |
| `pilgrimage_stamps` | 0 | RLS 정상 (`auth.uid() = user_id`), 아직 사용 기록 없음 |
| `pilgrimage_logs` | **존재하지 않음 (404)** | 아래 3절 참조 |

전체 스냅샷을 `research/snapshot_kaahuo_2026-08-10.json` (4.5MB)에 떠 두었다.

### anon 키의 권한

- 읽기 O / 쓰기 X
- **주의**: UPDATE 를 보내면 에러가 아니라 **HTTP 200 + 0 rows** 로 돌아온다.
  성공한 것처럼 보이므로, 쓰기 후에는 반드시 다시 읽어서 검증해야 한다.
  (2026-08-10에 실제로 이 함정에 걸렸다.)

---

## 2. 어느 쪽을 남길 것인가

**신 프로젝트 `stdmbtyppkyncasplmae` 로 전환하는 것을 권한다.**

결정적인 이유는 **관리 권한**이다. 구 프로젝트는 현재 로그인 계정으로 대시보드 접근이 안 된다
("You do not have access"). 그러면 다음을 할 수 없다.

- SQL Editor 로 데이터 수정 — 오늘 성지 소개글을 못 넣은 이유가 바로 이것이다
- RLS 정책 변경
- API 키 재발급 (유출 대응 불가)
- 백업·복구, 요금제 관리

**공모전에 제출할 서비스의 데이터베이스를 관리할 수 없다는 것은 그 자체로 위험**이다.
부차적으로 신 프로젝트는 서울 리전(ap-northeast-2)이라 도쿄(구)보다 국내 사용자 응답이 빠르다.

다만 **전환 전에 신 프로젝트에 데이터가 온전히 있는지 반드시 확인해야 한다.** 4절 참조.

---

## 3. 함께 정리할 것 — `pilgrimage_logs`

`src/components/tabs/RecordTab.tsx:23` 이 `pilgrimage_logs` 테이블을 조회하는데,
**그 테이블은 DB에도 없고 생성 SQL 파일도 없다.**

동작은 이렇게 된다.

```ts
const { data } = await supabase.from('pilgrimage_logs')...
if (data) setLogs(data);     // data 가 null 이라 그냥 넘어간다
```

에러를 삼키는 구조라 화면이 죽지는 않지만, **"기록" 탭의 로그 목록은 영원히 비어 있다.**
미완성 기능이 남아 있는 것으로 보인다. 둘 중 하나를 골라야 한다.

- **(a)** 테이블을 만들고 기능을 완성한다 — `pilgrimage_stamps_migration.sql` 을 본떠 작성
- **(b)** 기능을 접고 해당 코드를 지운다 — 지금은 사용자에게 빈 화면만 보여주므로

전환 작업과 별개지만, 어차피 DB를 손보는 김에 같이 정하는 게 좋다.

---

## 4. 전환 절차

### 4-0. 사전 준비 — 신 프로젝트 anon 키 확보

Supabase 대시보드 → `stdmbtyppkyncasplmae` → Settings → API 에서
**Project URL** 과 **anon public** 키를 복사한다.

**채팅창에 붙여넣지 말고** `.env.local` 에 아래 두 줄을 임시로 추가한다(비교 검증용).

```
NEW_SUPABASE_URL=https://stdmbtyppkyncasplmae.supabase.co
NEW_SUPABASE_ANON_KEY=여기에_붙여넣기
```

### 4-1. 데이터 일치 확인 (필수)

```bash
python supabase/research/compare_projects.py
```

`holy_sites`, `catholic_directory` 의 행수와 내용을 두 프로젝트 간 비교한다.
**차이가 없어야 전환할 수 있다.** 차이가 있으면 부족한 쪽을 먼저 채운다.

### 4-2. 성지 소개글 보완 적용

전환 전이든 후든, `research/site_content_update_2026-08-10.sql` (UPDATE 6문)을
**최종적으로 쓰기로 한 프로젝트**에 실행한다. 대시보드 SQL Editor 에서 실행하면 된다.

### 4-3. 로컬 전환

`.env.local` 의 아래 두 줄을 신 프로젝트 값으로 교체한다.

```
VITE_SUPABASE_URL=https://stdmbtyppkyncasplmae.supabase.co
VITE_SUPABASE_ANON_KEY=<신 프로젝트 anon 키>
```

교체 후 로컬에서 확인한다.

```bash
npm run dev
```

- 성지 목록 208곳이 뜨는가
- 감정 추천이 동작하는가
- 성지 상세의 연락처·홈페이지 링크가 보이는가

### 4-4. 프로덕션 전환

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에서
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 신 프로젝트 값으로 교체한 뒤 **재배포**한다.

Vite 는 빌드 시점에 값을 번들에 박아 넣으므로, **환경변수만 바꾸고 재배포하지 않으면 반영되지 않는다.**

### 4-5. 전환 검증

```bash
python supabase/research/verify_live_project.py
```

배포된 사이트의 JS 번들에서 Supabase URL 을 추출해 신 프로젝트인지 확인한다.
(오늘 구 프로젝트를 쓰고 있다는 걸 이 방법으로 찾아냈다.)

### 4-6. 뒷정리

- [ ] 구 프로젝트 `kaahuoqzkgshihypzzyh` — 바로 삭제하지 말고 **최소 한 달 보존**.
      문제가 생기면 되돌릴 곳이 필요하다. 공모전 심사가 끝난 뒤 정리한다.
- [ ] **service_role 키 재발급** — 과거에 채팅을 거친 이력이 있다. 신 프로젝트로 넘어가는 김에 새로 발급.
- [ ] 노션 "visit holy _Logo/아이디관리" 페이지의 자격증명을 신 프로젝트 값으로 갱신
- [ ] `ARCHITECTURE.md` 에 어느 프로젝트를 쓰는지 명시해 두기 (이번 혼선의 재발 방지)

---

## 5. 되돌리기

전환 후 문제가 생기면 `.env.local` 과 Vercel 환경변수를 구 프로젝트 값으로 되돌리고 재배포한다.
구 프로젝트 값은 `research/snapshot_kaahuo_2026-08-10.json` 과 함께
아래에 적어 둔다(키가 아니라 **URL 만** — 키는 노션에서 확인).

```
구 프로젝트 URL: https://kaahuoqzkgshihypzzyh.supabase.co
```

데이터 자체는 스냅샷(208 + 5,918행)이 있으므로, 최악의 경우 새 프로젝트에 다시 부어 넣을 수 있다.

---

## 6. 요약 체크리스트

- [ ] 신 프로젝트 anon 키를 `.env.local` 에 임시 추가 (`NEW_SUPABASE_*`)
- [ ] `compare_projects.py` 로 데이터 일치 확인
- [ ] `site_content_update_2026-08-10.sql` 실행 (성지 5곳 보완·정정)
- [ ] `.env.local` 을 신 프로젝트로 교체 → 로컬 확인
- [ ] Vercel 환경변수 교체 → **재배포**
- [ ] `verify_live_project.py` 로 전환 확인
- [ ] `pilgrimage_logs` 처리 방향 결정 (완성 or 제거)
- [ ] service_role 키 재발급, 노션 갱신
- [ ] 구 프로젝트는 한 달 뒤 정리
