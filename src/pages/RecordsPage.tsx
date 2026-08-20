import { Calendar, FileDown, Heart, MapPin, PenLine, Stamp as StampIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { CERTIFICATE_LEVELS, getCertificateLevel } from '@/features/passport/api/stamps.repository';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { downloadCertificatePDF } from '@/features/passport/lib/certificate';
import { getLiturgicalEvent } from '@/features/passport/lib/liturgical-calendar';
import { LogComposer } from '@/features/records/components/LogComposer';
import { useMyLogs } from '@/features/records/hooks/use-logs';
import { EmptyState } from '@/shared/components/ui/EmptyState';

type Segment = 'logs' | 'stamps';

export default function RecordsPage() {
  const [segment, setSegment] = useState<Segment>('logs');
  const [isComposing, setIsComposing] = useState(false);
  const { session } = useSession();
  const { data: logs = [], isLoading: logsLoading } = useMyLogs();
  const { data: stamps = [] } = useMyStamps();

  const certLevel = getCertificateLevel(stamps.length);
  const nextLevel = CERTIFICATE_LEVELS.find((l) => l.minStamps > stamps.length);

  const pilgrimName =
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email?.split('@')[0] ||
    '순례자';

  const handleDownloadCertificate = async () => {
    if (!certLevel) return;
    await downloadCertificatePDF({
      pilgrimName,
      levelLabel: certLevel.label,
      levelEmoji: certLevel.emoji,
      stampCount: stamps.length,
      siteNames: stamps.map((s) => s.siteName),
      issuedAt: new Date(),
    });
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="sticky top-0 z-40 border-b border-app-border bg-white/90 p-8 pb-4 backdrop-blur-md">
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-app-text">기록</h1>
        <div className="flex rounded-[16px] border border-app-border bg-app-bg p-1" role="tablist">
          {(
            [
              { id: 'logs', label: '순례 여행기' },
              { id: 'stamps', label: '방문 스탬프' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={segment === tab.id}
              onClick={() => setSegment(tab.id)}
              className={`flex-1 rounded-[12px] py-2.5 text-xs font-bold transition-all ${
                segment === tab.id ? 'bg-white text-brand-blue shadow-sm' : 'text-app-text-muted'
              }`}
              id={`seg-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-8 pb-32">
        {segment === 'logs' ? (
          <div className="space-y-8">
            {isComposing ? (
              <LogComposer onDone={() => setIsComposing(false)} />
            ) : (
              <button
                onClick={() => setIsComposing(true)}
                className="flex w-full items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-app-border py-5 text-sm font-bold text-app-text-muted transition-all hover:border-brand-violet/30 hover:bg-brand-violet/5 hover:text-brand-violet"
                id="create-log-btn"
              >
                <PenLine size={20} />
                여행기 작성하기
              </button>
            )}

            {logsLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-[32px] bg-white" />
              ))
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <motion.article
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-[32px] border border-app-border bg-white shadow-xl shadow-gray-200/40"
                  id={`log-item-${log.id}`}
                >
                  {log.siteImage && (
                    <img src={log.siteImage} alt={log.title} className="h-56 w-full object-cover" />
                  )}
                  <div className="p-7">
                    <div className="mb-3 flex items-center gap-2 text-brand-violet">
                      <MapPin size={14} className="fill-brand-violet/10" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">
                        {log.siteName}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold leading-tight text-app-text">
                      {log.title}
                    </h3>
                    <p className="mb-6 line-clamp-3 text-sm font-medium leading-relaxed text-app-text-muted">
                      {log.content}
                    </p>
                    <div className="flex items-center justify-between border-t border-app-border pt-5">
                      <div className="flex items-center gap-2 text-app-text-muted">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold">{log.visitDate}</span>
                      </div>
                      <button className="flex items-center gap-1.5 font-bold text-pink-500">
                        <Heart size={16} className="fill-pink-500" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <EmptyState
                icon={PenLine}
                title="다녀온 성지를 기록해보세요"
                description={
                  '내 순례의 감동과 기도를 기록으로 남기고\n다른 순례자들과 마음을 나누어보세요.'
                }
              />
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="rounded-[32px] bg-gradient-to-br from-brand-blue to-brand-violet p-8 text-white shadow-xl shadow-brand-blue/20">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest opacity-70">
                순례 여권
              </p>
              <div className="mb-3 flex items-end gap-2">
                <span className="text-4xl font-black">{stamps.length}</span>
                <span className="mb-1 text-sm font-bold opacity-80">곳 순례</span>
              </div>
              {certLevel && (
                <p className="mb-1 text-sm font-bold">
                  {certLevel.emoji} 현재 등급: {certLevel.label}
                </p>
              )}
              {nextLevel && (
                <p className="text-xs opacity-70">
                  다음 등급 &ldquo;{nextLevel.label}&rdquo;까지{' '}
                  {nextLevel.minStamps - stamps.length}곳 남았어요
                </p>
              )}
              {certLevel && (
                <button
                  onClick={() => void handleDownloadCertificate()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-xs font-bold backdrop-blur-md transition-colors hover:bg-white/25"
                  id="download-certificate-btn"
                >
                  <FileDown size={16} />
                  순례 인증서 다운로드
                </button>
              )}
            </div>

            {stamps.length === 0 ? (
              <EmptyState
                icon={StampIcon}
                title="아직 스탬프가 없어요"
                description={
                  '성지 상세 페이지에서 "순례 스탬프 찍기"를 눌러\n나만의 순례 여권을 채워보세요.'
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-x-6 gap-y-8">
                {stamps.map((stamp) => {
                  // 스탬프를 찍은 그날의 전례 시기로 디자인이 갈린다 — 같은 성지라도
                  // 사순에 간 스탬프와 성모성월에 간 스탬프가 다르게 남는다.
                  const event = getLiturgicalEvent(new Date(stamp.visitedAt));
                  return (
                    <Link
                      key={stamp.stampId}
                      to={paths.siteDetail(stamp.siteId)}
                      className="flex flex-col items-center gap-3"
                      id={`stamp-${stamp.stampId}`}
                    >
                      <div
                        className={`flex h-20 w-20 rotate-6 scale-110 items-center justify-center rounded-full border-4 border-white shadow-2xl transition-all duration-500 ${event.colorClass.bg}`}
                      >
                        <span className="text-3xl leading-none" aria-hidden>
                          {event.emoji}
                        </span>
                      </div>
                      <span className="text-center text-[10px] font-extrabold leading-tight tracking-tight text-brand-blue">
                        {stamp.siteName}
                      </span>
                      <span className={`text-[9px] font-bold ${event.colorClass.text}`}>
                        {event.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
