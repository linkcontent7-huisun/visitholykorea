import {
  Camera,
  Check,
  ChevronLeft,
  Compass,
  Heart,
  History,
  MapPin,
  PartyPopper,
  Share2,
  Stamp,
  Flag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getInkDaysLeft, getLiturgicalEvent } from '@/features/passport/lib/liturgical-calendar';
import { resolveReflectionQuestion } from '@/features/passport/lib/reflection-questions';
import { generateShareCard, shareOrDownloadCard } from '@/features/passport/lib/share-card';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import {
  useAddStamp,
  useAttachPhoto,
  useMyStamp,
  useMyStamps,
  useReportNote,
  useSiteNotes,
} from '@/features/passport/hooks/use-stamps';
import { recordNoteReads } from '@/features/passport/api/stamps.repository';
import { shrinkPhoto } from '@/features/passport/lib/photo';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { resolveStampMotif } from '@/features/passport/lib/stamp-motifs';
import {
  isWydPeriod,
  isWydVenue,
  WYD_LABEL_EN,
  WYD_LABEL_KO,
  WYD_LIMITED_LABEL_EN,
  WYD_LIMITED_LABEL_KO,
} from '@/features/passport/lib/wyd';
import { DocentPlayer } from '@/features/docent/components/DocentPlayer';
import { buildChapters } from '@/features/docent/lib/chapters';
import { getDocentScript } from '@/features/docent/data/scripts';
import { ContactCard } from '@/features/sites/components/ContactCard';
import { BarrierFreeCard } from '@/features/sites/components/BarrierFreeCard';
import { NearbyParishesCard } from '@/features/sites/components/NearbyParishesCard';
import { DirectionsCard } from '@/features/sites/components/DirectionsCard';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { VisitEtiquette } from '@/features/sites/components/VisitEtiquette';
import { useNearbyFacilities, useNearbyFestivals } from '@/features/sites/hooks/use-nearby-tour';
import { GROUP_HINT } from '@/features/sites/lib/nearby-facilities';
import { useSite, useSitesInSameDiocese } from '@/features/sites/hooks/use-sites';
import { useSitePhoto } from '@/features/sites/hooks/use-featured-photos';
import { useTranslatedSite } from '@/features/sites/hooks/use-site-translation';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useSettings } from '@/shared/i18n/use-settings';
import { kakaoPlaceUrl } from '@/shared/lib/geo';

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { wideView, language } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const { data: site, isLoading } = useSite(siteId);
  const view = useTranslatedSite(site);
  const { data: nearbySites = [] } = useSitesInSameDiocese(site?.region, siteId);
  const { data: facilityGroups = [], isFetching: facilitiesLoading } = useNearbyFacilities(
    site?.coordinates,
  );
  const { data: festivals = [], isFetching: festivalsLoading } = useNearbyFestivals(
    site?.coordinates,
  );
  // 공식 사진이 없으면 순례자가 보내준(운영자 승인) 사진이 대표 자리를 채운다.
  // 훅이므로 이른 return 위에서 부른다.
  const sitePhoto = useSitePhoto(siteId, site?.imageUrl ?? null);
  const { data: isFavorited = false } = useIsFavorite(siteId);
  const toggleFavorite = useToggleFavorite(siteId ?? '');
  const { data: myStamp } = useMyStamp(siteId);
  const stamped = myStamp?.stamped ?? false;
  const { data: myStamps = [] } = useMyStamps();
  const { data: visitNotes = [] } = useSiteNotes(siteId);
  const addStamp = useAddStamp(siteId ?? '');

  // 이 성지가 나의 몇 번째 순례인가 (오래된 순으로 센다). 안 찍었으면 null.
  const visitOrder = (() => {
    const asc = [...myStamps].sort(
      (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
    );
    const idx = asc.findIndex((s) => s.siteId === siteId);
    return idx === -1 ? null : idx + 1;
  })();

  const [shareLoading, setShareLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  // "남길게요"를 누르기 전까지는 입력창을 강요하지 않는다
  const [noteDismissed, setNoteDismissed] = useState(false);

  // 순례 사진 — 스탬프를 찍은 사람만 남길 수 있다 (실방문 인증)
  const attachPhoto = useAttachPhoto(siteId ?? '');
  const reportNote = useReportNote(siteId ?? '');
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const handlePhotoPick = async (file: File | undefined) => {
    if (!file) return;
    const small = await shrinkPhoto(file);
    attachPhoto.mutate(small);
  };
  const handleReport = (stampId: string) => {
    if (!window.confirm('이 글·사진을 신고할까요? 여러 사람이 신고하면 가려집니다.')) return;
    setReportedIds((prev) => new Set(prev).add(stampId));
    reportNote.mutate(stampId);
  };

  // 오늘 찍으면 어떤 한정판 스탬프가 되는지, 그 잉크가 며칠 남았는지 미리 보여준다.
  const todayLiturgical = getLiturgicalEvent();
  const inkWindow = getInkDaysLeft();
  const wydNow = isWydPeriod();

  // "다녀온 사람의 한 줄"이 실제로 화면에 보였을 때만 읽힘 수를 올린다.
  // 성지당 한 번 — 리렌더마다 세면 조회수가 아니라 렌더 횟수가 된다.
  const readRecordedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!siteId || visitNotes.length === 0) return;
    if (readRecordedRef.current.has(siteId)) return;
    readRecordedRef.current.add(siteId);
    void recordNoteReads(siteId, visitNotes.length);
  }, [siteId, visitNotes.length]);


  const handleSaveNote = () => {
    const note = normalizeNote(noteDraft);
    if (!note) return;
    addStamp.mutate(note, {
      onSuccess: (result) => {
        if (!result.success) window.alert('한 줄 저장에 실패했어요.');
      },
    });
  };

  const handleToggleFavorite = () => {
    toggleFavorite.mutate(!isFavorited, {
      onSuccess: (result) => {
        if (result.success) return;
        if (result.error === 'UNAUTHENTICATED') {
          navigate(paths.login);
          return;
        }
        window.alert('찜 저장에 실패했어요.');
      },
    });
  };

  const handleStamp = () => {
    addStamp.mutate(null, {
      onSuccess: (result) => {
        if (result.success) return;
        if (result.error === 'UNAUTHENTICATED') {
          navigate(paths.login);
          return;
        }
        window.alert('스탬프 저장에 실패했어요.');
      },
    });
  };

  const handleShareCard = async () => {
    if (!site) return;
    setShareLoading(true);
    try {
      const blob = await generateShareCard({
        siteName: site.name,
        location: site.location,
        emotionTag: site.emotionTag,
        // 순례자 사진이 대표가 된 성지는 카드 배경도 그 사진을 쓴다
        imageUrl: heroPhoto.url,
        visitedAt: new Date(),
        liturgical: todayLiturgical,
        visitOrder,
        motif: resolveStampMotif(site.name, site.category),
        wyd: isWydVenue(site.name),
        wydLimited: wydNow,
      });
      await shareOrDownloadCard(blob, `visitholy-${site.name}.png`);
    } catch (e) {
      console.error('공유 카드 생성 실패:', e);
      window.alert('공유 카드를 만드는 데 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setShareLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!site) {
    return <p className="p-10 text-center font-bold">성지를 찾을 수 없습니다.</p>;
  }

  const tags = [site.emotionTag, site.region, site.category].filter((t): t is string => Boolean(t));
  const heroPhoto = sitePhoto;

  // 오디오 도슨트 — 현장조사 원고가 있으면 포인트별 투어, 없으면 소개·역사 챕터
  const docentScript = getDocentScript(site.id);
  const docentChapters = buildChapters(
    {
      name: view?.name ?? site.name,
      description: view?.description ?? site.description,
      history: view?.history ?? site.history,
    },
    docentScript,
    language,
  );

  return (
    <div className={`mx-auto min-h-screen ${widthClass} bg-white pb-32`}>
      <div className="relative flex h-[55vh] w-full items-center justify-center overflow-hidden bg-app-bg">
        {heroPhoto.url ? (
          <>
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10 }}
              src={heroPhoto.url}
              alt={heroPhoto.fromPilgrim ? `${site.name} — 순례자가 보내온 사진` : site.name}
              className="h-full w-full object-cover"
            />
            {/* 순례자 사진은 누가 보내준 것인지 밝힌다 — 공식 사진과 같아 보이면 안 된다 */}
            {heroPhoto.fromPilgrim && (
              <span className="absolute bottom-2 right-3 rounded bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                순례자가 보내온 사진
              </span>
            )}
            {/* CC 계열 라이선스는 출처 표기가 의무다 — 출처가 기록된 사진에만 붙는다 */}
            {!heroPhoto.fromPilgrim && site.imageSource && (
              <span className="absolute bottom-2 right-3 rounded bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                {site.imageSource}
                {site.imageLicense ? ` · ${site.imageLicense}` : ''}
              </span>
            )}
          </>
        ) : (
          <SiteThumbnail
            imageUrl={null}
            name={site.name}
            category={site.category}
            intensity="deep"
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-12 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-xl transition-all hover:bg-white/20"
          id="back-button"
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={handleToggleFavorite}
          disabled={toggleFavorite.isPending}
          className="absolute right-6 top-12 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-xl transition-all hover:bg-white/20"
          aria-label={isFavorited ? '찜 해제하기' : '찜하기'}
          aria-pressed={isFavorited}
        >
          <Heart size={20} className={isFavorited ? 'fill-pink-500 text-pink-500' : undefined} />
        </button>

        <div className="absolute bottom-12 left-8 right-8 text-white">
          <span className="inline-block rounded-full bg-brand-violet px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest shadow-xl shadow-brand-violet/20">
            {site.category}
          </span>
          {/* WYD 2027 공식 일정지 — 해외 청년 20~30만 명이 오는 확정 행사다 */}
          {isWydVenue(site.name) && (
            <span className="ml-2 inline-block rounded-full bg-amber-400/90 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-amber-950 shadow-xl">
              {language === 'en' ? WYD_LABEL_EN : WYD_LABEL_KO}
            </span>
          )}
          <h1 className="mb-4 mt-3 text-4xl font-extrabold leading-tight tracking-tight">
            {view?.name ?? site.name}
          </h1>
          <p className="mb-4 flex items-center gap-2 text-sm font-medium opacity-90">
            <MapPin size={16} className="text-brand-violet" />
            <span className="flex flex-col">
              <span>{site.location}</span>
              {view?.addressRomanized && (
                <span className="mt-0.5 text-xs opacity-80">{view.addressRomanized}</span>
              )}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-8 space-y-12 rounded-t-[40px] bg-white p-8">
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
            <h2 className="text-xl font-extrabold tracking-tight text-app-text">기본 정보</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[28px] border border-app-border bg-app-bg p-5">
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-app-text-muted">
                주소
              </div>
              <p className="text-xs font-bold leading-relaxed text-app-text">{site.location}</p>
            </div>
            <div className="rounded-[28px] border border-app-border bg-app-bg p-5">
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-app-text-muted">
                교구 / 감성 태그
              </div>
              <p className="text-xs font-bold text-app-text">
                {site.region} {site.emotionTag ? `· ${site.emotionTag}` : ''}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
            <h2 className="flex-1 text-xl font-extrabold tracking-tight text-app-text">
              성지 이야기
            </h2>
          </div>
          {/* 오디오 도슨트 — 박물관 오디오 가이드처럼 챕터를 골라 듣는다 */}
          <DocentPlayer
            chapters={docentChapters}
            isDraft={docentScript?.status === 'draft'}
            language={language}
          />
          <div className="relative overflow-hidden rounded-[40px] border border-brand-blue/5 bg-brand-blue/[0.03] p-8">
            <History
              size={100}
              className="absolute -bottom-6 -right-6 rotate-12 text-brand-blue/5"
            />
            {(view?.description ?? site.description) && (
              <p className="relative z-10 mb-6 text-lg font-bold italic leading-snug tracking-tight text-brand-blue/90">
                &ldquo;{view?.description ?? site.description}&rdquo;
              </p>
            )}
            {(view?.history ?? site.history) && (
              <p className="relative z-10 text-[15px] font-medium leading-relaxed text-app-text-muted">
                {view?.history ?? site.history}
              </p>
            )}
          </div>
        </section>

        {/*
          주변 편의시설 — 맛집·숙박·볼거리·쉼터를 한 화면에서 본다.
          TourAPI 를 한 번만 부르고 유형으로 나눈다(저장하지 않는다).
          빈 유형은 아예 그리지 않는다 — 시골 성지의 빈 탭은 정보가 없는 앱으로 보인다.
        */}
        {(facilitiesLoading || facilityGroups.length > 0) && (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
              <h2 className="text-xl font-extrabold tracking-tight text-app-text">
                가는 김에 둘러볼 곳
              </h2>
              <span className="text-[10px] font-bold text-app-text-muted">
                반경 5km · 실시간 · 한국관광공사
              </span>
            </div>

            {facilitiesLoading ? (
              <div className="no-scrollbar -mx-8 flex gap-4 overflow-x-auto px-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 w-44 flex-shrink-0 animate-pulse rounded-[32px] bg-app-bg"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {facilityGroups.map(({ group, spots }) => (
                  <div key={group}>
                    <div className="mb-3 flex items-baseline gap-2">
                      <h3 className="text-sm font-extrabold text-app-text">{group}</h3>
                      <span className="text-[11px] font-bold text-app-text-muted">
                        {GROUP_HINT[group]}
                      </span>
                    </div>
                    <div className="no-scrollbar -mx-8 flex gap-4 overflow-x-auto px-8">
                      {spots.map((spot) => (
                        <a
                          key={spot.contentid}
                          href={kakaoPlaceUrl(spot.title, Number(spot.mapy), Number(spot.mapx))}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${spot.title} 카카오맵에서 보기`}
                          className="group w-44 flex-shrink-0 overflow-hidden rounded-[32px] border border-app-border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-violet hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
                        >
                          <div className="relative flex h-40 items-center justify-center overflow-hidden bg-app-bg">
                            {spot.firstimage ? (
                              <img
                                src={spot.firstimage}
                                alt={spot.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Compass size={28} className="text-app-text-muted opacity-30" />
                            )}
                            {spot.dist && (
                              <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-extrabold text-brand-violet backdrop-blur-md">
                                {Math.round(Number(spot.dist))}m
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            <h3 className="mb-1 truncate text-sm font-extrabold text-app-text group-hover:text-brand-violet">
                              {spot.title}
                            </h3>
                            <p className="truncate text-[10px] font-bold text-app-text-muted">
                              {spot.addr1}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 오늘 열리는 행사 — 매일 바뀌므로 캐싱이 원천적으로 불가능한 데이터 */}
        {(festivalsLoading || festivals.length > 0) && (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
              <h2 className="text-xl font-extrabold tracking-tight text-app-text">
                지금 근처에서 열리는 행사
              </h2>
              <span className="text-[10px] font-bold text-app-text-muted">
                실시간 · 한국관광공사
              </span>
            </div>
            <div className="space-y-3">
              {festivalsLoading
                ? [1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-[20px] bg-app-bg" />
                  ))
                : festivals.map((spot) => (
                    <div
                      key={spot.contentid}
                      className="flex items-center gap-4 rounded-[20px] border border-app-border bg-app-bg p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
                        <PartyPopper size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-app-text">
                          {spot.title}
                        </h3>
                        <p className="truncate text-[10px] font-bold text-app-text-muted">
                          {spot.addr1}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* 안내 문구와 버튼은 한 덩어리로 묶는다. 예전에는 문구에 -mb-2 를 줘서
            둘 사이 간격을 좁혔는데, 그 음수 여백이 버튼을 8px 끌어올려 문구를
            가리고 있었다. 래퍼로 감싸 space-y 로 간격을 주면 겹치지 않는다. */}
        <div className="space-y-3">
          {!stamped &&
            (wydNow ? (
              // WYD 대회 기간 — 다시 오지 않는 날짜. 이 기간의 스탬프는 그 자체로 참가 증명이다.
              <p className="text-center text-[11px] font-bold text-amber-600">
                ✨ 지금 찍으면 <span className="font-extrabold">{WYD_LIMITED_LABEL_KO}</span> —
                대회 기간에만 새겨지는 금빛 기록이에요
                <span className="mt-0.5 block text-[10px] font-semibold text-app-text-muted">
                  {WYD_LIMITED_LABEL_EN}
                </span>
              </p>
            ) : (
              <p className="text-center text-[11px] font-bold text-app-text-muted">
                오늘 찍으면{' '}
                <span className={todayLiturgical.colorClass.text}>
                  {todayLiturgical.emoji} {todayLiturgical.label}
                </span>{' '}
                한정판 스탬프예요
                {/* 기한이 보여야 한정판이 한정판이 된다 — 재방문의 이유 */}
                <span className="mt-0.5 block text-[10px] font-semibold">
                  이 잉크는 {inkWindow.daysLeft}일 뒤 {inkWindow.nextLabel}(으)로 바뀌어요
                </span>
              </p>
            ))}

          <div className="flex gap-4">
            <button
              onClick={handleStamp}
              disabled={stamped || addStamp.isPending}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[24px] py-5 text-sm font-extrabold shadow-2xl transition-all ${
                stamped
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-none'
                  : 'bg-brand-blue text-white shadow-brand-blue/20 hover:bg-brand-blue/90'
              }`}
              id="stamp-button"
            >
              {stamped ? <Check size={20} /> : <Stamp size={20} />}
              {addStamp.isPending
                ? '기록하는 중...'
                : stamped
                  ? '순례 스탬프 완료'
                  : '순례 스탬프 찍기'}
            </button>
          </div>
        </div>

        {/* 한 줄 남기기 — 붐빔 지수는 추정이고, 실제로 조용했는지는 다녀온
            사람만 안다. 이 한 줄이 다음 방문자의 판단 근거가 된다 (컨셉 축 3). */}
        {stamped && !myStamp?.note && !noteDismissed && (
          <div className="rounded-[20px] border border-app-border bg-white p-5">
            <p className="text-sm font-bold text-app-text">오늘 그곳은 어땠나요?</p>
            {/* 오늘의 질문 — 빈 입력창은 쓰기 어렵지만 질문에는 답하게 된다.
                이 성지의 역사에서 나온 질문이라, 답이 곧 이곳과 나의 기록이 된다. */}
            <blockquote className="mt-2 border-l-2 border-brand-violet/40 pl-3 text-xs font-semibold leading-relaxed text-brand-violet">
              {language === 'ko'
                ? resolveReflectionQuestion(site.name, site.category).ko
                : resolveReflectionQuestion(site.name, site.category).en}
            </blockquote>
            <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
              떠오르는 한 줄이면 충분해요. 다음 순례자에게도 힘이 됩니다.
            </p>
            <input
              type="text"
              maxLength={NOTE_MAX_LENGTH}
              placeholder="평일 오후, 저 말고 아무도 없었어요"
              aria-label="방문 한 줄 기록"
              className="mt-3 w-full rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote();
              }}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setNoteDismissed(true)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-app-text-muted"
              >
                다음에요
              </button>
              <button
                onClick={handleSaveNote}
                disabled={normalizeNote(noteDraft) === null || addStamp.isPending}
                className="rounded-xl bg-brand-violet px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {addStamp.isPending ? '남기는 중…' : '한 줄 남기기'}
              </button>
            </div>
          </div>
        )}

        {stamped && (
          <div className="rounded-[20px] border border-app-border bg-white p-5">
            {myStamp?.note && (
              <>
                <p className="text-xs font-bold text-app-text-muted">내가 남긴 한 줄</p>
                <p className="mt-2 text-sm leading-relaxed text-app-text">
                  &ldquo;{myStamp.note}&rdquo;
                </p>
              </>
            )}
            {/* 순례 사진 — 모두가 함께 만드는 앱: 다녀온 사람의 사진이
                다음 순례자의 안내가 된다. 올리기 전에 1600px 로 줄인다. */}
            {myStamp?.photoUrl && (
              <img
                src={myStamp.photoUrl}
                alt="내가 남긴 순례 사진"
                className="mt-3 max-h-48 w-full rounded-2xl object-cover"
              />
            )}
            <label
              className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-violet/40 py-3 text-xs font-bold text-brand-violet ${
                attachPhoto.isPending ? 'opacity-50' : ''
              }`}
            >
              <Camera size={14} aria-hidden />
              {attachPhoto.isPending
                ? '사진 올리는 중…'
                : myStamp?.photoUrl
                  ? '사진 바꾸기'
                  : '순례 사진 남기기'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={attachPhoto.isPending}
                onChange={(e) => {
                  void handlePhotoPick(e.target.files?.[0]);
                  e.target.value = '';
                }}
                data-testid="photo-input"
              />
            </label>
            <p className="mt-2 text-[10px] leading-relaxed text-app-text-muted">
              올린 사진과 한 줄은 다른 순례자에게 익명으로 공개돼요. 얼굴이 나온 사진은
              피해주세요.
            </p>
          </div>
        )}

        {/* 다녀온 사람의 한 줄 — 추정 지수를 사람의 증언이 보정한다 */}
        {visitNotes.length > 0 && (
          <div className="rounded-[20px] border border-app-border bg-white p-5">
            <p className="text-sm font-bold text-app-text">순례자 이야기</p>
            <p className="mt-1 text-xs text-app-text-muted">
              다녀온 사람들이 남긴 한 줄과 사진 — 함께 만드는 순례 안내예요
            </p>
            <ul className="mt-3 space-y-4">
              {visitNotes.map((n) => (
                <li key={n.id} className="border-l-2 border-brand-violet/30 pl-3">
                  {n.photoUrl && (
                    <img
                      src={n.photoUrl}
                      alt="순례자가 남긴 사진"
                      loading="lazy"
                      className="mb-2 max-h-56 w-full rounded-2xl object-cover"
                    />
                  )}
                  {n.note && (
                    <p className="text-sm leading-relaxed text-app-text">&ldquo;{n.note}&rdquo;</p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-app-text-muted">
                      {new Date(n.visitedAt).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      방문
                    </p>
                    {/* 운영자가 한 명뿐이라 신고 3건이면 자동으로 가려진다 */}
                    <button
                      onClick={() => handleReport(n.id)}
                      disabled={reportedIds.has(n.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-app-text-muted/60 disabled:opacity-40"
                      aria-label="신고"
                    >
                      <Flag size={10} aria-hidden />
                      {reportedIds.has(n.id) ? '신고됨' : '신고'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 들어가기 전 안내 — 비신자·외국인이 문 앞에서 멈추는 이유를 없앤다 */}
        <VisitEtiquette />

        {/* 찾아가는 길 — 외국인 방문자를 기준으로 만든 화면 */}
        <DirectionsCard site={site} />

        {/* 문의 — 미사 시간·단체 순례는 성지에 직접 물어야 정확하다 */}
        <ContactCard site={site} />

        {/* 무장애 여행 정보 — 결과가 있을 때만 그려진다 (한국관광공사 실시간) */}
        <BarrierFreeCard site={site} />

        {/* 주변 본당 — 순례 후 미사를 드리고 싶은 이들을 위해 (교구 주소록 기반) */}
        <NearbyParishesCard site={site} />

        {stamped && (
          <button
            onClick={() => void handleShareCard()}
            disabled={shareLoading}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-brand-violet/30 py-4 text-sm font-bold text-brand-violet disabled:opacity-50"
            id="share-card-button"
          >
            <Share2 size={18} />
            {shareLoading ? '카드 만드는 중...' : '순례 스탬프 카드 공유하기'}
          </button>
        )}

        {nearbySites.length > 0 && (
          <section className="pb-10">
            <h2 className="mb-8 flex items-center gap-3 text-xl font-extrabold tracking-tight text-app-text">
              <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
              {site.region} 교구의 다른 성지
            </h2>
            <div className="no-scrollbar -mx-8 flex gap-4 overflow-x-auto px-8">
              {nearbySites.map((nearby) => (
                <Link
                  key={nearby.id}
                  to={paths.siteDetail(nearby.id)}
                  className="group w-44 flex-shrink-0 overflow-hidden rounded-[32px] border border-app-border bg-white text-left shadow-sm"
                  id={`nearby-${nearby.id}`}
                >
                  <div className="relative flex h-40 items-center justify-center overflow-hidden bg-app-bg">
                    <SiteThumbnail
                      imageUrl={nearby.imageUrl}
                      name={nearby.name}
                      emojiSizeClass="text-4xl"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-extrabold text-brand-violet backdrop-blur-md">
                      {nearby.category}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="mb-1 truncate text-sm font-extrabold text-app-text">
                      {nearby.name}
                    </h3>
                    <p className="truncate text-[10px] font-bold text-app-text-muted">
                      {nearby.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
