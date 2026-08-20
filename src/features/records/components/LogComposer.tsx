/**
 * 여행기 작성 폼.
 *
 * 별도 라우트가 아니라 기록 탭 안에서 펼쳐지는 카드다 — 작성이 목록과 같은
 * 자리에서 일어나야 "쓰면 바로 쌓인다"가 눈에 보인다. 성지 선택은 스탬프
 * 찍은 곳을 먼저 보여준다. 다녀온 곳을 기록하는 화면이기 때문이다.
 */

import { PenLine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useSites } from '@/features/sites/hooks/use-sites';
import { useCreateLog } from '../hooks/use-logs';

/** 오늘 날짜(YYYY-MM-DD) — date input 의 기본값. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LogComposer({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const { data: sites = [] } = useSites({ limit: 300 });
  const { data: stamps = [] } = useMyStamps();
  const createLog = useCreateLog();

  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState(todayISO());

  // 스탬프 찍은 성지를 위로 — 여행기는 대부분 다녀온 직후에 쓴다
  const { stampedSites, otherSites } = useMemo(() => {
    const stampedIds = new Set(stamps.map((s) => s.siteId));
    const sorted = [...sites].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return {
      stampedSites: sorted.filter((s) => stampedIds.has(s.id)),
      otherSites: sorted.filter((s) => !stampedIds.has(s.id)),
    };
  }, [sites, stamps]);

  const canSubmit = siteId !== '' && title.trim() !== '' && !createLog.isPending;

  const handleSubmit = () => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    createLog.mutate(
      {
        siteId,
        title: title.trim(),
        content: content.trim(),
        visitDate,
        siteName: site.name,
        siteImage: site.imageUrl ?? null,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            onDone();
            return;
          }
          if (result.error === 'UNAUTHENTICATED') {
            navigate(paths.login);
            return;
          }
          window.alert('여행기 저장에 실패했어요.');
        },
      },
    );
  };

  return (
    <div className="rounded-[32px] border border-app-border bg-white p-7 shadow-xl shadow-gray-200/40">
      <div className="mb-5 flex items-center gap-2 text-brand-violet">
        <PenLine size={16} />
        <h2 className="text-sm font-extrabold uppercase tracking-widest">새 여행기</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="log-site" className="mb-1.5 block text-xs font-bold text-app-text-muted">
            다녀온 성지
          </label>
          <select
            id="log-site"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
          >
            <option value="">성지를 선택하세요</option>
            {stampedSites.length > 0 && (
              <optgroup label="스탬프 찍은 곳">
                {stampedSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={stampedSites.length > 0 ? '다른 성지' : '전체 성지'}>
              {otherSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label htmlFor="log-date" className="mb-1.5 block text-xs font-bold text-app-text-muted">
            방문일
          </label>
          <input
            id="log-date"
            type="date"
            value={visitDate}
            max={todayISO()}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="log-title" className="mb-1.5 block text-xs font-bold text-app-text-muted">
            제목
          </label>
          <input
            id="log-title"
            type="text"
            maxLength={80}
            placeholder="예: 솔뫼성지에서 보낸 조용한 오후"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="log-content"
            className="mb-1.5 block text-xs font-bold text-app-text-muted"
          >
            기록
          </label>
          <textarea
            id="log-content"
            rows={5}
            placeholder="그날의 감동과 기도를 남겨보세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm leading-relaxed text-app-text focus:border-brand-violet focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onDone}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-app-text-muted"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl bg-brand-violet px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {createLog.isPending ? '저장하는 중…' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
