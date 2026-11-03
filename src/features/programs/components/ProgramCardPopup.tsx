import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChevronRight, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { programsForRegion, type ExperienceProgram } from '../data/programs';

/**
 * 성지 상세 화면용 — 그 교구에서 열리는 체험여행 프로그램이 있으면
 * ① 화면 안에 작은 배너를 두고 ② 들어올 때마다 카드 팝업을 저절로 띄운다.
 * 대전 성지 화면에서만 보인다(2026-11-03 사장님 선택).
 * 처음엔 하루 한 번이었으나 사장님 지시(11/3 「접속할 때마다 자동으로」)로 매번 뜨게 바꿨다.
 */
export function ProgramPromo({ region }: { region: string | undefined }) {
  const program = programsForRegion(region)[0];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!program) return;
    // 화면이 다 그려진 뒤에 띄운다 — 들어오자마자 가리면 어디인지 모른다
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [program]);

  if (!program) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#1f4e8c] bg-[#fff6cf] px-4 py-3 text-left"
      >
        <Bell size={20} className="shrink-0 text-[#1f4e8c]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-[#1f4e8c]">
            {program.series} 체험여행 모집
          </span>
          <span className="block truncate text-base font-black text-slate-900">
            「{program.title}」
          </span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-[#1f4e8c]" aria-hidden />
      </button>
      <ProgramCardPopup program={program} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ProgramCardPopup({
  program,
  isOpen,
  onClose,
}: {
  program: ExperienceProgram;
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);
  const [courseCode, setCourseCode] = useState(program.courses[0]!.code);
  const course = program.courses.find((c) => c.code === courseCode) ?? program.courses[0]!;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={program.title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex max-h-[94dvh] w-full max-w-md flex-col rounded-t-2xl bg-[#fbe7a1] p-3 sm:rounded-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-700"
              aria-label="닫기"
            >
              <X size={22} />
            </button>

            {/* 빨래집게로 걸어 둔 종이 카드 — 인스타그램 홍보 카드 느낌(참고: 교구별 장소 자료) */}
            <div className="pointer-events-none absolute left-10 top-1 z-10 h-7 w-3 rounded-sm bg-[#c9a36b]" />
            <div className="pointer-events-none absolute right-16 top-1 z-10 h-7 w-3 rounded-sm bg-[#c9a36b]" />

            <div className="mt-3 flex-1 overflow-y-auto rounded-xl border-2 border-[#1f4e8c] bg-white px-5 pb-5 pt-6">
              <div className="mx-auto w-fit rounded-md border-2 border-[#1f4e8c] bg-[#2b63ad] px-4 py-2 text-center text-white shadow">
                <p className="text-[11px] font-bold opacity-90">{program.series}</p>
                <p className="text-lg font-black">{program.title}</p>
              </div>

              <h2 className="mt-4 text-center text-xl font-black leading-snug text-[#1f4e8c]">
                {program.hook}
              </h2>

              <ul className="mt-3 space-y-1.5 text-center text-sm text-slate-700">
                {program.lines.map((line) => (
                  <li key={line}>
                    <span className="bg-[#fff3a8] px-1">{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {program.experiences.map((e) => (
                  <div key={e.name} className="rounded-lg bg-[#eef4fc] p-2.5">
                    <p className="flex items-center gap-1 text-sm font-black text-[#1f4e8c]">
                      <Sparkles size={14} aria-hidden />
                      {e.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-600">{e.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2" role="tablist" aria-label="코스 고르기">
                {program.courses.map((c) => (
                  <button
                    key={c.code}
                    role="tab"
                    aria-selected={c.code === courseCode}
                    onClick={() => setCourseCode(c.code)}
                    className={`flex-1 rounded-full py-2 text-sm font-black ${
                      c.code === courseCode
                        ? 'bg-[#1f4e8c] text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.code} {c.name}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">{course.summary}</p>

              <ol className="mt-3 space-y-2">
                {course.stops.map((s) => (
                  <li key={s.time + s.place} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 rounded-full bg-[#2b63ad] py-1 text-center text-xs font-bold text-white">
                      {s.time}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">{s.place}</span>
                      {s.activity && (
                        <span className="block text-xs text-[#c2410c]">{s.activity}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                예시 일정 · {program.notice}
              </p>

              <Link
                to={`${paths.programApply(program.slug)}?course=${course.code}`}
                onClick={onClose}
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-[#c2410c] py-3.5 text-base font-black text-white"
              >
                이 프로그램 접수하기
                <ChevronRight size={18} aria-hidden />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
