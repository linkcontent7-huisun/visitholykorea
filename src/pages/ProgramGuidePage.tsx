import { ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { findProgram } from '@/features/programs/data/programs';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';

/**
 * 체험여행 프로그램 운영 안내 (2026-11-08, 본선 시연).
 * 제출 제안서 §1 「개발하고, 홍보하고, 접수한다 … 끝난 뒤에도 다시 찾게 한다」를
 * 전·당일·후 세 단계로 한 화면에 보인다. 각 단계는 실제 기능으로 이어진다.
 * 상태 표시는 정직하게 — 지금 되는 것 / 만드는 중 / 이후 단계.
 */

type Status = 'live' | 'soon' | 'later';

const STATUS_LABEL: Record<Status, string> = {
  live: '지금 됩니다',
  soon: '만드는 중',
  later: '이후 단계',
};

const STATUS_STYLE: Record<Status, string> = {
  live: 'bg-[#1f4e8c] text-white',
  soon: 'bg-[#fff3a8] text-[#7a5b00]',
  later: 'bg-slate-100 text-slate-500',
};

export default function ProgramGuidePage() {
  const { programSlug } = useParams<{ programSlug: string }>();
  const program = findProgram(programSlug);
  const [courseCode, setCourseCode] = useState<'A' | 'B'>('A');

  if (!program) {
    return (
      <PageContainer width="narrow" className="min-h-page">
        <PageHeader back title="프로그램을 찾을 수 없어요" />
      </PageContainer>
    );
  }

  const course = program.courses.find((c) => c.code === courseCode) ?? program.courses[0]!;
  const applyTo = `${paths.programApply(program.slug)}?course=${course.code}`;

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title="이 프로그램은 이렇게 진행됩니다" sub={program.series} />

      <div className="rounded-2xl bg-[#fbe7a1] p-5">
        <p className="text-2xl font-black text-[#1f4e8c]">{program.title}</p>
        <p className="mt-1 text-base font-bold text-slate-800">{program.hook}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          대전의 국가유산과 그 둘레의 볼거리를 하루 코스로 걷는 역사 탐방 프로그램입니다. 종교와
          관계없이, 아이 동반 가족·성인·어르신 동반 가족 누구나 참여할 수 있습니다.
        </p>
      </div>

      <Phase no="1" title="떠나기 전" lead="기관이 열고, 사이트가 알리고, 한 화면에서 접수합니다.">
        <Step
          status="soon"
          title="기관이 프로그램을 한 번 등록"
          body="성당·문화원·전시관·지자체가 한 번 등록하면 홍보 카드와 접수 화면이 함께 만들어집니다."
        />
        <Step
          status="live"
          title="사이트에서 알리기"
          body="홈과 대전 성지 화면에 프로그램 카드가 뜹니다. 성지 200여 곳, 6개 언어 화면이 홍보 창구가 됩니다."
        />
        <Step
          status="live"
          title="참가 신청"
          body="성인·아동·어르신 수와 이동 도움 여부를 한 화면에서 접수합니다. 아동 이름·생년월일은 받지 않습니다."
          to={applyTo}
          action="참가 신청하기"
        />
      </Phase>

      <Phase no="2" title="여행 당일" lead="코스를 고르면 하루의 흐름과 그 자리의 체험이 보입니다.">
        <div className="flex gap-2" role="tablist" aria-label="코스 고르기">
          {program.courses.map((c) => (
            <button
              key={c.code}
              type="button"
              role="tab"
              aria-selected={c.code === course.code}
              onClick={() => setCourseCode(c.code)}
              className={`flex-1 rounded-full py-2 text-sm font-black ${
                c.code === course.code ? 'bg-[#1f4e8c] text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {c.code} {c.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">{course.summary} · 예시 일정</p>
        <ol className="mt-3 border-l-2 border-[#1f4e8c]/30 pl-4">
          {course.stops.map((s) => (
            <li key={s.time + s.place} className="relative pb-4 last:pb-0">
              <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#1f4e8c]" />
              <p className="text-xs font-bold text-[#1f4e8c]">{s.time}</p>
              <p className="text-base font-bold text-slate-900">{s.place}</p>
              {s.activity && <p className="text-sm text-[#c2410c]">{s.activity}</p>}
            </li>
          ))}
        </ol>

        <div className="mt-5 space-y-3">
          <Step
            status="soon"
            title="줄 사이 20분"
            body="성심당 앞에서 줄이 몇 분인지 고르면, 그 시간에 맞는 길이의 이야기를 휴대폰으로 듣습니다. 순서가 오면 다음 장소로 가는 길을 알려 줍니다."
          />
          <Step
            status="soon"
            title="돌발 퀴즈와 포인트"
            body="들은 이야기로 퀴즈가 뜨고, 맞히면 포인트가 쌓입니다. 걷는 중에는 뜨지 않고 쉬는 곳·관람하는 곳에서만 뜹니다."
          />
          <Step
            status="later"
            title="종지기를 찾습니다 · 두 집 비교 관찰"
            body="대흥동성당의 종 이야기(작은 종 기념품), 동춘당과 선교사촌 비교는 현장 체험입니다. 성당·한남대와 협의해 정합니다."
          />
        </div>
      </Phase>

      <Phase no="3" title="다녀온 뒤" lead="기관은 결과를 한눈에 보고, 방문자는 다시 찾을 이유가 생깁니다.">
        <Step
          status="live"
          title="기관 화면 집계·엑셀"
          body="접수 인원과 연령대가 기관 화면에 모이고, 엑셀로 내려받아 기록합니다."
        />
        <Step
          status="later"
          title="포인트를 지역에서 쓰기"
          body="포인트를 그 지역 제휴 상점의 할인·쿠폰으로 바꿉니다. 방식은 지자체·상점과 협의합니다."
        />
        <Step
          status="later"
          title="결과 카드 공유 · 일대 소식 알림"
          body="다녀온 결과를 카드로 공유하고, 그 일대의 새 프로그램을 안내받습니다. 안내는 접수 때 동의한 분께만 보냅니다."
        />
      </Phase>

      <Phase no="4" title="같은 틀로 다음 프로그램" lead="국가유산 선정 → 둘레 볼거리 → 이야기·체험 → 기관 협의 후 등록.">
        <Step status="soon" title="2호 후보 · 논산 강경" body="강경성당과 근대 거리. 기관과 협의 후 등록합니다." />
        <Step status="later" title="이후 후보 · 공주, 아산 공세리" body="같은 틀로 계속 만듭니다." />
      </Phase>

      <p className="mt-6 text-center text-xs text-slate-400">{program.notice}</p>

      <Link
        to={applyTo}
        className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-[#c2410c] py-3.5 text-base font-black text-white"
      >
        이 프로그램 접수하기
        <ChevronRight size={18} aria-hidden />
      </Link>
    </PageContainer>
  );
}

function Phase({
  no,
  title,
  lead,
  children,
}: {
  no: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <p className="text-xs font-bold tracking-widest text-[#c2410c]">{no}</p>
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{lead}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Step({
  status,
  title,
  body,
  to,
  action,
}: {
  status: Status;
  title: string;
  body: string;
  to?: string;
  action?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-black text-slate-900">{title}</p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
      {to && action && (
        <Link
          to={to}
          className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[#1f4e8c]"
        >
          {action}
          <ChevronRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}
