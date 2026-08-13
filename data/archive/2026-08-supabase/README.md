# 아카이브 — 2026-08 Supabase 정리 이전 자료

**보관일**: 2026-08-13
**출처**: OneDrive 사본 (`.../visit holy아이디어 모음집/한국관광공사앱개발/visitholykorea-app/supabase/`)

---

## 왜 여기 있나

OneDrive 안의 앱 소스 사본을 정리하면서, **그쪽에만 있고 저장소에는 없던 파일 9개**를
옮겨 온 것이다. OneDrive 폴더는 git 저장소가 아니어서 지우면 복구할 곳이 없었다.
나머지 49개 파일은 구버전 소스·빌드 결과물이거나 `data/research/` 와 해시까지 동일해서
옮기지 않고 폴더째 삭제했다 (ADR 0005 — 코드 기준은 GitHub 저장소다).

**이 폴더는 읽기 전용 기록이다.** 여기 있는 SQL 을 다시 실행하지 말 것 —
현재 스키마는 `supabase/migrations/` 가 기준이고, 데이터는 라이브 DB 가 최신이다.

---

## 무엇이 들어 있나

| 파일 | 내용 |
| --- | --- |
| `snapshot_kaahuo_2026-08-10.json` | **DB 전체 스냅샷 (4.7MB).** 2026-08-10 시점의 유일한 백업 |
| `backup_before_content_update_2026-08-10.json` | 소개글 일괄 수정 직전 백업 |
| `site_content_update_2026-08-10.sql` | 그때 실행한 수정 SQL |
| `holy_sites_migration.sql` · `_batch2.sql` | 성지 208곳 시드 SQL (229KB). 데이터 자체는 라이브 DB 에 있음 |
| `pilgrimage_stamps_migration.sql` | 스탬프 테이블 초기 정의 |
| `compare_projects.py` · `verify_live_project.py` | 두 Supabase 프로젝트 대조 스크립트 |
| `PROJECT_CONSOLIDATION.md` | 2026-08-10 정리 계획서 |

---

## 여기서 건진 교훈 하나 — anon 키 UPDATE 는 조용히 실패한다

`PROJECT_CONSOLIDATION.md` 에 이렇게 적혀 있다.

> anon 키로 UPDATE 를 보내면 에러가 아니라 **HTTP 200 + 0 rows** 로 돌아온다.
> 성공한 것처럼 보이므로, 쓰기 후에는 반드시 다시 읽어서 검증해야 한다.

RLS 가 막은 것인데 응답만 보면 성공처럼 보인다. 2026-08-10 에 실제로 여기 걸려
"고쳤는데 왜 안 바뀌지"를 반복했다. **스크립트로 DB 를 고쳤으면 반드시 다시 읽어 확인한다.**

---

## `PROJECT_CONSOLIDATION.md` 는 결론이 틀렸다

이 문서는 프로젝트 `stdmbtyppkyncasplmae` 로 **전환하라**고 권한다.
나중에 service_role 키로 직접 조회해 보니 그쪽은 **데이터가 사실상 비어 있는 버려진 프로젝트**였고,
살아 있는 것은 `kaahuoqzkgshihypzzyh` 하나뿐이었다. 그래서 반대로 저쪽을 삭제했다.

당시에는 신 프로젝트의 anon 키가 없어 접속을 못 해 "미확인"으로 두고 추정으로 결론을 냈다.
**확인 못 한 것을 전제로 계획을 세우면 없는 문제를 풀게 된다.**

현재 사실 관계는 [ADR 0006](../../../docs/20-architecture/adr/0006-db-migration-old-to-new.md) 이 기준이다.
이 문서는 그 판단이 어떻게 뒤집혔는지 남기기 위해서만 보관한다.
