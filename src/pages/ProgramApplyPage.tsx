import { CheckCircle2, Minus, Plus } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { receiptCode, submitApplication } from '@/features/programs/api/applications.repository';
import { findProgram } from '@/features/programs/data/programs';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { koreaTodayIso } from '@/shared/lib/korea-date';

/**
 * 체험여행 프로그램 접수 (2026-11-03, 본선 시연).
 * 로그인 없이 접수된다. 받는 개인정보는 대표자 이름·연락처뿐 — 아동 이름·생년월일은 받지 않는다.
 * 문구는 한국어만(시범 프로그램이 대전 현장용이라). 다국어는 운영이 정해지면.
 */
export default function ProgramApplyPage() {
  const { programSlug } = useParams<{ programSlug: string }>();
  const [params] = useSearchParams();
  const program = findProgram(programSlug);

  const [course, setCourse] = useState(params.get('course') === 'B' ? 'B' : 'A');
  const [visitDate, setVisitDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [mobility, setMobility] = useState(false);
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');

  if (!program) {
    return (
      <PageContainer width="narrow" className="min-h-page">
        <PageHeader back title="프로그램을 찾을 수 없어요" />
      </PageContainer>
    );
  }

  const today = koreaTodayIso();
  const total = adults + children + seniors;
  const phoneOk = /^[0-9-]{9,14}$/.test(phone.replace(/\s/g, ''));
  const ready = visitDate > today && name.trim() && phoneOk && total >= 1 && total <= 30 && consent;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || sending || !program) return;
    setSending(true);
    setError('');
    try {
      const id = await submitApplication({
        programSlug: program.slug,
        course,
        visitDate,
        contactName: name,
        contactPhone: phone,
        adults,
        children,
        seniors,
        needsMobilityHelp: mobility,
        requestNote: note,
      });
      setReceipt(receiptCode(id));
    } catch {
      setError('접수를 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
    } finally {
      setSending(false);
    }
  }

  if (receipt) {
    const chosen = program.courses.find((c) => c.code === course);
    return (
      <PageContainer width="narrow" className="min-h-page pb-16">
        <PageHeader back title="접수 완료" />
        <div className="rounded-2xl border-2 border-[#1f4e8c] bg-white p-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-[#1f4e8c]" aria-hidden />
          <p className="mt-3 text-lg font-black text-slate-900">
            「{program.title}」 접수되었습니다
          </p>
          <p className="mt-4 text-sm text-slate-500">접수번호</p>
          <p className="text-2xl font-black tracking-widest text-[#c2410c]">{receipt}</p>
          <dl className="mt-5 space-y-1 text-left text-sm text-slate-700">
            <Row label="코스" value={`${course} ${chosen?.name ?? ''}`} />
            <Row label="희망 날짜" value={visitDate} />
            <Row
              label="인원"
              value={`성인 ${adults} · 아동 ${children} · 어르신 ${seniors} (총 ${total}명)`}
            />
          </dl>
          <p className="mt-5 text-xs text-slate-400">
            {program.notice} 확정되면 남겨 주신 연락처로 안내드립니다.
          </p>
        </div>
        <Link to={paths.home} className="mt-4 block text-center text-sm font-bold text-[#1f4e8c]">
          홈으로
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title="체험여행 접수" sub={`${program.series} 「${program.title}」`} />

      <form onSubmit={onSubmit} className="space-y-6">
        <Field label="코스">
          <div className="flex gap-2">
            {program.courses.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCourse(c.code)}
                aria-pressed={course === c.code}
                className={`flex-1 rounded-xl border-2 p-3 text-left ${
                  course === c.code ? 'border-[#1f4e8c] bg-[#eef4fc]' : 'border-slate-200 bg-white'
                }`}
              >
                <span className="block text-sm font-black text-slate-900">
                  {c.code} {c.name}
                </span>
                <span className="block text-xs text-slate-500">
                  {c.stops
                    .map((s) => s.place.replace(/ 집결$/, ''))
                    .slice(1)
                    .join(' → ')}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="희망 날짜">
          <input
            type="date"
            required
            min={today}
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="인원 (한 번에 30명까지)">
          <div className="space-y-2">
            <Counter label="성인" value={adults} onChange={setAdults} />
            <Counter label="아동 (초등학생 이하)" value={children} onChange={setChildren} />
            <Counter label="어르신 (65세 이상)" value={seniors} onChange={setSeniors} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={mobility}
              onChange={(e) => setMobility(e.target.checked)}
              className="h-5 w-5"
            />
            휠체어·유모차 등 이동 도움이 필요해요
          </label>
        </Field>

        <Field label="대표자 이름">
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="연락처">
          <input
            required
            inputMode="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </Field>

        <Field label="요청 사항 (선택)">
          <textarea
            maxLength={300}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
        </Field>

        <div className="rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-600">
          <p className="font-bold text-slate-800">개인정보 수집·이용 동의</p>
          <p className="mt-1">
            수집 항목: 대표자 이름, 연락처 · 목적: 프로그램 일정 안내와 확정 연락 · 보관: 프로그램이
            끝난 뒤 1개월 안에 지웁니다. 아동의 이름·생년월일은 받지 않습니다. 동의하지 않으면
            접수할 수 없습니다.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="h-5 w-5"
            />
            동의합니다
          </label>
        </div>

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!ready || sending}
          className="w-full rounded-xl bg-[#c2410c] py-4 text-base font-black text-white disabled:bg-slate-300"
        >
          {sending ? '접수하는 중…' : `총 ${total}명 접수하기`}
        </button>
        <p className="text-center text-xs text-slate-400">{program.notice}</p>
      </form>
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-slate-900">{label}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2">
      <span className="text-sm text-slate-800">{label}</span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          aria-label={`${label} 줄이기`}
        >
          <Minus size={18} />
        </button>
        <span className="w-6 text-center text-lg font-black" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(30, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          aria-label={`${label} 늘리기`}
        >
          <Plus size={18} />
        </button>
      </span>
    </div>
  );
}
