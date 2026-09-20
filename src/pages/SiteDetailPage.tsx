import {
  BookOpen,
  Camera,
  ChevronDown,
  Compass,
  Flag,
  Heart,
  PenLine,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { resolveReflectionQuestion } from '@/features/passport/lib/reflection-questions';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import {
  useAddStamp,
  useDeleteStampPhoto,
  useMyStamp,
  useMyStamps,
  useReportNote,
  useSiteNotes,
  useUpdateStamp,
  useUploadStampPhotos,
} from '@/features/passport/hooks/use-stamps';
import {
  getMyStamps,
  isVisitedOnAvailable,
  recordNoteReads,
} from '@/features/passport/api/stamps.repository';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { isWydVenue, WYD_LABEL_EN, WYD_LABEL_KO } from '@/features/passport/lib/wyd';
import { DocentPlayer } from '@/features/docent/components/DocentPlayer';
import { buildChapters } from '@/features/docent/lib/chapters';
import { getDocentScript } from '@/features/docent/data/scripts';
import { useDocentScripts } from '@/features/docent/hooks/use-docent-script';
import { buildDbChapters, pickIntro } from '@/features/docent/lib/db-chapters';
import { ContactCard } from '@/features/sites/components/ContactCard';
import { splitMassInfo } from '@/features/sites/lib/mass-info';
import { NearbyParishesCard } from '@/features/sites/components/NearbyParishesCard';
import { DirectionsCard } from '@/features/sites/components/DirectionsCard';
import { sizedImageUrl } from '@/shared/lib/image-url';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useNearbyFacilities } from '@/features/sites/hooks/use-nearby-tour';
import { WalkingCourseCard } from '@/features/sites/components/WalkingCourseCard';
import { useWalkingCoursesNear } from '@/features/sites/hooks/use-tour-extras';
import { NearbyCrowdingLabel } from '@/features/crowding/components/CrowdingLabel';
import { QuietDaysCard } from '@/features/crowding/components/QuietDaysCard';
import { GROUP_LABEL_KEY } from '@/features/sites/lib/nearby-facilities';
import {
  useLocalizedSites,
  useSite,
  useSitesInSameDiocese,
} from '@/features/sites/hooks/use-sites';
import { useSitePhoto } from '@/features/sites/hooks/use-featured-photos';
import { useTranslatedSite } from '@/features/sites/hooks/use-site-translation';
import { BackButton } from '@/shared/components/ui/BackButton';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ScrollHintRow } from '@/shared/components/ui/ScrollHintRow';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PhotoLightbox } from '@/shared/components/ui/PhotoLightbox';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { fillPlaceholders, SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { kakaoDirectionsUrl } from '@/shared/lib/geo';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes-guard';

/** 가는 김에 둘러볼 곳 — 레포츠·쇼핑은 도보권 밖으로 벗어나는 유형이라 뺀다(사장님 지적, 2026-09-17) */
const HIDDEN_FACILITY_GROUPS = new Set(['레포츠', '쇼핑']);

/** 순례 기록에 붙이는 사진 최대 장수(2026-09-17) — 일반 사진 추가(최대 5·10장)와는 다른 값 */
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
  } = useNearbyFacilities(site?.coordinates);
  const facilityGroups = facilityGroupsRaw.filter((g) => !HIDDEN_FACILITY_GROUPS.has(g.group));
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
  // 즐겨찾기 단추 옆 「기록하기」 — 순례 기록이 이 서비스의 핵심인데도 이야기·도슨트
  // 아래로 밀려 있어 접근하기 어렵다는 지적(사장님, 2026-09-20)으로 앵커를 만든다.
  const scrollToRecordSection = () => {
    document
      .getElementById('reviews-heading')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  // AI 가이드는 홈 상단에서 이리로 옮겼다 (2026-09-12) — 성지를 보다가 궁금할 때 묻는 자리다
  // 공식 사진이 없으면 순례자가 보내준(운영자 승인) 사진이 대표 자리를 채운다.
  // 훅이므로 이른 return 위에서 부른다.
  const sitePhoto = useSitePhoto(siteId, site?.imageUrl ?? null);
  const { data: isFavorited = false } = useIsFavorite(siteId);
  const toggleFavorite = useToggleFavorite(siteId ?? '');
  const { data: myStamp } = useMyStamp(siteId);
  const { data: myStamps = [] } = useMyStamps();
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const { data: visitNotes = [] } = useSiteNotes(siteId, reviewsOpen ? undefined : 6);
  const addStamp = useAddStamp(siteId ?? '');
  const updateStamp = useUpdateStamp();

  const [noteDraft, setNoteDraft] = useState('');
  // 방문일 — 기본값은 오늘(기록하는 날)이지만, 지난 방문을 나중에 적는 경우도 있어
  // 날짜 선택을 열어둔다(사장님 지적, 2026-09-20: "무조건 기록한 날짜로 고정이다").
  const [visitedOnDraft, setVisitedOnDraft] = useState(() => new Date().toISOString().slice(0, 10));
  // 기록 입력 아코디언 — 처음엔 펼쳐 두고, 「다음에요」를 누르면 접는다(2026-09-17).
  // 접어도 사라지지 않는다 — 줄만 남아서 다시 누르면 펼칠 수 있다.
  const [noteComposerOpen, setNoteComposerOpen] = useState(true);
  // 기록과 함께 올릴 사진 — 최대 3장(2026-09-17, 올리기 전 미리보기 방식)
  const [notePhotos, setNotePhotos] = useState<{ file: File; preview: string }[]>([]);
  const [notePhotoNotice, setNotePhotoNotice] = useState<string | null>(null);

  // 오디오 도슨트 — 현장조사 원고가 있으면 포인트별 투어, 없으면 소개·역사 챕터.
  // 훅(useMemo)이라 이른 return 위에서 부른다 — site 는 아직 없을 수 있어 옵셔널로 다룬다.
  //
  // useDocentPlayer 는 chapters 배열의 참조가 바뀌면 재생을 멈추고 처음으로 되감는다
  // (화면을 나가거나 성지가 바뀔 때 멈추기 위한 장치). buildChapters 를 매 렌더마다
  // 새로 부르면 이 페이지의 다른 상태(예: 방문 정보 아코디언)가 바뀔 때마다
  // 도슨트가 끊긴다 — T-004 완료 조건("아코디언을 펼치거나 접어도 재생이 끊기지
  // 않는다")을 만족하려면 여기서 참조를 고정해야 한다.
  // 2026-09-18 부터 원고는 DB(docent_scripts)가 기준. DB 에 그 성지의 투어가 없거나 아직 안 왔으면
  // 저장소 JSON → 소개·역사 순으로 폴백한다 (buildChapters 가 뒤 두 단계를 맡는다).
  const dbScripts = useDocentScripts(site?.id);
  const docentScript = getDocentScript(site?.id);
  const docentChapters = useMemo(
    () =>
      buildDbChapters(dbScripts, language) ??
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
      dbScripts,
      docentScript,
      language,
    ],
  );
  // 「소개글」 — 순교·신앙 역사 / 위치·지리 / 건축물 세 문단. 없으면 기존 description 한 줄을 그대로 보여준다.
  const docentIntro = useMemo(() => pickIntro(dbScripts, language), [dbScripts, language]);

  // 순례 사진 — 첫 기록을 남기면 자동으로 생기는 "내 기록"에 붙인다
  const uploadPhotos = useUploadStampPhotos(siteId ?? '');
  const deletePhoto = useDeleteStampPhoto(siteId ?? '');
  const reportNote = useReportNote(siteId ?? '');
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  // 사진 확대 모달 — 「내가 남긴」·「다른 순례자」 사진 둘 다 이 상태 하나를 같이 쓴다
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);

  // 내 기록 수정 — 「기록 모두 보기」 목록의 내 항목에서 바로 고친다(2026-09-20 사장님 지적:
  // "내가 남긴 한 줄"과 "기록 모두 보기"가 같은 내용을 중복해서 보여준다). 별도 카드를 두지
  // 않고, 목록에서 내 것만 골라 수정 단추를 붙인다.
  const [editingMyNote, setEditingMyNote] = useState(false);
  const [myNoteDraft, setMyNoteDraft] = useState('');
  const [myVisitedOnDraft, setMyVisitedOnDraft] = useState('');
  const startEditingMyNote = () => {
    setMyNoteDraft(myStamp?.note ?? '');
    setMyVisitedOnDraft((myStamp?.visitedOn ?? myStamp?.visitedAt ?? '').slice(0, 10));
    setEditingMyNote(true);
  };
  const isMyNoteDirty =
    editingMyNote &&
    (myNoteDraft !== (myStamp?.note ?? '') ||
      myVisitedOnDraft !== (myStamp?.visitedOn ?? myStamp?.visitedAt ?? '').slice(0, 10));
  useUnsavedChangesGuard(isMyNoteDirty);
  const handleUpdateMyNote = () => {
    if (!myStamp?.id) return;
    updateStamp.mutate(
      {
        stampId: myStamp.id,
        note: normalizeNote(myNoteDraft),
        ...(isVisitedOnAvailable() ? { visitedOn: myVisitedOnDraft || null } : {}),
      },
      { onSuccess: (result) => result.success && setEditingMyNote(false) },
    );
  };
  const handlePhotoPick = async (files: FileList | null) => {
    if (!files || !myStamp) return;
    const policy = photoPolicy();
    // 이미 있는 사진 뒤에 이어 붙인다 — 위치(position)가 겹치면 기존 사진을 덮어쓰므로
    // 새로 고른 만큼만 남은 자리에서 자른다(2026-09-20, 「바꾸기」 아닌 「추가」로 고침).
    const room = Math.max(0, policy.maxCount - myStamp.photos.length);
    const picked = Array.from(files).slice(0, room);
    if (files.length > room)
      window.alert(t('reviewPhotosMax').replace('{count}', String(policy.maxCount)));
    const photos = await Promise.all(picked.map((file) => shrinkPhoto(file, policy)));
    uploadPhotos.mutate({
      stampId: myStamp.stamped ? (myStamps.find((s) => s.siteId === siteId)?.stampId ?? '') : '',
      startPosition: myStamp.photos.length + 1,
      photos,
    });
  };
  const handleReport = (stampId: string) => {
    if (!window.confirm(t('reportConfirm'))) return;
    setReportedIds((prev) => new Set(prev).add(stampId));
    reportNote.mutate(stampId);
  };

  // 기록 입력 칸의 사진 — 올리기 전 미리보기 URL 은 메모리를 잡으므로 바뀔 때마다 놓아준다
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
   * 기록 저장 — 이 한 번의 호출이 "기록"(스탬프)도 함께 만든다(2026-09-17).
   * 예전엔 "스탬프 찍기" 버튼을 먼저 눌러야 기록을 쓸 수 있었다. 그 절차가
   * 이 화면의 유일한 "기록" 입구인데도 무겁게 느껴진다는 지적으로, 절차를 화면에
   * 드러내지 않고 기록 쓰기 한 번으로 합쳤다 — addStamp 자체는 그대로다
   * (처음 쓰면 새 기록을 만들고, 이미 있으면 한 줄만 갱신한다).
   */
  const handleSaveNote = () => {
    const note = normalizeNote(noteDraft);
    if (!note) return;
    addStamp.mutate(
      { note, visitedOn: isVisitedOnAvailable() ? visitedOnDraft : null },
      {
        onSuccess: async (result) => {
          if (!result.success) {
            if (result.error === 'UNAUTHENTICATED') {
              navigate(paths.login);
              return;
            }
            window.alert(t('saveFailedNote'));
            return;
          }
          // 기록과 같이 고른 사진이 있으면 이어서 올린다 — stamp 는 방금 생겼으므로
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
      },
    );
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
    view?.description && view.description !== site.description ? view.description : descriptionBody;

  return (
    // 상단바·하단 탭이 있는 AppLayout 안에서 뜬다(2026-09-17) — 아래 여백은 AppLayout 이 탭 높이만큼 준다.
    // 본문 폭은 홈과 같은 PageContainer(기본 1200px) 로 — 예전엔 이 화면만 max-w-3xl(768px) 라
    // PC 에서 유독 좌우 여백이 넓어 보였다(사장님 지적, 2026-09-17).
    <div className="min-h-page bg-white pb-12">
      {/* 사진 높이는 화면의 절반 — 상단바(60px)를 뺀 나머지에서 잰다 */}
      <div className="relative flex h-[min(55vh,520px)] w-full items-center justify-center overflow-hidden bg-app-bg">
        {heroPhoto.url ? (
          <>
            {/* 확대되며 나타나는 연출을 없앴다(사장님 지적, 2026-09-17) — 사진이 바로 보인다 */}
            <img
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

        {/* 화살표만 있는 전용 단추 대신 다른 화면과 같은 「← 뒤로」를 쓴다(사장님 지적,
            2026-09-19: "뒤로 버튼 종류가 두 가지로 보인다") — 사진 위라 onDark 로만 다르다. */}
        <BackButton variant="onDark" className="absolute left-5 top-5" />

        <div className="absolute right-5 top-5 flex items-center gap-2">
          {/* 기록이 이 서비스의 핵심 기능인데도 이야기·도슨트 아래로 밀려 접근하기 어렵다는
              지적(사장님, 2026-09-20)으로, 즐겨찾기 옆에 「기록으로 가기」 앵커를 둔다. */}
          <SquircleSurface
            as="button"
            type="button"
            onClick={scrollToRecordSection}
            borderColor="rgb(255 255 255 / 0.3)"
            className="flex min-h-11 items-center gap-1.5 bg-black/30 px-3 text-base font-bold text-white backdrop-blur-md transition-colors hover:bg-black/45"
          >
            <BookOpen size={18} aria-hidden />
            {t('siteRecordAnchor')}
          </SquircleSurface>
          {!SUBMISSION_MODE && (
            // 제출판은 본선 기능만 보이게 한다 — T-013
            <button
              onClick={handleToggleFavorite}
              disabled={toggleFavorite.isPending}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/30 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/45"
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
        </div>

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
            {/* 인근 밀집도 라벨 — 조회 중에는 분석 상태를, 완료되면 하·중·상을 표시한다 */}
            <NearbyCrowdingLabel site={site} labelMode="density" variant="onDark" />
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

      {/* 상단 라운드 처리를 없앴다(사장님 지적, 2026-09-17) — 사진 바로 아래가 흰 면으로
          깔끔하게 이어진다. margin-top 도 0으로 — 사진과 겹치지 않고 바로 이어진다(사장님 지적, 2026-09-18). */}
      <PageContainer className="relative z-10 mt-0 space-y-8 bg-white py-6">
        {/* 성지 이야기를 맨 위로 — 사진 다음에는 "여기가 어떤 곳인지" 이야기부터 읽고,
            미사 시간 같은 실용 정보는 그다음이 자연스럽다(사장님 지적, 2026-09-17).
            ⚠️ 이 순서는 재기획(2026-09-14) §4-1 이 정한 "방문 정보가 역사보다 위" 결정을
            뒤집는다 — 이번 지적을 그대로 따랐다. */}
        <section>
          <SectionHeading title={t('siteStory')} />
          {/* 인용문·역사 카드를 오디오 도슨트보다 위로(사장님 지적, 2026-09-19) — 무슨 이야기인지
              먼저 읽고, 더 듣고 싶으면 그 아래 도슨트로 이어진다. 장식용 아이콘도 함께 뺐다. */}
          <Card tone="panel" className="mb-6">
            {docentIntro ? (
              /* 「소개글」 — DB 도슨트 원고(docent_scripts). 순교·신앙 역사 / 위치·지리 / 건축물 세 문단,
                 문단마다 큰따옴표. 요청 언어가 없으면 영어 → 한국어(pickIntro). */
              <div className="mb-5 space-y-4 text-center" lang={docentIntro.language}>
                {docentIntro.paragraphs.map((paragraph, i) => (
                  <p key={i} className="font-display text-lg leading-relaxed text-brand-blue">
                    &ldquo;{paragraph}&rdquo;
                  </p>
                ))}
              </div>
            ) : (
              description && (
                <p className="mb-5 font-display text-lg leading-relaxed text-brand-blue">
                  &ldquo;{description}&rdquo;
                </p>
              )
            )}
            {(view?.history ?? site.history) && (
              <p className="text-base leading-relaxed text-app-text">
                {view?.history ?? site.history}
              </p>
            )}
          </Card>
          {/* 오디오 도슨트 — 박물관 오디오 가이드처럼 챕터를 골라 듣는다 */}
          <DocentPlayer chapters={docentChapters} language={language} />
        </section>

        <section aria-labelledby="visit-info-heading" className="space-y-8">
          <SectionHeading id="visit-info-heading" title={t('visitInfo')} />

          {/* 미사 시간 — 안내 책자 기준. 성지 사정에 따라 바뀔 수 있다.
              줄마다 카드를 나눠 한눈에 훑기 쉽게 하되, 라벨은 알약 배지가 아니라 원래의
              간결한 글자로(사장님 지적, 2026-09-18) — 알약 모양은 시각(時刻) 칩 쪽으로 옮겼다. */}
          {massInfo && massRows.length > 0 && (
            <section aria-labelledby="mass-heading">
              <SectionHeading as="h3" size="md" id="mass-heading" title={t('massTimesTitle')} />
              <SquircleSurface
                as="dl"
                borderColor="var(--color-app-border)"
                className="divide-y divide-app-border overflow-hidden bg-white"
              >
                {massRows.map((row) => (
                  <div key={row.label + row.value} className="p-5">
                    <dt className="mb-2 text-sm font-bold text-brand-blue">{row.label}</dt>
                    <dd className="text-base leading-loose text-app-text">
                      {row.value.split(/(\d{1,2}:\d{2})/g).map((part, i) =>
                        /^\d{1,2}:\d{2}$/.test(part) ? (
                          <span
                            key={i}
                            className="mx-0.5 inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 font-bold tabular-nums text-brand-blue"
                          >
                            {part}
                          </span>
                        ) : (
                          part
                        ),
                      )}
                    </dd>
                  </div>
                ))}
              </SquircleSurface>
            </section>
          )}

          {/* 한적한 날 — 집중률에 이름이 있는 성지만. 미사 시간 바로 아래가 "언제 갈까"를 정하는 자리다 */}
          <QuietDaysCard site={site} />

          {/* 공식 홈페이지·연락처 — 미사 시간·단체 순례는 성지에 직접 물어야 정확하다 */}
          <ContactCard site={site} />

          {/* 주소와 외부 지도 — 외국인 방문자를 기준으로 만든 화면 */}
          <DirectionsCard site={site} addressEnglish={view?.addressRomanized ?? null} />
        </section>

        {/* 「주변 정보」 절은 「둘러볼 곳」(TourAPI 편의시설)과 장소 기준 걷기길만 남긴다.
            성지가 알려주는 주변(DB 큐레이션)과 근처 행사(TourAPI)는 화면에서 뺐다. */}
        {!facilitiesLoading && !facilitiesError && facilityGroups.length === 0 && (
          <SquircleSurface
            as="p"
            borderColor="var(--color-app-border)"
            borderDashed
            className="bg-white p-5 text-base text-app-text-muted"
          >
            {t('siteNearbyTourismEmpty')}
          </SquircleSurface>
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
              <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 lg:-mx-5 lg:px-5">
                {[1, 2, 3].map((i) => (
                  <SquircleSurface
                    key={i}
                    className="h-64 w-44 flex-shrink-0 animate-pulse bg-app-bg"
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
                    <ScrollHintRow className="-mx-3 flex gap-4 px-3 lg:-mx-5 lg:px-5">
                      {spots.map((spot) => (
                        <SquircleSurface
                          as="a"
                          key={spot.contentid}
                          // 이름 검색은 정확한 장소로 안 이어질 때가 있었다(사장님 지적,
                          // 2026-09-17) — 좌표가 있으니 길찾기로 보낸다. 목적지가 곧 정답이다.
                          href={kakaoDirectionsUrl(
                            spot.title,
                            Number(spot.mapy),
                            Number(spot.mapx),
                          )}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${spot.title} 길찾기`}
                          borderColor="var(--color-app-border)"
                          borderClassName="transition-colors group-hover:stroke-brand-blue"
                          className="group w-44 flex-shrink-0 overflow-hidden bg-white text-left"
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
                            <h4 className="truncate text-base font-bold text-app-text group-hover:text-brand-blue">
                              {spot.title}
                            </h4>
                          </div>
                        </SquircleSurface>
                      ))}
                    </ScrollHintRow>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 장소를 기준으로 찾은 결과만 보여준다 — 근처에 걷기길이 없으면 빈 영역도 만들지 않는다. */}
        {walkingCourses.length > 0 && (
          <section>
            <SectionHeading title={t('routeNearbyTrails')} />
            <div className="space-y-3">
              {walkingCourses.slice(0, 3).map((course, index) => (
                <WalkingCourseCard key={course.crsIdx ?? index} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* 순례 기록 — "스탬프 찍기" 절차를 없앴다(2026-09-17 사장님 지적). 로그인한 사람은
            누구나 바로 한 줄을 남길 수 있고, 그 글이 이 성지의 첫 기록이면 스탬프(기록)가
            뒤에서 함께 남는다. 사진은 확대해서 가로로 넘겨 보고, 다른 사람 글에는 실명 대신
            일반 라벨("순례자")만 붙인다 — 누가 썼는지는 DB 조회 자체에 없다(비식별 설계 유지). */}
        <section aria-labelledby="reviews-heading" className="space-y-4">
          <SectionHeading
            id="reviews-heading"
            title={t('reviewsTitle').replace('{count}', String(visitNotes.length))}
            sub={t('pilgrimStoriesHint')}
          />

          {/* 아코디언 — 처음엔 펼쳐 두고, 「다음에요」를 누르면 접는다(2026-09-17).
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
                  <SquircleSurface
                    borderColor="var(--color-app-input-border)"
                    borderClassName="transition-colors group-focus-within:stroke-brand-blue group-focus-within:stroke-[6px]"
                    className="group mt-3 overflow-hidden bg-white"
                  >
                    <input
                      type="text"
                      name="note"
                      autoComplete="off"
                      maxLength={NOTE_MAX_LENGTH}
                      placeholder={t('notePlaceholder')}
                      aria-label={t('noteAriaLabel')}
                      className="min-h-12 w-full bg-transparent px-4 text-base text-app-text focus-visible:outline-none"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote();
                      }}
                    />
                  </SquircleSurface>
                  {/* 방문일 — 기본은 오늘(기록하는 날), 지난 방문을 나중에 적을 때는 고른다 */}
                  {isVisitedOnAvailable() && (
                    <label className="mt-3 block text-sm font-bold text-app-text-muted">
                      {t('recordsVisitedOn')}
                      <SquircleSurface
                        borderColor="var(--color-app-border)"
                        className="mt-1 overflow-hidden bg-white"
                      >
                        <input
                          type="date"
                          value={visitedOnDraft}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setVisitedOnDraft(e.target.value)}
                          className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text"
                        />
                      </SquircleSurface>
                    </label>
                  )}
                  {/* 사진 — 최대 3장. 기록 문장과 함께 한 번에 올라간다 */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notePhotos.map((p, i) => (
                      <div key={p.preview} className="relative">
                        <SquircleSurface className="h-16 w-16 overflow-hidden">
                          <img src={p.preview} alt="" className="h-full w-full object-cover" />
                        </SquircleSurface>
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
                      <SquircleSurface
                        as="label"
                        borderColor="color-mix(in srgb, var(--color-brand-blue) 40%, transparent)"
                        borderWidth={2}
                        borderDashed
                        className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 text-brand-blue transition-colors hover:bg-brand-soft"
                      >
                        <Camera size={16} aria-hidden />
                        <span className="text-xs font-bold">
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
                      </SquircleSurface>
                    )}
                  </div>
                  {notePhotoNotice && (
                    <p className="mt-1.5 text-xs text-app-text-muted">{notePhotoNotice}</p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-app-text-muted">
                    {t('reviewPublicNotice')}
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setNoteComposerOpen(false)}>
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

          {/* 「기록 모두 보기」 목록 — 내 것도 여기 함께 보인다. 내 것만 신고 대신 수정
              단추가 붙는다(2026-09-20 사장님 지적: "내가 남긴 한 줄"과 여기가 같은 내용을
              중복해서 보여줬다 — 별도 카드를 없애고 이 목록 하나로 합쳤다). */}
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
                {visitNotes.map((n) => {
                  const isMine = myStamp?.id != null && n.id === myStamp.id;

                  if (isMine && editingMyNote) {
                    return (
                      <li key={n.id} className="border-l-2 border-brand-blue/30 pl-3">
                        <label className="block text-sm font-bold text-app-text-muted">
                          {t('recordsMemo')}
                          <SquircleSurface
                            borderColor="var(--color-app-input-border)"
                            borderClassName="transition-colors group-focus-within:stroke-brand-blue group-focus-within:stroke-[6px]"
                            className="group mt-1 overflow-hidden bg-white"
                          >
                            <input
                              type="text"
                              maxLength={NOTE_MAX_LENGTH}
                              value={myNoteDraft}
                              onChange={(e) => setMyNoteDraft(e.target.value)}
                              className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text focus-visible:outline-none"
                            />
                          </SquircleSurface>
                        </label>
                        {isVisitedOnAvailable() && (
                          <label className="mt-3 block text-sm font-bold text-app-text-muted">
                            {t('recordsVisitedOn')}
                            <SquircleSurface
                              borderColor="var(--color-app-input-border)"
                              borderClassName="transition-colors group-focus-within:stroke-brand-blue group-focus-within:stroke-[6px]"
                              className="group mt-1 overflow-hidden bg-white"
                            >
                              <input
                                type="date"
                                value={myVisitedOnDraft}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setMyVisitedOnDraft(e.target.value)}
                                className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text"
                              />
                            </SquircleSurface>
                          </label>
                        )}
                        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                          {myStamp?.photos.map((photo, i) => (
                            <div key={photo.id} className="relative shrink-0">
                              <SquircleSurface
                                as="button"
                                type="button"
                                onClick={() =>
                                  setLightbox({
                                    photos: myStamp.photos.map((p) => p.url),
                                    index: i,
                                  })
                                }
                                aria-label={t('photoEnlarge')}
                                className="block h-24 w-24 overflow-hidden"
                              >
                                <img
                                  src={photo.url}
                                  alt={t('photoMineAlt')}
                                  className="h-full w-full object-cover"
                                />
                              </SquircleSurface>
                              <button
                                type="button"
                                onClick={() => deletePhoto.mutate(photo)}
                                disabled={deletePhoto.isPending}
                                aria-label={t('photoDelete')}
                                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {(myStamp?.photos.length ?? 0) < photoPolicy().maxCount && (
                            <SquircleSurface
                              as="label"
                              borderColor="color-mix(in srgb, var(--color-brand-blue) 50%, transparent)"
                              borderWidth={2}
                              borderDashed
                              className={`flex h-24 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 px-1 text-center text-brand-blue transition-colors hover:bg-brand-soft ${
                                uploadPhotos.isPending ? 'opacity-50' : ''
                              }`}
                            >
                              <Camera size={16} aria-hidden />
                              <span className="text-[0.625rem] font-bold leading-tight">
                                {uploadPhotos.isPending ? t('photoUploading') : t('photoAdd')}
                              </span>
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
                            </SquircleSurface>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdateMyNote}
                            disabled={updateStamp.isPending}
                          >
                            {t('recordsSave')}
                          </Button>
                          <Button
                            variant="neutral"
                            size="sm"
                            onClick={() => setEditingMyNote(false)}
                          >
                            {t('recordsCancel')}
                          </Button>
                        </div>
                      </li>
                    );
                  }

                  return (
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
                          {isMine ? t('noteMine') : t('pilgrimDefaultName')}
                        </span>
                      </div>
                      {n.photos.length > 0 && (
                        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
                          {n.photos.map((url, i) => (
                            <SquircleSurface
                              as="button"
                              key={url}
                              type="button"
                              onClick={() => setLightbox({ photos: n.photos, index: i })}
                              aria-label={t('photoEnlarge')}
                              className="block h-36 w-36 shrink-0 overflow-hidden"
                            >
                              <img
                                src={url}
                                alt={t('pilgrimPhotoAlt')}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </SquircleSurface>
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
                        {isMine ? (
                          <button
                            type="button"
                            onClick={startEditingMyNote}
                            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text"
                            aria-label={t('recordsEdit')}
                          >
                            <PenLine size={14} aria-hidden />
                            {t('recordsEdit')}
                          </button>
                        ) : (
                          // 운영자가 한 명뿐이라 신고 3건이면 자동으로 가려진다
                          <button
                            onClick={() => handleReport(n.id)}
                            disabled={reportedIds.has(n.id)}
                            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text disabled:opacity-40"
                            aria-label={t('reportAction')}
                          >
                            <Flag size={14} aria-hidden />
                            {reportedIds.has(n.id) ? t('reportedAction') : t('reportAction')}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
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
            <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 lg:-mx-5 lg:px-5">
              {nearbySites.map((nearby) => (
                <SquircleSurface
                  as={Link}
                  key={nearby.id}
                  to={paths.siteDetail(nearby.id)}
                  borderColor="var(--color-app-border)"
                  borderClassName="transition-colors group-hover:stroke-brand-blue"
                  className="group w-44 flex-shrink-0 overflow-hidden bg-white text-left"
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
                </SquircleSurface>
              ))}
            </div>
          </section>
        )}

        {/* 주변 본당·공소 — 「OO 교구의 다른 성지」 아래로 옮겼다(사장님 지적, 2026-09-17).
            성지끼리 비교가 끝난 다음에 볼 정보라 방문 정보보다 뒤, 화면 맨 끝이 자리다. */}
        <section className="pb-10">
          <NearbyParishesCard site={site} />
        </section>
      </PageContainer>

      <PhotoLightbox
        photos={lightbox?.photos ?? null}
        index={lightbox?.index ?? 0}
        onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
