import {
  Camera,
  Check,
  ChevronDown,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getInkDaysLeft, getLiturgicalEvent } from '@/features/passport/lib/liturgical-calendar';
import { resolveReflectionQuestion } from '@/features/passport/lib/reflection-questions';
import { generateShareCard, shareOrDownloadCard } from '@/features/passport/lib/share-card';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import {
  useAddStamp,
  useMyStamp,
  useMyStamps,
  useReportNote,
  useSiteNotes,
  useUploadStampPhotos,
} from '@/features/passport/hooks/use-stamps';
import { recordNoteReads } from '@/features/passport/api/stamps.repository';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';
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
import { splitMassInfo } from '@/features/sites/lib/mass-info';
import { BarrierFreeCard } from '@/features/sites/components/BarrierFreeCard';
import { NearbyParishesCard } from '@/features/sites/components/NearbyParishesCard';
import { DirectionsCard } from '@/features/sites/components/DirectionsCard';
import { TransitParkingCard } from '@/features/sites/components/TransitParkingCard';
import { sizedImageUrl } from '@/shared/lib/image-url';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { VisitEtiquette } from '@/features/sites/components/VisitEtiquette';
import {
  useBarrierFreeNearby,
  useNearbyFacilities,
  useNearbyFestivals,
} from '@/features/sites/hooks/use-nearby-tour';
import { NearbyCrowdingLabel } from '@/features/crowding/components/CrowdingLabel';
import { useNearbyDirectory } from '@/features/sites/hooks/use-nearby-directory';
import {
  useAudioStoriesNearby,
  useWalkingCoursesNear,
} from '@/features/sites/hooks/use-tour-extras';
import { WalkingCourseCard } from '@/features/sites/components/WalkingCourseCard';
import { GROUP_HINT_KEY, GROUP_LABEL_KEY } from '@/features/sites/lib/nearby-facilities';
import {
  useLocalizedSites,
  useSite,
  useSitesInSameDiocese,
} from '@/features/sites/hooks/use-sites';
import { useSitePhoto } from '@/features/sites/hooks/use-featured-photos';
import { useTranslatedSite } from '@/features/sites/hooks/use-site-translation';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { fillPlaceholders, SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { kakaoPlaceUrl } from '@/shared/lib/geo';
import { externalErrorKey } from '@/shared/i18n/external-error-key';

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { language, t } = useSettings();

  const { data: site, isLoading } = useSite(siteId);
  const view = useTranslatedSite(site);
  const { data: nearbySitesRaw = [] } = useSitesInSameDiocese(site?.region, siteId);
  const nearbySites = useLocalizedSites(nearbySitesRaw);
  const {
    data: facilityGroups = [],
    isFetching: facilitiesLoading,
    isError: facilitiesError,
    error: facilitiesErr,
    refetch: refetchFacilities,
  } = useNearbyFacilities(site?.coordinates);
  const {
    data: festivals = [],
    isFetching: festivalsLoading,
    isError: festivalsError,
    error: festivalsErr,
    refetch: refetchFestivals,
  } = useNearbyFestivals(site?.coordinates);
  // "방문 정보" 접이식 그룹의 미리보기 이름을 만들기 위해 여기서도 조회한다.
  // BarrierFreeCard·NearbyParishesCard 내부에서도 같은 쿼리 키로 부르므로
  // TanStack Query 가 요청을 하나로 합친다 — TourAPI 추가 호출이 아니다.
  const { data: barrierFreePlaces = [] } = useBarrierFreeNearby(site?.coordinates);
  const { data: nearbyParishes = [] } = useNearbyDirectory(site?.coordinates);
  const { data: audioStories = [] } = useAudioStoriesNearby(site);
  const { data: walkingCourses = [] } = useWalkingCoursesNear(site);
  const location = useLocation();
  // 마음 나침반에서 「이 코스로 가볼게요」로 오면 #directions — 「찾아가는 길」을 펼쳐 놓고 거기서 시작한다
  const wantsDirections = location.hash === '#directions';
  // 방문 정보는 기본으로 펼쳐 둔다 — 순례자가 가장 먼저 찾는 정보다(재기획 2026-09-14)
  const [visitInfoOpen, setVisitInfoOpen] = useState(true);
  useEffect(() => {
    if (!wantsDirections || !site) return;
    setVisitInfoOpen(true);
    // 스크롤은 body 가 아니라 앱 상자(#app-scroll)가 한다 — 요소 기준으로 옮긴다
    const el = document.getElementById('visit-info-heading');
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [wantsDirections, site]);
  // AI 가이드는 홈 상단에서 이리로 옮겼다 (2026-09-12) — 성지를 보다가 궁금할 때 묻는 자리다
  // 공식 사진이 없으면 순례자가 보내준(운영자 승인) 사진이 대표 자리를 채운다.
  // 훅이므로 이른 return 위에서 부른다.
  const sitePhoto = useSitePhoto(siteId, site?.imageUrl ?? null);
  const { data: isFavorited = false } = useIsFavorite(siteId);
  const toggleFavorite = useToggleFavorite(siteId ?? '');
  const { data: myStamp } = useMyStamp(siteId);
  const stamped = myStamp?.stamped ?? false;
  const { data: myStamps = [] } = useMyStamps();
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const { data: visitNotes = [] } = useSiteNotes(siteId, reviewsOpen ? undefined : 6);
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

  // 오디오 도슨트 — 현장조사 원고가 있으면 포인트별 투어, 없으면 소개·역사 챕터.
  // 훅(useMemo)이라 이른 return 위에서 부른다 — site 는 아직 없을 수 있어 옵셔널로 다룬다.
  //
  // useDocentPlayer 는 chapters 배열의 참조가 바뀌면 재생을 멈추고 처음으로 되감는다
  // (화면을 나가거나 성지가 바뀔 때 멈추기 위한 장치). buildChapters 를 매 렌더마다
  // 새로 부르면 이 페이지의 다른 상태(예: 방문 정보 아코디언)가 바뀔 때마다
  // 도슨트가 끊긴다 — T-004 완료 조건("아코디언을 펼치거나 접어도 재생이 끊기지
  // 않는다")을 만족하려면 여기서 참조를 고정해야 한다.
  const docentScript = getDocentScript(site?.id);
  const docentChapters = useMemo(
    () =>
      buildChapters(
        {
          name: view?.name ?? site?.name ?? '',
          description: view?.description ?? site?.description ?? null,
          history: view?.history ?? site?.history ?? null,
        },
        docentScript,
        language,
      ),
    [
      view?.name,
      view?.description,
      view?.history,
      site?.name,
      site?.description,
      site?.history,
      docentScript,
      language,
    ],
  );

  // 순례 사진 — 스탬프를 찍은 사람만 남길 수 있다 (실방문 인증)
  const uploadPhotos = useUploadStampPhotos(siteId ?? '');
  const reportNote = useReportNote(siteId ?? '');
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const handlePhotoPick = async (files: FileList | null) => {
    if (!files || !myStamp) return;
    const policy = photoPolicy();
    const picked = Array.from(files).slice(0, policy.maxCount);
    if (files.length > policy.maxCount)
      window.alert(t('reviewPhotosMax').replace('{count}', String(policy.maxCount)));
    const photos = await Promise.all(picked.map((file) => shrinkPhoto(file, policy)));
    uploadPhotos.mutate({
      stampId: myStamp.stamped ? (myStamps.find((s) => s.siteId === siteId)?.stampId ?? '') : '',
      photos,
    });
  };
  const handleReport = (stampId: string) => {
    if (!window.confirm(t('reportConfirm'))) return;
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
        if (!result.success) window.alert(t('saveFailedNote'));
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
        window.alert(t('saveFailedFavorite'));
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
        window.alert(t('saveFailedStamp'));
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
      window.alert(t('shareCardFailed'));
    } finally {
      setShareLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!site) {
    return <EmptyState title={t('siteNotFound')} />;
  }

  const tags = [site.emotionTag, localizeRegionName(site.region, language), site.category].filter(
    (tag): tag is string => Boolean(tag),
  );
  const heroPhoto = sitePhoto;

  // "방문 정보" 그룹을 접었을 때 무엇이 안에 있는지 미리 보여줄 이름 목록.
  // 성지마다 있는 항목이 다르므로(문의·무장애 정보·주변 본당은 조건부),
  // 실제로 그 성지에 존재하는 항목만 나열한다 — 없는 걸 있는 것처럼 보이면 안 된다.
  const hasContact = Boolean(site.phone || site.homepageUrl || site.fax);
  const hasBarrierFree = barrierFreePlaces.length > 0;
  const hasNearbyParishes = nearbyParishes.length > 0;
  // 소개글 끝의 「▷ 미사 시간」 문단은 인용문에서 떼어 방문 정보 카드로 보낸다 (2026-09-13)
  const { body: descriptionBody, mass: massInfo } = splitMassInfo(site?.description);
  const visitInfoPreview = [
    t('visitInfoEtiquette'),
    massInfo ? t('massTimesTitle') : null,
    t('directions'),
    hasContact ? t('visitInfoContact') : null,
    hasBarrierFree ? t('visitInfoBarrierFree') : null,
    hasNearbyParishes ? t('visitInfoNearbyParishes') : null,
  ]
    .filter((label): label is string => Boolean(label))
    .join(' · ');

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white pb-32">
      <div className="relative flex h-[55vh] w-full items-center justify-center overflow-hidden bg-app-bg">
        {heroPhoto.url ? (
          <>
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10 }}
              // 화면 첫 그림(LCP) — 휴대폰엔 960px 이면 충분. 1280px 원본은 Lighthouse LCP 11초를 만들었다(9/14)
              src={sizedImageUrl(heroPhoto.url, 960)}
              alt={heroPhoto.fromPilgrim ? `${site.name} — ${t('photoFromPilgrim')}` : site.name}
              className="h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
            {/* 순례자 사진은 누가 보내준 것인지 밝힌다 — 공식 사진과 같아 보이면 안 된다 */}
            {heroPhoto.fromPilgrim && (
              <span className="absolute bottom-2 right-3 rounded bg-black/40 px-2 py-0.5 text-xs text-white/85 backdrop-blur-sm">
                {t('photoFromPilgrim')}
              </span>
            )}
            {/* CC 계열 라이선스는 출처 표기가 의무다 — 출처가 기록된 사진에만 붙는다 */}
            {!heroPhoto.fromPilgrim && site.imageSource && (
              <span className="absolute bottom-2 right-3 rounded bg-black/40 px-2 py-0.5 text-xs text-white/85 backdrop-blur-sm">
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
        {/*
          글자가 놓이는 아래쪽만 한 겹 더 어둡게 깐다.
          위 그라디언트는 가운데가 투명해서, 명동대성당처럼 하늘·나무·계단이
          밝게 나온 사진에서는 흰 글씨가 배경에 묻혔다 — 주소 두 줄이 서로
          겹쳐 보인다는 신고가 여기서 나왔다(2026-09-07 영어 모드 실측).
          사진을 통째로 어둡게 하지 않고 글자 자리만 덮는다.
        */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-lg border border-white/30 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45"
          id="back-button"
          aria-label={t('back')}
        >
          <ChevronLeft size={24} aria-hidden />
        </button>

        {!SUBMISSION_MODE && (
          // 제출판은 본선 기능만 보이게 한다 — T-013
          <button
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-lg border border-white/30 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45"
            aria-label={isFavorited ? t('favoriteRemove') : t('favoriteAdd')}
            aria-pressed={isFavorited}
          >
            <Heart
              size={22}
              className={isFavorited ? 'fill-pink-500 text-pink-500' : undefined}
              aria-hidden
            />
          </button>
        )}

        <div className="absolute bottom-10 left-5 right-5 text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.55)] lg:left-8 lg:right-8">
          <span className="inline-block rounded-full bg-brand-blue px-3 py-1 text-xs font-bold">
            {localizeDomainValue(site.category, t)}
          </span>
          {/* WYD 2027 공식 일정지 — 해외 청년 20~30만 명이 오는 확정 행사다 */}
          {isWydVenue(site.name) && (
            <span className="ml-2 inline-block rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-950">
              {language === 'ko' ? WYD_LABEL_KO : WYD_LABEL_EN}
            </span>
          )}
          <h1 className="mb-3 mt-3 font-display text-[2rem] leading-tight lg:text-[2.5rem]">
            {view?.name ?? site.name}
          </h1>
          {/*
            핀을 두 줄의 가운데가 아니라 첫 줄에 맞춘다(items-start).
            가운데 정렬이면 핀이 두 줄 사이에 끼어 겹침이 더 심해 보였다.
            로마자 주소는 opacity 대신 흰색 농도로 낮춘다 — opacity 는 글자와
            그림자를 함께 흐리게 만들어 오히려 안 읽혔다.
          */}
          <p className="mb-4 flex items-start gap-2 text-base font-medium">
            <MapPin size={18} className="mt-1 shrink-0 text-white/85" aria-hidden />
            <span className="flex flex-col gap-1">
              {/* 외국어 화면은 영문 주소가 주, 한국어 원 주소가 부 — 읽을 수 있는 쪽이 먼저 */}
              {language !== 'ko' && view?.addressRomanized ? (
                <>
                  <span className="leading-snug">{view.addressRomanized}</span>
                  <span className="text-sm leading-snug text-white/80" lang="ko">
                    {site.location}
                  </span>
                </>
              ) : (
                <>
                  <span className="leading-snug">{site.location}</span>
                  {view?.addressRomanized && (
                    <span className="text-sm leading-snug text-white/80">
                      {view.addressRomanized}
                    </span>
                  )}
                </>
              )}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* 인근 혼잡도 라벨 — 값이 있을 때만(재기획 A-2). 주어는 "인근 지역", 숫자는 없다 */}
            <NearbyCrowdingLabel site={site} variant="onDark" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md"
              >
                #{localizeDomainValue(tag, t)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-6 space-y-12 rounded-t-lg bg-white px-5 py-8 lg:px-8">
        <section>
          <SectionHeading title={t('siteBasicInfo')} />
          {/* 주소는 히어로 부제와 "찾아가는 길"에 이미 나오므로 여기서는 뺀다 (T-004) */}
          <Card tone="panel">
            <div className="mb-1 text-sm font-bold text-app-text-muted">
              {t('siteDioceseEmotion')}
            </div>
            <p className="text-base font-bold text-app-text">
              {localizeRegionName(site.region, language)}{' '}
              {site.emotionTag ? `· ${localizeDomainValue(site.emotionTag, t)}` : ''}
            </p>
          </Card>
        </section>

        {/* 방문 정보 — 재기획(2026-09-14) 순서: 들어가기 전 안내 → 미사 시간 → 연락처·홈페이지 →
            주소·외부 지도 → 대중교통·주차 → 무장애 → 주변 본당. 순례자가 가장 먼저 찾는 정보라
            역사·주변 관광보다 위에 두고 기본으로 펼쳐 둔다(접을 수는 있다). */}
        <section aria-labelledby="visit-info-heading">
          <button
            type="button"
            onClick={() => setVisitInfoOpen((open) => !open)}
            aria-expanded={visitInfoOpen}
            aria-controls="visit-info-panel"
            className="flex min-h-16 w-full items-center gap-3 rounded-lg border border-app-border bg-app-bg px-5 py-4 text-left transition-colors hover:border-brand-blue/50"
          >
            <div className="min-w-0 flex-1">
              <h2
                id="visit-info-heading"
                className="font-display text-[1.375rem] leading-tight text-app-text lg:text-2xl"
              >
                {t('visitInfo')}
              </h2>
              {!visitInfoOpen && visitInfoPreview && (
                <p className="mt-1 truncate text-sm text-app-text-muted">{visitInfoPreview}</p>
              )}
            </div>
            <ChevronDown
              size={22}
              className={`shrink-0 text-app-text-muted transition-transform ${visitInfoOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          {visitInfoOpen && (
            <div id="visit-info-panel" className="mt-6 space-y-10">
              {/* 들어가기 전 안내 — 비신자·외국인이 문 앞에서 멈추는 이유를 없앤다 */}
              <VisitEtiquette />

              {/* 미사 시간 — 안내 책자 기준. 성지 사정에 따라 바뀔 수 있다 */}
              {massInfo && (
                <section aria-labelledby="mass-heading">
                  <SectionHeading
                    as="h3"
                    size="md"
                    id="mass-heading"
                    title={
                      <span className="inline-flex items-center gap-2">
                        <img
                          src="/brand/church.png"
                          alt=""
                          aria-hidden
                          width={22}
                          height={22}
                          className="h-[22px] w-auto"
                        />
                        {t('massTimesTitle')}
                      </span>
                    }
                    sub={massInfo.basis ?? undefined}
                  />
                  <dl className="space-y-3 rounded-lg border border-app-border bg-white p-5">
                    {massInfo.rows.map((row) => (
                      <div key={row.label + row.value} className="grid grid-cols-[5rem_1fr] gap-3">
                        <dt className="text-sm font-bold text-brand-blue">{row.label}</dt>
                        <dd className="text-base leading-relaxed text-app-text">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* 공식 홈페이지·연락처 — 미사 시간·단체 순례는 성지에 직접 물어야 정확하다 */}
              <ContactCard site={site} />

              {/* 주소와 외부 지도 — 외국인 방문자를 기준으로 만든 화면 */}
              <DirectionsCard site={site} addressEnglish={view?.addressRomanized ?? null} />

              {/* 대중교통·주차 — 자체 DB 에 칸이 없어 "확인되지 않음" + 문의 경로 */}
              <TransitParkingCard site={site} />

              {/* 무장애 여행 정보 — 결과가 있을 때만 그려진다 (한국관광공사) */}
              <BarrierFreeCard site={site} />

              {/* 주변 본당 — 순례 후 미사를 드리고 싶은 이들을 위해 (교구 주소록 기반) */}
              <NearbyParishesCard site={site} />
            </div>
          )}
        </section>

        <section>
          <SectionHeading title={t('siteStory')} />
          {/* 오디오 도슨트 — 박물관 오디오 가이드처럼 챕터를 골라 듣는다 */}
          <DocentPlayer
            chapters={docentChapters}
            isDraft={docentScript?.status === 'draft'}
            language={language}
          />
          {audioStories.length > 0 && (
            <details className="mb-4 rounded-lg border border-app-border bg-app-bg p-5">
              <summary className="min-h-11 cursor-pointer text-base font-bold text-app-text">
                {t('siteAudioStoriesTitle')}
              </summary>
              <p className="mt-1 text-xs font-bold text-app-text-muted">{t('siteTourismSource')}</p>
              <div className="mt-3 space-y-3">
                {audioStories.slice(0, 3).map((story, index) => (
                  <div
                    key={`${story.audioTitle ?? story.title ?? 'story'}-${index}`}
                    className="rounded-lg bg-white p-3"
                  >
                    <h3 className="text-base font-bold text-app-text">
                      {story.audioTitle ?? story.title}
                    </h3>
                    {story.script && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-app-text-muted">
                        {story.script}
                      </p>
                    )}
                    {story.audioUrl && (
                      <audio className="mt-2 w-full" controls src={story.audioUrl} preload="none" />
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
          <Card tone="panel" className="relative overflow-hidden">
            <History
              size={100}
              className="absolute -bottom-6 -right-6 rotate-12 text-brand-blue/5"
              aria-hidden
            />
            {(view?.description ?? descriptionBody) && (
              <p className="relative z-10 mb-5 font-display text-lg leading-relaxed text-brand-blue">
                &ldquo;{view?.description ?? descriptionBody}&rdquo;
              </p>
            )}
            {(view?.history ?? site.history) && (
              <p className="relative z-10 text-base leading-relaxed text-app-text">
                {view?.history ?? site.history}
              </p>
            )}
          </Card>
        </section>

        {/* 성지 사무실·운영자가 직접 적은 주변 안내. TourAPI 목록과 달리 우리 DB 값이라
            관리자 콘솔에서 고칠 수 있다. 둘 다 비어 있으면 절 자체를 그리지 않는다. */}
        {(site.nearbyAttractions || site.nearbyLodging) && (
          <section>
            <SectionHeading title={t('siteCuratedNearbyTitle')} />
            <div className="space-y-3">
              {site.nearbyAttractions && (
                <Card tone="panel">
                  <div className="mb-1 text-sm font-bold text-app-text-muted">
                    {t('siteCuratedAttractions')}
                  </div>
                  <p className="whitespace-pre-line text-base leading-relaxed text-app-text">
                    {site.nearbyAttractions}
                  </p>
                </Card>
              )}
              {site.nearbyLodging && (
                <Card tone="panel">
                  <div className="mb-1 text-sm font-bold text-app-text-muted">
                    {t('siteCuratedLodging')}
                  </div>
                  <p className="whitespace-pre-line text-base leading-relaxed text-app-text">
                    {site.nearbyLodging}
                  </p>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* 주변 관광 정보 — 한국관광공사 OpenAPI 를 지금 불러온 것. 실패해도 위의 방문 정보는 그대로다.
            역사·방문 정보보다 아래에 둔다(재기획 §4-1: 주변 음식점이 기본 방문 정보보다 먼저 나오지 않게). */}
        <section aria-labelledby="nearby-tourism-heading" className="space-y-10">
          <SectionHeading
            id="nearby-tourism-heading"
            title={t('siteNearbyTourismTitle')}
            sub={t('siteNearbyTourismSub')}
          />

          {(facilitiesError || festivalsError) && (
            <Card tone="panel" padded={false}>
              <EmptyState
                compact
                role="alert"
                title={t('externalApiFailedTitle')}
                description={t(externalErrorKey(facilitiesErr ?? festivalsErr))}
                action={
                  <Button
                    variant="neutral"
                    onClick={() => {
                      void refetchFacilities();
                      void refetchFestivals();
                    }}
                  >
                    {t('retry')}
                  </Button>
                }
              />
            </Card>
          )}

          {!facilitiesLoading && !facilitiesError && facilityGroups.length === 0 && (
            <p className="rounded-lg border border-dashed border-app-border bg-white p-5 text-base text-app-text-muted">
              {t('siteNearbyTourismEmpty')}
            </p>
          )}

          {/*
          주변 편의시설 — 맛집·숙박·볼거리·레포츠·쇼핑을 한 화면에서 본다(관광공사 유형 그대로).
          TourAPI 를 한 번만 부르고 유형으로 나눈다(저장하지 않는다).
          빈 유형은 아예 그리지 않는다 — 시골 성지의 빈 탭은 정보가 없는 앱으로 보인다.
        */}
          {(facilitiesLoading || facilityGroups.length > 0) && (
            <section>
              <SectionHeading title={t('siteNearbyTitle')} meta={t('siteNearbyMeta')} />

              {facilitiesLoading ? (
                <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 lg:-mx-8 lg:px-8">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-64 w-44 flex-shrink-0 animate-pulse rounded-lg bg-app-bg"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {facilityGroups.map(({ group, spots }) => (
                    <div key={group}>
                      <div className="mb-3 flex items-baseline gap-2">
                        <h3 className="text-lg font-bold text-app-text">
                          {t(GROUP_LABEL_KEY[group])}
                        </h3>
                        <span className="text-sm text-app-text-muted">
                          {t(GROUP_HINT_KEY[group])}
                        </span>
                      </div>
                      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 lg:-mx-8 lg:px-8">
                        {spots.map((spot) => (
                          <a
                            key={spot.contentid}
                            href={kakaoPlaceUrl(spot.title, Number(spot.mapy), Number(spot.mapx))}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`${spot.title} 카카오맵에서 보기`}
                            className="group w-44 flex-shrink-0 overflow-hidden rounded-lg border border-app-border bg-white text-left transition-colors hover:border-brand-blue"
                          >
                            <div className="relative flex h-36 items-center justify-center overflow-hidden bg-app-panel">
                              {spot.firstimage ? (
                                <img
                                  src={spot.firstimage}
                                  alt={spot.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Compass
                                  size={28}
                                  className="text-app-text-muted opacity-30"
                                  aria-hidden
                                />
                              )}
                              {spot.dist && (
                                <div className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-blue backdrop-blur-md">
                                  {Math.round(Number(spot.dist))}m
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="mb-1 truncate text-base font-bold text-app-text group-hover:text-brand-blue">
                                {spot.title}
                              </h4>
                              <p className="truncate text-sm text-app-text-muted">{spot.addr1}</p>
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
              <SectionHeading title={t('siteFestivalsTitle')} meta={t('siteLiveSource')} />
              <div className="space-y-3">
                {festivalsLoading
                  ? [1, 2].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-app-bg" />
                    ))
                  : festivals.map((spot) => (
                      <div
                        key={spot.contentid}
                        className="flex items-center gap-4 rounded-lg border border-app-border bg-white p-4"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-blue"
                          aria-hidden
                        >
                          <PartyPopper size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-app-text">
                            {spot.title}
                          </h3>
                          <p className="truncate text-sm text-app-text-muted">{spot.addr1}</p>
                        </div>
                      </div>
                    ))}
              </div>
            </section>
          )}

          {walkingCourses.length > 0 && (
            <section>
              <SectionHeading title={t('siteWalkingCoursesTitle')} />
              <div className="space-y-3">
                {walkingCourses.slice(0, 3).map((course, index) => (
                  <WalkingCourseCard key={course.crsIdx ?? index} course={course} />
                ))}
              </div>
            </section>
          )}
        </section>

        {/* 순례 스탬프 찍기 — 이 화면의 진짜 주인공(T-004). 다른 섹션과 같은
            "보라 세로줄 + h2" 제목 스타일을 쓰지 않고, 굵은 테두리와 배경색만으로
            가장 먼저 눈에 띄게 만든다. 안내 문구와 버튼 사이는 예전에 -mb-2 로
            좁혔다가 버튼을 8px 끌어올려 문구를 가리는 문제가 있었다 — 여기서도
            래퍼 안에서 space-y 로만 간격을 준다. */}
        <section className="space-y-3 rounded-lg border-2 border-brand-blue bg-brand-soft/60 p-5">
          {!stamped &&
            (wydNow ? (
              // WYD 대회 기간 — 다시 오지 않는 날짜. 이 기간의 스탬프는 그 자체로 참가 증명이다.
              <p className="text-center text-sm font-bold text-amber-700">
                ✨{' '}
                <span className="font-extrabold">
                  {language === 'ko' ? WYD_LIMITED_LABEL_KO : WYD_LIMITED_LABEL_EN}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-app-text-muted">
                  {t('stampWydNote')}
                </span>
              </p>
            ) : (
              <p className="text-center text-sm font-bold text-app-text-muted">
                {t('stampLimitedTitle')}{' '}
                <span className={todayLiturgical.colorClass.text}>
                  {todayLiturgical.emoji} {t(todayLiturgical.labelKey)}
                </span>
                {/* 기한이 보여야 한정판이 한정판이 된다 — 재방문의 이유 */}
                <span className="mt-0.5 block text-sm font-medium">
                  {fillPlaceholders(t('stampInkChanges'), {
                    days: inkWindow.daysLeft,
                    next: t(inkWindow.nextLabelKey),
                  })}
                </span>
              </p>
            ))}

          <div className="flex gap-4">
            <button
              onClick={handleStamp}
              disabled={stamped || addStamp.isPending}
              className={`flex min-h-14 flex-1 items-center justify-center gap-2 rounded-lg text-lg font-bold transition-colors ${
                stamped
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'bg-brand-blue text-white hover:bg-brand-blue/90'
              }`}
              id="stamp-button"
            >
              {stamped ? <Check size={22} aria-hidden /> : <Stamp size={22} aria-hidden />}
              {addStamp.isPending
                ? t('stampRecording')
                : stamped
                  ? t('stampDone')
                  : t('stampButton')}
            </button>
          </div>

          {/* 공유 버튼 — 방문정보 섹션들 뒤에 있으면 스탬프를 막 찍은 사람이
              다시 스크롤해야 했다(T-004). 스탬프 버튼 바로 아래로 옮긴다. */}
          {stamped && (
            <Button
              variant="secondary"
              block
              onClick={() => void handleShareCard()}
              disabled={shareLoading}
              id="share-card-button"
            >
              <Share2 size={18} aria-hidden />
              {shareLoading ? t('shareCardMaking') : t('shareStampCard')}
            </Button>
          )}
        </section>

        {/* 한 줄 남기기 — 붐빔 지수는 추정이고, 실제로 조용했는지는 다녀온
            사람만 안다. 이 한 줄이 다음 방문자의 판단 근거가 된다 (컨셉 축 3). */}
        {stamped && !myStamp?.note && !noteDismissed && (
          <Card>
            <p className="text-base font-bold text-app-text">{t('noteAskTitle')}</p>
            {/* 오늘의 질문 — 빈 입력창은 쓰기 어렵지만 질문에는 답하게 된다.
                이 성지의 역사에서 나온 질문이라, 답이 곧 이곳과 나의 기록이 된다. */}
            <blockquote className="mt-2 border-l-2 border-brand-blue/40 pl-3 text-sm font-medium leading-relaxed text-brand-blue">
              {language === 'ko'
                ? resolveReflectionQuestion(site.name, site.category).ko
                : resolveReflectionQuestion(site.name, site.category).en}
            </blockquote>
            <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{t('noteHint')}</p>
            <input
              type="text"
              name="note"
              autoComplete="off"
              maxLength={NOTE_MAX_LENGTH}
              placeholder={t('notePlaceholder')}
              aria-label={t('noteAriaLabel')}
              className="mt-3 min-h-12 w-full rounded-lg border border-app-border bg-white px-4 text-base text-app-text focus:border-brand-blue"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote();
              }}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNoteDismissed(true)}>
                {t('noteLater')}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={normalizeNote(noteDraft) === null || addStamp.isPending}
              >
                {addStamp.isPending ? t('noteSubmitting') : t('noteSubmit')}
              </Button>
            </div>
          </Card>
        )}

        {stamped && (
          <Card>
            {myStamp?.note && (
              <>
                <p className="text-sm font-bold text-app-text-muted">{t('noteMine')}</p>
                <p className="mt-2 text-base leading-relaxed text-app-text">
                  &ldquo;{myStamp.note}&rdquo;
                </p>
              </>
            )}
            {/* 순례 사진 — 모두가 함께 만드는 앱: 다녀온 사람의 사진이
                다음 순례자의 안내가 된다. 올리기 전에 1600px 로 줄인다. */}
            {myStamp?.photos.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {myStamp.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={t('photoMineAlt')}
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : myStamp?.photoUrl ? (
              <img
                src={myStamp.photoUrl}
                alt={t('photoMineAlt')}
                className="mt-3 max-h-48 w-full rounded-lg object-cover"
              />
            ) : null}
            <label
              className={`mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-brand-blue/50 text-base font-bold text-brand-blue transition-colors hover:bg-brand-soft ${
                uploadPhotos.isPending ? 'opacity-50' : ''
              }`}
            >
              <Camera size={18} aria-hidden />
              {uploadPhotos.isPending
                ? t('photoUploading')
                : myStamp?.photos.length
                  ? t('photoReplace')
                  : t('photoAdd')}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadPhotos.isPending}
                onChange={(e) => {
                  void handlePhotoPick(e.target.files);
                  e.target.value = '';
                }}
                data-testid="photo-input"
              />
            </label>
            <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
              {t('reviewPublicNotice')}
            </p>
          </Card>
        )}

        {/* 다녀온 사람의 한 줄 — 추정 지수를 사람의 증언이 보정한다 */}
        {visitNotes.length > 0 && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-bold text-app-text">
                {t('reviewsTitle').replace('{count}', String(visitNotes.length))}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewsOpen((open) => !open)}
                className="-mr-3 text-brand-blue"
                aria-expanded={reviewsOpen}
              >
                {reviewsOpen ? t('reviewsHide') : t('reviewsShow')}
              </Button>
            </div>
            <p className="mt-1 text-sm text-app-text-muted">{t('pilgrimStoriesHint')}</p>
            <ul className="mt-3 space-y-4">
              {visitNotes.map((n) => (
                <li key={n.id} className="border-l-2 border-brand-blue/30 pl-3">
                  {n.photos.length > 0 && (
                    <div className="mb-2 grid grid-cols-3 gap-1">
                      {n.photos.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt={t('pilgrimPhotoAlt')}
                          loading="lazy"
                          className="aspect-square rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {n.note && (
                    <p className="text-base leading-relaxed text-app-text">
                      &ldquo;{n.note}&rdquo;
                    </p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm text-app-text-muted">
                      {new Date(n.visitedAt).toLocaleDateString(SPEECH_LOCALE[language], {
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      {t('visitedLabel')}
                    </p>
                    {/* 운영자가 한 명뿐이라 신고 3건이면 자동으로 가려진다 */}
                    <button
                      onClick={() => handleReport(n.id)}
                      disabled={reportedIds.has(n.id)}
                      className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text disabled:opacity-40"
                      aria-label={t('reportAction')}
                    >
                      <Flag size={14} aria-hidden />
                      {reportedIds.has(n.id) ? t('reportedAction') : t('reportAction')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-app-text-muted">
              {t('reviewModerationNotice')}
            </p>
          </Card>
        )}

        {nearbySites.length > 0 && (
          <section className="pb-10">
            <SectionHeading
              title={fillPlaceholders(t('siteOtherInDiocese'), {
                diocese: localizeRegionName(site.region, language),
              })}
            />
            <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 lg:-mx-8 lg:px-8">
              {nearbySites.map((nearby) => (
                <Link
                  key={nearby.id}
                  to={paths.siteDetail(nearby.id)}
                  className="group w-44 flex-shrink-0 overflow-hidden rounded-lg border border-app-border bg-white text-left transition-colors hover:border-brand-blue"
                  id={`nearby-${nearby.id}`}
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-app-panel">
                    <SiteThumbnail
                      imageUrl={nearby.imageUrl}
                      name={nearby.name}
                      category={nearby.category}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="px-3 pb-3 pt-2.5">
                    <h3 className="truncate text-base font-bold text-app-text">{nearby.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-app-text-muted">
                      {localizeDomainValue(nearby.category, t)} · {nearby.location}
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
