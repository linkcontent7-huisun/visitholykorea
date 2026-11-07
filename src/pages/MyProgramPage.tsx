import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { fetchMyApplication, receiptCode } from '@/features/programs/api/applications.repository';
import { findProgram } from '@/features/programs/data/programs';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';

/**
 * 참가자 「나의 체험 링크」 (2026-11-08, 아이디어 취지 문서 §2).
 * 접수한 사람이 회원가입 없이 이 링크 하나로 당일 안내·이야기·퀴즈·포인트·만족도를 본다.
 * 이야기·퀴즈·만족도는 다음 단계에서 이 화면에 붙인다(지금은 「준비 중」으로 정직하게).
 */
export default function MyProgramPage() {
  const { applicationId = '' } = useParams<{ applicationId: string }>();
  const { data: app, isLoading, isError } = useQuery({
    queryKey: ['my-program-application', applicationId],
    queryFn: () => fetchMyApplication(applicationId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <PageContainer width="narrow" className="min-h-page">
        <PageHeader title="나의 체험" />
        <p className="text-sm text-slate-500">불러오는 중…</p>
      </PageContainer>
    );
  }

  const program = app ? findProgram(app.programSlug) : undefined;
  if (isError || !app || !program) {
    return (
      <PageContainer width="narrow" className="min-h-page">
        <PageHeader title="접수 내역을 찾을 수 없어요" />
        <p className="text-sm leading-relaxed text-slate-600">
          링크가 잘렸거나 접수가 취소되었을 수 있어요. 접수번호로 문의해 주세요.
        </p>
      </PageContainer>
    );
  }

  const course = program.courses.find((c) => c.code === app.course) ?? program.courses[0]!;
  const total = app.adults + app.children + app.seniors;

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader title="나의 체험" sub={`${program.series} 「${program.title}」`} />

      <div className="rounded-2xl bg-[#fbe7a1] p-5">
        <p className="text-xs font-bold text-[#1f4e8c]">접수번호</p>
        <p className="text-2xl font-black tracking-widest text-[#c2410c]">
          {receiptCode(app.id)}
        </p>
        <dl className="mt-3 grid grid-cols-[4.5rem_1fr] gap-y-1 text-sm text-slate-800">
          <dt className="text-slate-500">대표자</dt>
          <dd className="font-bold">{app.nameMasked}</dd>
          <dt className="text-slate-500">날짜</dt>
          <dd className="font-bold">{app.visitDate}</dd>
          <dt className="text-slate-500">코스</dt>
          <dd className="font-bold">
            {course.code} {course.name}
          </dd>
          <dt className="text-slate-500">인원</dt>
          <dd className="font-bold">
            성인 {app.adults} · 아동 {app.children} · 어르신 {app.seniors} (총 {total}명)
          </dd>
        </dl>
        <p className="mt-3 text-xs text-slate-600">
          이 화면 주소가 「나의 체험 링크」입니다. 당일 이 링크 하나로 모든 안내를 받습니다.
        </p>
      </div>

      <Block title="오늘의 순서" note="예시 일정 · 기관과 협의해 확정">
        <ol className="border-l-2 border-[#1f4e8c]/30 pl-4">
          {course.stops.map((s) => (
            <li key={s.time + s.place} className="relative pb-4 last:pb-0">
              <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#1f4e8c]" />
              <p className="text-xs font-bold text-[#1f4e8c]">{s.time}</p>
              <p className="text-base font-bold text-slate-900">{s.place}</p>
              {s.activity && <p className="text-sm text-[#c2410c]">{s.activity}</p>}
            </li>
          ))}
        </ol>
      </Block>

      <Block title="줄에서 보는 이야기" note="3화 · 약 11분">
        <p className="text-sm leading-relaxed text-slate-600">
          성심당 줄을 기다리는 동안, 성심당 → 대흥동성당 → 옛 충남도청으로 이어지는 이야기를
          웹툰으로 보고 「듣기」로 들을 수 있습니다.
        </p>
        <Link
          to={paths.programStory(program.slug)}
          className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-[#1f4e8c] py-3 text-sm font-black text-white"
        >
          1화부터 보기
          <ChevronRight size={16} aria-hidden />
        </Link>
      </Block>

      <Block title="내 포인트" note="준비 중">
        <p className="text-3xl font-black text-[#1f4e8c]">
          0 <span className="text-base">P</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          이야기를 듣고 퀴즈를 맞히면 쌓입니다. 대전 제휴 상점에서 쓰는 방법은 협의 중입니다.
        </p>
      </Block>

      <Block title="다녀온 뒤" note="준비 중">
        <p className="text-sm leading-relaxed text-slate-600">
          체험이 끝나면 여기서 짧은 만족도 질문(3개)에 답해 주세요.
          {app.noticeConsent
            ? ' 다음 관련 행사 안내에 동의하셨어요. 2호 프로그램이 열리면 알려 드립니다.'
            : ' 다음 행사 안내는 동의하지 않으셨어요.'}
        </p>
      </Block>

      <Link
        to={paths.programGuide(program.slug)}
        className="mt-6 flex items-center justify-center gap-1 text-sm font-bold text-[#1f4e8c]"
      >
        이 프로그램은 어떻게 진행되나요?
        <ChevronRight size={16} aria-hidden />
      </Link>
    </PageContainer>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        {note && <span className="text-[11px] font-bold text-slate-400">{note}</span>}
      </div>
      {children}
    </section>
  );
}
