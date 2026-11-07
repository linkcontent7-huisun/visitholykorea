import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import {
  applicationsToSheet,
  deleteApplication,
  fetchApplications,
  receiptCode,
  summarize,
} from '../api/applications.repository';
import { PROGRAMS } from '../data/programs';

const KEY = ['programs', 'applications'] as const;

/**
 * 관리자 콘솔 「프로그램 접수」 — 기관이 보는 접수 목록과 한 화면 집계(2026-11-03 본선 시연).
 * 인원·연령대·코스별·날짜별을 맨 위에 숫자로, 아래에 접수 한 건씩.
 */
export function ApplicationsAdminTab() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: KEY, queryFn: fetchApplications });
  const [slug, setSlug] = useState(PROGRAMS[0]!.slug);
  const program = PROGRAMS.find((p) => p.slug === slug) ?? PROGRAMS[0]!;
  const [noticeOnly, setNoticeOnly] = useState(false);
  const rows = useMemo(
    () => data.filter((r) => r.programSlug === slug && (!noticeOnly || r.noticeConsent)),
    [data, slug, noticeOnly],
  );
  const sum = useMemo(() => summarize(rows), [rows]);
  const remove = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error)
    return <p className="p-5 text-sm text-red-600">접수 목록을 못 불러왔어요: {String(error)}</p>;

  const maxDay = Math.max(1, ...sum.byDate.map((d) => d.people));

  return (
    <div className="space-y-4 p-5">
      {PROGRAMS.length > 1 && (
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-lg border p-2"
        >
          {PROGRAMS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      )}
      <p className="text-sm font-bold text-slate-500">
        {program.series} 「{program.title}」 · 주최 {program.organizer}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void downloadXlsx(applicationsToSheet(rows), `${program.title}_접수명단`)}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-[#15803d] px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
        >
          <Download size={16} aria-hidden />
          엑셀 내려받기 ({rows.length}건)
        </button>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={noticeOnly}
            onChange={(e) => setNoticeOnly(e.target.checked)}
            className="h-4 w-4"
          />
          다음 행사 안내 동의자만
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="접수" value={`${sum.count}건`} />
        <Stat label="총 인원" value={`${sum.people}명`} strong />
        <Stat label="이동 도움 필요" value={`${sum.mobility}건`} />
        <Stat
          label="코스별 인원"
          value={program.courses.map((c) => `${c.code} ${sum.byCourse[c.code] ?? 0}`).join(' · ')}
        />
      </div>

      <section className="rounded-xl bg-white p-4">
        <p className="mb-3 text-sm font-black text-slate-900">연령대</p>
        <AgeBar label="성인" n={sum.adults} total={sum.people} color="bg-[#1f4e8c]" />
        <AgeBar label="아동" n={sum.children} total={sum.people} color="bg-[#f59e0b]" />
        <AgeBar label="어르신" n={sum.seniors} total={sum.people} color="bg-[#c2410c]" />
      </section>

      {sum.byDate.length > 0 && (
        <section className="rounded-xl bg-white p-4">
          <p className="mb-3 text-sm font-black text-slate-900">날짜별 인원</p>
          <ul className="space-y-1.5">
            {sum.byDate.map((d) => (
              <li key={d.date} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-slate-600">{d.date}</span>
                <span
                  className="h-4 rounded bg-[#2b63ad]"
                  style={{ width: `${(d.people / maxDay) * 70}%` }}
                />
                <span className="font-bold">{d.people}명</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <p className="text-sm font-black text-slate-900">접수 목록</p>
        {rows.length === 0 && <p className="text-sm text-slate-400">아직 접수가 없어요.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-slate-900">
                  {r.contactName} · {r.contactPhone}
                </p>
                <p className="text-xs text-slate-500">
                  {receiptCode(r.id)} · {r.visitDate} · 코스 {r.course} · 성인 {r.adults} 아동{' '}
                  {r.children} 어르신 {r.seniors}
                  {r.needsMobilityHelp ? ' · 이동 도움' : ''}
                  {r.noticeConsent ? ' · 안내 동의' : ''}
                </p>
                {r.requestNote && (
                  <p className="mt-1 text-xs text-slate-700">「{r.requestNote}」</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`${r.contactName} 님 접수를 지울까요?`)) remove.mutate(r.id);
                }}
                className="rounded-lg p-2 text-slate-400 hover:text-red-600"
                aria-label="접수 지우기"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

/** 오늘 날짜를 붙여 엑셀(.xlsx) 파일로 내려받는다. 만드는 코드는 누를 때만 불러온다 */
async function downloadXlsx(rows: (string | number)[][], base: string) {
  const { buildXlsx } = await import('@/shared/lib/xlsx');
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const bytes = buildXlsx(rows, '접수명단');
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${base}_${day}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${strong ? 'bg-[#1f4e8c] text-white' : 'bg-white'}`}>
      <p className={`text-xs ${strong ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function AgeBar({
  label,
  n,
  total,
  color,
}: {
  label: string;
  n: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return (
    <div className="mb-2 flex items-center gap-2 text-xs">
      <span className="w-12 shrink-0 text-slate-600">{label}</span>
      <span className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
        <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-16 text-right font-bold">
        {n}명 {pct}%
      </span>
    </div>
  );
}
