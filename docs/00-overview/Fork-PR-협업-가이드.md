# Fork + PR 협업 가이드

팀원들이 이 저장소에서 각자 개발한 후 PR로 병합하는 방식입니다.

---

## 처음 한 번만 (각 팀원)

### 1단계: Fork
[https://github.com/linkcontent7-huisun/visitholykorea](https://github.com/linkcontent7-huisun/visitholykorea) 우상단 **Fork** 클릭
→ 자신의 계정으로 복사됨

### 2단계: 로컬에 Clone
```bash
git clone https://github.com/[자신의username]/visitholykorea.git
cd visitholykorea
```

### 3단계: Upstream 설정 (중요!)
```bash
git remote add upstream https://github.com/linkcontent7-huisun/visitholykorea.git
git remote -v  # 확인용 — origin(자신)과 upstream(원본)이 보여야 함
```

**이 설정의 의미:**
- `origin` = 자신의 fork (push 대상)
- `upstream` = 원본 저장소 (pull 대상)

---

## 개발할 때마다 (각 팀원)

### 4단계: 최신 코드 받기
```bash
git fetch upstream
git checkout main
git merge upstream/main  # 또는 git rebase upstream/main
```

### 5단계: 기능 브랜치 생성
```bash
git checkout -b feature/기능이름 upstream/main
# 예: git checkout -b feature/도슨트-영어추가
```

### 6단계: 개발 후 커밋 & Push
```bash
git add .
git commit -m "feat: 도슨트에 영어를 추가한다"
git push origin feature/기능이름
```

### 7단계: PR 올리기
GitHub 웹에서 자신의 fork 페이지 → **Pull requests** → **New Pull Request**

**설정:**
- **base:** `linkcontent7-huisun/visitholykorea` / `main`
- **compare:** 자신의 `feature/기능이름`
- 제목과 설명 입력 후 **Create Pull Request**

---

## 저장소 소유자(linkcontent7-huisun)가 할 일

1. PR 받으면 → 코드 리뷰
2. 승인 후 → **Merge pull request** 클릭
3. GitHub이 자동으로 main에 병합

---

## 자주 하는 실수

| 실수 | 해결법 |
|------|--------|
| `origin/main`에서 직접 개발 | 항상 `feature/...` 브랜치에서 개발할 것 |
| `upstream` 없이 `origin/main`만 사용 | 처음에 upstream 설정하기 (3단계) |
| PR을 올렸는데 충돌 표시 | 충돌 해결 후 push — GitHub이 자동 감지 |
| 내 fork가 원본과 동기화 안 됨 | 4단계에서 `git fetch upstream` 자주 하기 |

---

## 같은 기능을 여럿이 개발하면?

**피하는 게 가장 좋다.** 미리 `docs/이어서-할-일.md` 에서 누가 뭘 하는지 확인하고 시작하기.

충돌이 나면:
```bash
git fetch upstream
git rebase upstream/main  # 또는 merge
# 충돌 표시된 파일 열어서 수동 해결
git add .
git rebase --continue  # (rebase 선택했으면)
git push origin feature/기능이름 --force-with-lease
```

---

## 질문 있으면

- **GitHub 자체 문제:** [GitHub Docs](https://docs.github.com/en)
- **저장소 구조 문의:** 메인 대화창에 질문
- **코드 리뷰 피드백:** PR 댓글에서 직접 논의
