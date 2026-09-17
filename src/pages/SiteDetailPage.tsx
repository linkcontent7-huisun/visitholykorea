import {
  Camera,
  ChevronDown,
  ChevronLeft,
  Compass,
  Flag,
  Heart,
  History,
  PartyPopper,
  Share2,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getLiturgicalEvent } from '@/features/passport/lib/liturgical-calendar';
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
import { getMyStamps, recordNoteReads } from '@/features/passport/api/stamps.repository';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { resolveStampMotif } from '@/features/passport/lib/stamp-motifs';
import { isWydPeriod, isWydVenue, WYD_LABEL_EN, WYD_LABEL_KO } from '@/features/passport/lib/wyd';
import { DocentPlayer } from '@/features/docent/components/DocentPlayer';
import { buildChapters } from '@/features/docent/lib/chapters';
import { getDocentScript } from '@/features/docent/data/scripts';
import { ContactCard } from '@/features/sites/components/ContactCard';
import { splitMassInfo } from '@/features/sites/lib/mass-info';
import { NearbyParishesCard } from '@/features/sites/components/NearbyParishesCard';
import { DirectionsCard } from '@/features/sites/components/DirectionsCard';
import { sizedImageUrl } from '@/shared/lib/image-url';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useNearbyFacilities, useNearbyFestivals } from '@/features/sites/hooks/use-nearby-tour';
import { NearbyCrowdingLabel } from '@/features/crowding/components/CrowdingLabel';
import { useWalkingCoursesNear } from '@/features/sites/hooks/use-tour-extras';
import { WalkingCourseCard } from '@/features/sites/components/WalkingCourseCard';
import { GROUP_LABEL_KEY } from '@/features/sites/lib/nearby-facilities';
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
import { kakaoSearchUrl } from '@/shared/lib/geo';
import { externalErrorKey } from '@/shared/i18n/external-error-key';

/** 가는 김에 둘러볼 곳 — 레포츠·쇼핑은 도보권 밖으로 벗어나는 유형이라 뺀다(사장님 지적, 2026-09-17) */
const HIDDEN_FACILITY_GROUPS = new Set(['레포츠', '쇼핑']);

/** 순례 후기에 붙이는 사진 최대 장수(2026-09-18) — 일반 사진 추가(최대 5·10장)와는 다른 값 */
const NOTE_PHOTO_MAX = 3;

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { language, t } = useSettings();

  const { data: site, isLoading } = useSite(siteId);
  const view = useTranslatedSite(site);
  const { data: nearbySitesRaw = [] } = useSitesInSameDiocese(site?.region, siteId);
  const nearbySites = useLocalizedSites(nearbySitesRaw);
  const {
    data: facilityGroupsRaw = [],
    isFetching: facilitiesLoading,
    isError: facilitiesError,
    error: facilitiesErr,
    refetch: refetchFacilities,
  } = useNearbyFacilities(site?.coordinates);
  const facilityGroups = facilityGroupsRaw.filter((g) => !HIDDEN_FACILITY_GROUPS.has(g.group));
  const {
    data: festivals = [],
    isFetching: festivalsLoading,
    isError: festivalsError,
    error: festivalsErr,
    refetch: refetchFestivals,
  } = useNearbyFestivals(site?.coordinates);
  const { data: walkingCourses = [] } = useWalkingCoursesNear(site);
  const location = useLocation();
  // 마음 나침반에서 「이 코스로 가볼게요」로 오면 #directions — 「방문 정보」로 스크롤한다
  const wantsDirections = location.hash === '#directions';
  useEffect(() => {
    if (!wantsDirections || !site) return;
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
  // 후기 입력 아코디언 — 처음엔 펼쳐 두고, 「다음에요」를 누르면 접는다(2026-09-18).
  // 접어도 사라지지 않는다 — 줄만 남아서 다시 누르면 펼칠 수 있다.
  const [noteComposerOpen, setNoteComposerOpen] = useState(true);
  // 후기와 함께 올릴 사진 — 최대 3장(2026-09-18, LogComposer 와 같은 미리보기 방식)
  const [notePhotos, setNotePhotos] = useState<{ file: File; preview: string }[]>([]);
  const [notePhotoNotice, setNotePhotoNotice] = useState<string | null>(null);

  // 오디오 도슨트 — 현장조사 원고가 있으면 포인트별 투어, 없으면 소개·역사 챕터.
  // 훅(useMemo)이라 이른 return 위에서 부른다 — site 는 아직 없을 수 있어 옵셔널로 다룬다.
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

  // 순례 사진 — 첫 후기를 남기면 자동으로 생기는 "내 기록"에 붙인다
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

  // 후기 입력 칸의 사진 — 올리기 전 미리보기 URL 은 메모리를 잡으므로 바뀔 때마다 놓아준다
  useEffect(() => () => notePhotos.forEach((p) => URL.revokeObjectURL(p.preview)), [notePhotos]);
  const pickNotePhotos = (files: FileList | null) => {
    if (!files) return;
    const room = Math.max(0, NOTE_PHOTO_MAX - notePhotos.length);
    const picked = Array.from(files).slice(0, room);
    if (files.length > room)
      setNotePhotoNotice(t('reviewPhotosMax').replace('{count}', String(NOTE_PHOTO_MAX)));
    else setNotePhotoNotice(null);
    setNotePhotos((prev) => [
      ...prev,
      ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };
  const removeNotePhoto = (index: number) =>
    setNotePhotos((prev) => prev.filter((_, i) => i !== index));

  // 공유 카드 디자인에 쓰는 오늘의 전례색·WYD 여부 — 화면에 절차로 보여주지 않는다(2026-09-17).
  const todayLiturgical = getLiturgicalEvent();
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

  /**
   * 후기 저장 — 이 한 번의 호출이 "기록"(스탬프)도 함께 만든다(2026-09-17).
   * 예전엔 "스탬프 찍기" 버튼을 먼저 눌러야 후기를 쓸 수 있었다. 그 절차가
   * 이 화면의 유일한 "기록" 입구인데도 무겁게 느껴진다는 지적으로, 절차를 화면에
   * 드러내지 않고 후기 쓰기 한 번으로 합쳤다 — addStamp 자체는 그대로다
   * (처음 쓰면 새 기록을 만들고, 이미 있으면 한 줄만 갱신한다).
   */
  const handleSaveNote = () => {
    const note = normalizeNote(noteDraft);
    if (!note) return;
    addStamp.mutate(note, {
      onSuccess: async (result) => {
        if (!result.success) {
          if (result.error === 'UNAUTHENTICATED') {
            navigate(paths.login);
            return;
          }
          window.alert(t('saveFailedNote'));
          return;
        }
        // 후기와 같이 고른 사진이 있으면 이어서 올린다 — stamp 는 방금 생겼으므로
        // (myStamps 캐시가 아직 갱신 전일 수 있어) 직접 다시 조회해 stampId 를 얻는다.
        if (notePhotos.length > 0 && siteId) {
          const pending = notePhotos;
          setNotePhotos([]);
          const fresh = await getMyStamps();
          const stampId = fresh.find((s) => s.siteId === siteId)?.stampId;
          if (stampId) {
            const policy = photoPolicy();
            const photos = await Promise.all(pending.map((p) => shrinkPhoto(p.file, policy)));
            uploadPhotos.mutate({ stampId, photos });
          }
        }
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

  // 소개글 끝의 「▷ 미사 시간」 문단은 인용문에서 떼어 방문 정보 카드로 보낸다 (2026-09-13)
  const { body: descriptionBody, mass: massInfo } = splitMassInfo(site.description);
  // 「문의」 줄은 바로 아래 연락처 카드와 같은 정보라 뺀다(사장님 지적, 2026-09-17)
  const massRows = massInfo?.rows.filter((row) => row.label !== '문의') ?? [];
  /**
   * 인용문에 보여줄 소개글 — 번역이 실제로 있으면(view.description 이 원문과 다르면)
   * 그대로, 없어 한국어 원문으로 돌아온 것이면 위에서 미사 시간을 뗀 본문을 쓴다.
   * (버그 발견 2026-09-17: `view?.description ?? descriptionBody` 로 늘 원문을 먼저 봐서,
   * 한국어 화면에서 "▷ 미사 시간(...) — 주일: …" 원문이 인용문에 그대로 보이고 있었다.)
   */
  const description =
    view?.description && view.description !== site.description
      ? view.description
      : descriptionBody;

  return (
    // 상단바·하단 탭이 있는 AppLayout 안에서 뜬다(2026-09-17) — 아래 여백은 AppLayout 이 탭 높이만큼 준다
    <div className="mx-auto min-h-page max-w-3xl bg-white pb-12">
      {/* 사진 높이는 화면의 절반 — 상단바(60px)를 뺀 나머지에서 잰다 */}
      <div className="relative flex h-[min(55vh,520px)] w-full items-center justify-center overflow-hidden bg-app-bg">
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
          {/* 주소는 삭제 — 「찾아가는 길」에 한국어·영문 병기로 이미 나온다(2026-09-17 사장님 지적) */}
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

      <div className="relative z-10 -mt-6 space-y-8 rounded-t-lg bg-white px-5 py-6 lg:px-8">
        {/* 방문 정보 — 재기획(2026-09-14) 순서: 미사 시간 → 연락처·홈페이지 → 주소·외부 지도.
            순례자가 가장 먼저 찾는 정보라 역사·주변 관광보다 위에 둔다. 예전엔 접이식이었는데
            펼쳐야 보이는 것 자체가 방해라는 지적(2026-09-17)으로 늘 펼쳐 둔다. */}
        <section aria-labelledby="visit-info-heading" className="space-y-8">
          <SectionHeading id="visit-info-heading" title={t('visitInfo')} />

          {/* 미사 시간 — 안내 책자 기준. 성지 사정에 따라 바뀔 수 있다 */}
          {massInfo && massRows.length > 0 && (
            <section aria-labelledby="mass-heading">
              <SectionHeading as="h3" size="md" id="mass-heading" title={t('massTimesTitle')} />
              <dl className="space-y-4 rounded-lg border border-app-border bg-white p-5">
                {massRows.map((row) => (
                  <div key={row.label + row.value}>
                    <dt className="text-sm font-bold text-brand-blue">{row.label}</dt>
                    <dd className="mt-1 text-base leading-relaxed text-app-text">
                      {/* 시간을 강조 — "07:00, 10:00(성지미사)" 같은 줄에서 시각(HH:MM)만
                          도드라지게 한다(사장님 지적, 2026-09-18). 나머지 글(요일·비고)은 그대로. */}
                      {row.value.split(/(\d{1,2}:\d{2})/g).map((part, i) =>
                        /^\d{1,2}:\d{2}$/.test(part) ? (
                          <span key={i} className="font-bold tabular-nums text-brand-blue">
                            {part}
                          </span>
                        ) : (
                          part
                        ),
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* 공식 홈페이지·연락처 — 미사 시간·단체 순례는 성지에 직접 물어야 정확하다 */}
          <ContactCard site={site} />

          {/* 주소와 외부 지도 — 외국인 방문자를 기준으로 만든 화면 */}
          <DirectionsCard site={site} addressEnglish={view?.addressRomanized ?? null} />
        </section>

        <section>
          <SectionHeading title={t('siteStory')} />
          {/* 오디오 도슨트 — 박물관 오디오 가이드처럼 챕터를 골라 듣는다 */}
          <DocentPlayer
            chapters={docentChapters}
            isDraft={docentScript?.status === 'draft'}
            language={language}
          />
          <Card tone="panel" className="relative overflow-hidden">
            <History
              size={100}
              className="absolute -bottom-6 -right-6 rotate-12 text-brand-blue/5"
              aria-hidden
            />
            {description && (
              <p className="relative z-10 mb-5 font-display text-lg leading-relaxed text-brand-blue">
                &ldquo;{description}&rdquo;
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

        {/* 「주변 관광 정보」라는 상위 제목·설명 문구는 뺀다(사장님 지적, 2026-09-18) —
            아래 세 절(둘러볼 곳·오늘의 행사·도보 코스)은 각자 제목이 있어 그것으로 충분하고,
            묶는 제목이 오히려 한 겹 더 얹힌 것처럼 느껴졌다. 절 자체(하위 구조·오류 카드)는
            그대로 두고 감싸던 제목만 없앤다. 역사·방문 정보보다 아래에 둔 이유는 그대로다
            (재기획 §4-1: 주변 음식점이 기본 방문 정보보다 먼저 나오지 않게). */}
        <div className="space-y-8">
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
          주변 편의시설 — 맛집·숙박·볼거리를 한 화면에서 본다(관광공사 유형 그대로, 레포츠·쇼핑은 뺐다).
          TourAPI 를 한 번만 부르고 유형으로 나눈다(저장하지 않는다).
          빈 유형은 아예 그리지 않는다 — 시골 성지의 빈 탭은 정보가 없는 앱으로 보인다.
        */}
          {(facilitiesLoading || facilityGroups.length > 0) && (
            <section>
              <SectionHeading title={t('siteNearbyTitle')} />

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
                      <h3 className="mb-3 text-lg font-bold text-app-text">
                        {t(GROUP_LABEL_KEY[group])}
                      </h3>
                      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 lg:-mx-8 lg:px-8">
                        {spots.map((spot) => (
                          <a
                            key={spot.contentid}
                            // 좌표 핀 대신 이름으로 검색 — 실제 카카오맵 장소(리뷰·영업시간)로
                            // 이어질 가능성이 높다(사장님 지적, 2026-09-18)
                            href={kakaoSearchUrl(spot.title)}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`${spot.title} 카카오맵에서 검색`}
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
        </div>

        {/* 순례 후기 — "스탬프 찍기" 절차를 없앴다(2026-09-17 사장님 지적). 로그인한 사람은
            누구나 바로 한 줄을 남길 수 있고, 그 글이 이 성지의 첫 기록이면 스탬프(기록)가
            뒤에서 함께 남는다. 사진은 확대해서 가로로 넘겨 보고, 다른 사람 글에는 실명 대신
            일반 라벨("순례자")만 붙인다 — 누가 썼는지는 DB 조회 자체에 없다(비식별 설계 유지). */}
        <section aria-labelledby="reviews-heading" className="space-y-4">
          <SectionHeading
            id="reviews-heading"
            title={t('reviewsTitle').replace('{count}', String(visitNotes.length))}
            sub={t('pilgrimStoriesHint')}
          />

          {/* 아코디언 — 처음엔 펼쳐 두고, 「다음에요」를 누르면 접는다(2026-09-18).
              닫혀도 이 줄은 그대로 있어서, 마음이 바뀌면 다시 눌러 펼칠 수 있다. */}
          {!myStamp?.note && (
            <Card padded={false}>
              <button
                type="button"
                onClick={() => setNoteComposerOpen((open) => !open)}
                className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={noteComposerOpen}
              >
                <span className="text-base font-bold text-app-text">{t('noteAskTitle')}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-app-text-muted transition-transform ${
                    noteComposerOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
              {noteComposerOpen && (
                <div className="px-5 pb-5">
                  {/* 오늘의 질문 — 빈 입력창은 쓰기 어렵지만 질문에는 답하게 된다. */}
                  <blockquote className="border-l-2 border-brand-blue/40 pl-3 text-sm font-medium leading-relaxed text-brand-blue">
                    {language === 'ko'
                      ? resolveReflectionQuestion(site.name, site.category).ko
                      : resolveReflectionQuestion(site.name, site.category).en}
                  </blockquote>
                  <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
                    {t('noteHint')}
                  </p>
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
                  {/* 사진 — 최대 3장. 후기 문장과 함께 한 번에 올라간다 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notePhotos.map((p, i) => (
                      <div key={p.preview} className="relative">
                        <img
                          src={p.preview}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNotePhoto(i)}
                          aria-label={t('logPhotoRemove')}
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {notePhotos.length < NOTE_PHOTO_MAX && (
                      <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-brand-blue/40 text-brand-blue transition-colors hover:bg-brand-soft">
                        <Camera size={16} aria-hidden />
                        <span className="text-[0.625rem] font-bold">
                          {notePhotos.length}/{NOTE_PHOTO_MAX}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            pickNotePhotos(e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {notePhotoNotice && (
                    <p className="mt-1.5 text-xs text-app-text-muted">{notePhotoNotice}</p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoteComposerOpen(false)}
                    >
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
                </div>
              )}
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
              {/* 순례 사진 — 확대해서 가로로 넘겨 본다(2026-09-17, 예전엔 3열 작은 격자) */}
              {myStamp?.photos.length ? (
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                  {myStamp.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={t('photoMineAlt')}
                      className="h-40 w-40 shrink-0 rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : myStamp?.photoUrl ? (
                <img
                  src={myStamp.photoUrl}
                  alt={t('photoMineAlt')}
                  className="mt-3 h-40 w-full rounded-lg object-cover"
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
              <Button
                variant="secondary"
                block
                onClick={() => void handleShareCard()}
                disabled={shareLoading}
                id="share-card-button"
                className="mt-3"
              >
                <Share2 size={18} aria-hidden />
                {shareLoading ? t('shareCardMaking') : t('shareStampCard')}
              </Button>
              <p className="mt-3 text-sm leading-relaxed text-app-text-muted">
                {t('reviewPublicNotice')}
              </p>
            </Card>
          )}

          {visitNotes.length > 0 && (
            <Card>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewsOpen((open) => !open)}
                  className="-mr-3 -mt-1 text-brand-blue"
                  aria-expanded={reviewsOpen}
                >
                  {reviewsOpen ? t('reviewsHide') : t('reviewsShow')}
                </Button>
              </div>
              <ul className="space-y-5">
                {visitNotes.map((n) => (
                  <li key={n.id} className="border-l-2 border-brand-blue/30 pl-3">
                    {/* 실명 대신 일반 라벨만 — "누가"는 DB 조회에 아예 없다(비식별 설계) */}
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand-blue"
                        aria-hidden
                      >
                        <User size={14} />
                      </span>
                      <span className="text-sm font-bold text-app-text">
                        {t('pilgrimDefaultName')}
                      </span>
                    </div>
                    {n.photos.length > 0 && (
                      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
                        {n.photos.map((url) => (
                          <img
                            key={url}
                            src={url}
                            alt={t('pilgrimPhotoAlt')}
                            loading="lazy"
                            className="h-36 w-36 shrink-0 rounded-lg object-cover"
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
        </section>

        {nearbySites.length > 0 && (
          <section>
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
                  <div className="px-3 py-3">
                    <h3 className="truncate text-base font-bold text-app-text">{nearby.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 주변 본당·공소 — 「OO 교구의 다른 성지」 아래로 옮겼다(사장님 지적, 2026-09-17).
            성지끼리 비교가 끝난 다음에 볼 정보라 방문 정보보다 뒤, 화면 맨 끝이 자리다. */}
        <section className="pb-10">
          <NearbyParishesCard site={site} />
        </section>
      </div>
    </div>
  );
}
