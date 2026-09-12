import { Calendar, FileDown, Heart, MapPin, PenLine, Sparkles, Stamp as StampIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { CERTIFICATE_LEVELS, getCertificateLevel } from '@/features/passport/api/stamps.repository';
import { EmptyPassportPreview } from '@/features/passport/components/EmptyPassportPreview';
import { StampMotifIcon } from '@/features/passport/components/StampMotifIcon';
import {
  useDioceseProgress,
  useMyNoteReadCounts,
  useMyStamps,
} from '@/features/passport/hooks/use-stamps';
import { downloadCertificatePDF } from '@/features/passport/lib/certificate';
import { getLiturgicalEvent } from '@/features/passport/lib/liturgical-calendar';
import { generateChronicleCard, generateDioceseCard } from '@/features/passport/lib/recap-card';
import { shareOrDownloadCard } from '@/features/passport/lib/share-card';
import { resolveStampMotif } from '@/features/passport/lib/stamp-motifs';
import { isWydPeriod, isWydVenue } from '@/features/passport/lib/wyd';
import { fetchSiteCoordsIndex } from '@/features/sites/api/holy-sites.repository';
import { LogComposer } from '@/features/records/components/LogComposer';
import { useMyLogs } from '@/features/records/hooks/use-logs';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import {
  localizeCertLevel,
  localizeMotifLabel,
  localizeRegionName,
} from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';

type Segment = 'logs' | 'stamps';

export default function RecordsPage() {
  const { t, language } = useSettings();
  const [segment, setSegment] = useState<Segment>('logs');
  const [isComposing, setIsComposing] = useState(false);
  const { session } = useSession();
  const { data: logs = [], isLoading: logsLoading } = useMyLogs();
  const { data: stamps = [] } = useMyStamps();
  const { data: dioceseProgress = {} } = useDioceseProgress(Boolean(session));
  const { data: noteReads = {} } = useMyNoteReadCounts(Boolean(session));
  const [chronicleLoading, setChronicleLoading] = useState(false);

  const certLevel = getCertificateLevel(stamps.length);
  const nextLevel = CERTIFICATE_LEVELS.find((l) => l.minStamps > stamps.length);

  /** 전국 성지 수 — DB 실측(교구별 합). 로딩 전엔 0이라 화면에서 숨긴다. */
  const totalSites = Object.values(dioceseProgress).reduce((n, d) => n + d.total, 0);
  /** 방문한 성지가 하나라도 있는 교구만 진행 바를 보여준다 — 빈 바 나열은 소음이다. */
  const dioceseRows = Object.entries(dioceseProgress)
    .filter(([, v]) => v.visited > 0)
    .sort((a, b) => b[1].visited / b[1].total - a[1].visited / a[1].total);

  const handleChronicleCard = async () => {
    setChronicleLoading(true);
    try {
      const coords = await fetchSiteCoordsIndex();
      const coordMap = new Map(coords.map((c) => [c.id, c]));
      const asc = [...stamps].sort(
        (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
      );
      const blob = await generateChronicleCard({
        stars: asc.map((s) => ({
          siteName: s.siteName,
          lat: coordMap.get(s.siteId)?.lat ?? null,
          lng: coordMap.get(s.siteId)?.lng ?? null,
          visitedAt: new Date(s.visitedAt),
        })),
        dioceseCount: new Set(stamps.map((s) => s.diocese).filter(Boolean)).size,
        totalSites,
      });
      await shareOrDownloadCard(blob, 'visitholy-순례별자리.png');
    } catch (e) {
      console.error('연대기 카드 생성 실패:', e);
      window.alert(t('cardGenerationFailed'));
    } finally {
      setChronicleLoading(false);
    }
  };

  const handleDioceseCard = async (diocese: string) => {
    try {
      const blob = await generateDioceseCard({
        diocese,
        siteNames: stamps.filter((s) => s.diocese === diocese).map((s) => s.siteName),
        completedAt: new Date(),
      });
      await shareOrDownloadCard(blob, `visitholy-${diocese}-완주.png`);
    } catch (e) {
      console.error('완주 카드 생성 실패:', e);
      window.alert(t('cardGenerationFailed'));
    }
  };

  const pilgrimName =
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email?.split('@')[0] ||
    t('pilgrimDefaultName');

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

  /**
   * 로그인하지 않은 사람에게 "순례 여권 0곳 · 다음 등급까지 1곳 남았어요"를 보여주면
   * 자기 기록이 있는 것처럼 읽힌다. 게다가 빈 상태가 시키는 대로 스탬프를 찍으러 가면
   * 로그인 화면으로 튕긴다 — 하라는 대로 했는데 안 되는 셈이다.
   * 그래서 로그인 전에는 **무엇을 할 수 있는 곳인지**만 보여주고 로그인으로 안내한다.
   */
  if (!session) {
    return (
      <div className="min-h-screen bg-app-bg">
        <header className="sticky top-0 z-40 border-b border-app-border bg-white/90 p-8 pb-6 backdrop-blur-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-app-text">{t('recordsTitle')}</h1>
        </header>

        <div className="px-8 pb-32 pt-4">
          <EmptyState
            icon={StampIcon}
            title={t('recordsLoginTitle')}
            description={
              t('recordsLoginBody')
            }
          />

          <Link
            to={paths.login}
            className="mt-2 block rounded-[24px] bg-brand-blue px-6 py-5 text-center text-sm font-extrabold text-white shadow-xl shadow-brand-blue/20"
            id="records-login-cta"
          >
            {t('recordsLoginCta')}
          </Link>

          <p className="mt-6 text-center text-[0.75rem] font-medium leading-relaxed text-app-text-muted">
            {t('browseWithoutLoginNote')}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              to={paths.map}
              className="rounded-2xl border border-app-border bg-white px-5 py-3 text-[0.8125rem] font-bold text-app-text"
            >
              {t('viewMapButton')}
            </Link>
            <Link
              to={paths.explore}
              className="rounded-2xl border border-app-border bg-white px-5 py-3 text-[0.8125rem] font-bold text-app-text"
            >
              {t('browseShrinesButton')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="sticky top-0 z-40 border-b border-app-border bg-white/90 p-8 pb-4 backdrop-blur-md">
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-app-text">{t('recordsTitle')}</h1>
        <div className="flex rounded-[16px] border border-app-border bg-app-bg p-1" role="tablist">
          {(
            [
              { id: 'logs', label: t('recordsLogsTab') },
              { id: 'stamps', label: t('recordsStampsTab') },
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
            ) : !SUBMISSION_MODE ? (
              // 제출판은 본선 기능만 보이게 한다 — T-013
              <button
                onClick={() => setIsComposing(true)}
                className="flex w-full items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-app-border py-5 text-sm font-bold text-app-text-muted transition-all hover:border-brand-violet/30 hover:bg-brand-violet/5 hover:text-brand-violet"
                id="create-log-btn"
              >
                <PenLine size={20} />
                {t('writeJournalButton')}
              </button>
            ) : null}

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
                      <span className="text-[0.625rem] font-extrabold uppercase tracking-widest">
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
                        <span className="text-[0.625rem] font-bold">{log.visitDate}</span>
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
                title={t('logsEmptyTitle')}
                description={
                  t('logsEmptyBody')
                }
              />
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="rounded-[32px] bg-gradient-to-br from-brand-blue to-brand-violet p-8 text-white shadow-xl shadow-brand-blue/20">
              <p className="mb-2 text-[0.625rem] font-extrabold uppercase tracking-widest opacity-70">
                {t('pilgrimPassport')}
              </p>
              <div className="mb-3 flex items-end gap-2">
                <span className="text-4xl font-black">{stamps.length}</span>
                {/* 진행 분모는 숫자로만 붙인다 — 6개 언어 어디서나 그대로 읽힌다 */}
                <span className="mb-1 text-sm font-bold opacity-80">
                  {t('sitesVisitedSuffix')}
                  {totalSites > 0 ? ` · ${stamps.length}/${totalSites}` : ''}
                </span>
              </div>
              {totalSites > 0 && (
                <div
                  className="mb-4 h-2 overflow-hidden rounded-full bg-white/20"
                  role="progressbar"
                  aria-valuenow={stamps.length}
                  aria-valuemax={totalSites}
                  aria-label={t('nationalProgressAriaLabel')}
                >
                  <div
                    className="h-full rounded-full bg-amber-300"
                    style={{ width: `${Math.min(100, (stamps.length / totalSites) * 100)}%` }}
                  />
                </div>
              )}
              {certLevel && (
                <p className="mb-1 text-sm font-bold">
                  {fillPlaceholders(t('currentCertLevel'), {
                    emoji: certLevel.emoji,
                    label: localizeCertLevel(certLevel.label, t),
                  })}
                </p>
              )}
              {nextLevel && (
                <p className="text-xs opacity-70">
                  {fillPlaceholders(t('nextCertLevel'), {
                    label: localizeCertLevel(nextLevel.label, t),
                    count: nextLevel.minStamps - stamps.length,
                  })}
                </p>
              )}
              {certLevel && (
                <button
                  onClick={() => void handleDownloadCertificate()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-xs font-bold backdrop-blur-md transition-colors hover:bg-white/25"
                  id="download-certificate-btn"
                >
                  <FileDown size={16} />
                  {t('downloadCertificateButton')}
                </button>
              )}
              {stamps.length > 0 && (
                <button
                  onClick={() => void handleChronicleCard()}
                  disabled={chronicleLoading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-xs font-bold backdrop-blur-md transition-colors hover:bg-white/25 disabled:opacity-50"
                  id="chronicle-card-btn"
                >
                  <Sparkles size={16} />
                  {chronicleLoading ? t('chronicleCardLoading') : t('chronicleCardButton')}
                </button>
              )}
            </div>

            {/* 교구별 진행 — 208곳 전부는 멀어도 교구 하나는 손에 잡힌다 */}
            {dioceseRows.length > 0 && (
              <div className="rounded-[32px] border border-app-border bg-white p-7">
                <p className="mb-5 text-sm font-extrabold text-app-text">
                  {t('dioceseProgressTitle')}
                </p>
                <ul className="space-y-4">
                  {dioceseRows.map(([diocese, v]) => {
                    const done = v.visited === v.total;
                    return (
                      <li key={diocese}>
                        <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                          <span className="text-app-text">
                            {localizeRegionName(diocese, language)}
                            {done && (
                              <span className="ml-1.5 text-amber-500">
                                {t('dioceseCompleteBadge')}
                              </span>
                            )}
                          </span>
                          <span className="text-app-text-muted">
                            {v.visited} / {v.total}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-app-bg">
                          <div
                            className={`h-full rounded-full ${done ? 'bg-amber-400' : 'bg-brand-violet'}`}
                            style={{ width: `${(v.visited / v.total) * 100}%` }}
                          />
                        </div>
                        {done && (
                          <button
                            onClick={() => void handleDioceseCard(diocese)}
                            className="mt-2 text-[0.6875rem] font-extrabold text-brand-violet underline-offset-2 hover:underline"
                            id={`diocese-card-${diocese}`}
                          >
                            {fillPlaceholders(t('dioceseCardButton'), {
                              diocese: localizeRegionName(diocese, language),
                            })}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {stamps.length === 0 ? (
              // 빈 화면 대신 "무엇을 모으는 여권인지" 보여준다 (미리보기임을 명시)
              <EmptyPassportPreview />
            ) : (
              <div className="grid grid-cols-3 gap-x-6 gap-y-8">
                {stamps.map((stamp) => {
                  // 스탬프를 찍은 그날의 전례 시기로 잉크 색이 갈리고, 도장의 그림은
                  // 그 성지의 건축(명동=고딕 쌍탑, 해미읍성=성곽…)이 정한다 —
                  // 같은 여권 안에서 어느 하나 같은 도장이 없다.
                  const event = getLiturgicalEvent(new Date(stamp.visitedAt));
                  const motif = resolveStampMotif(stamp.siteName, stamp.category);
                  const reads = stamp.note ? (noteReads[stamp.stampId] ?? 0) : 0;
                  // WYD 대회 기간(2027.7.29~8.8)에 찍은 스탬프는 금테를 두른다 —
                  // "그때 거기 있었다"는 증명은 시간이 지날수록 값이 오른다.
                  const wydLimited = isWydPeriod(new Date(stamp.visitedAt));
                  return (
                    <Link
                      key={stamp.stampId}
                      to={paths.siteDetail(stamp.siteId)}
                      className="flex flex-col items-center gap-3"
                      id={`stamp-${stamp.stampId}`}
                    >
                      <div
                        className={`relative flex h-20 w-20 rotate-6 scale-110 items-center justify-center rounded-full border-4 text-white shadow-2xl transition-all duration-500 ${event.colorClass.bg} ${
                          wydLimited ? 'border-amber-400 ring-2 ring-amber-300/60' : 'border-white'
                        }`}
                      >
                        <StampMotifIcon motif={motif} className="h-12 w-12" />
                        {isWydVenue(stamp.siteName) && (
                          <span
                            className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-black text-amber-950"
                            title={t('wydVenueBadge')}
                          >
                            WYD
                          </span>
                        )}
                      </div>
                      <span className="text-center text-[0.625rem] font-extrabold leading-tight tracking-tight text-brand-blue">
                        {stamp.siteName}
                      </span>
                      <span className={`text-[0.5625rem] font-bold ${event.colorClass.text}`}>
                        {localizeMotifLabel(motif.id, t)} · {t(event.labelKey)}
                      </span>
                      {wydLimited && (
                        <span className="-mt-2 text-[0.5625rem] font-black text-amber-600">
                          {t('wydLimitedBadge')}
                        </span>
                      )}
                      {reads > 0 && (
                        <span className="-mt-2 text-[0.5625rem] font-bold text-app-text-muted">
                          {fillPlaceholders(t('noteReadsCount'), { count: reads })}
                        </span>
                      )}
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
