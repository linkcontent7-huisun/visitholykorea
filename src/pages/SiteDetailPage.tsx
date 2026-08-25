import {
  Check,
  ChevronLeft,
  Compass,
  Heart,
  History,
  MapPin,
  PartyPopper,
  Share2,
  Stamp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getLiturgicalEvent } from '@/features/passport/lib/liturgical-calendar';
import { generateShareCard, shareOrDownloadCard } from '@/features/passport/lib/share-card';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { useAddStamp, useMyStamp, useSiteNotes } from '@/features/passport/hooks/use-stamps';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { ContactCard } from '@/features/sites/components/ContactCard';
import { NearbyParishesCard } from '@/features/sites/components/NearbyParishesCard';
import { DirectionsCard } from '@/features/sites/components/DirectionsCard';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { VisitEtiquette } from '@/features/sites/components/VisitEtiquette';
import { useNearbyAttractions, useNearbyFestivals } from '@/features/sites/hooks/use-nearby-tour';
import { useSite, useSitesInSameDiocese } from '@/features/sites/hooks/use-sites';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useSettings } from '@/shared/i18n/use-settings';
import { kakaoPlaceUrl } from '@/shared/lib/geo';

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const { data: site, isLoading } = useSite(siteId);
  const { data: nearbySites = [] } = useSitesInSameDiocese(site?.region, siteId);
  const { data: attractions = [], isFetching: attractionsLoading } = useNearbyAttractions(
    site?.coordinates,
  );
  const { data: festivals = [], isFetching: festivalsLoading } = useNearbyFestivals(
    site?.coordinates,
  );
  const { data: isFavorited = false } = useIsFavorite(siteId);
  const toggleFavorite = useToggleFavorite(siteId ?? '');
  const { data: myStamp } = useMyStamp(siteId);
  const stamped = myStamp?.stamped ?? false;
  const { data: visitNotes = [] } = useSiteNotes(siteId);
  const addStamp = useAddStamp(siteId ?? '');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  // "남길게요"를 누르기 전까지는 입력창을 강요하지 않는다
  const [noteDismissed, setNoteDismissed] = useState(false);

  // 오늘 찍으면 어떤 한정판 스탬프가 되는지 미리 보여준다.
  const todayLiturgical = getLiturgicalEvent();

  // 다른 성지로 이동하거나 화면을 나가면 읽던 음성을 멈춘다.
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, [siteId]);

  const toggleSpeech = () => {
    if (!site) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = [site.name, site.description, site.history].filter(Boolean).join('. ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

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
        imageUrl: site.imageUrl,
        visitedAt: new Date(),
        liturgical: todayLiturgical,
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

  return (
    <div className={`mx-auto min-h-screen ${widthClass} bg-white pb-32`}>
      <div className="relative flex h-[55vh] w-full items-center justify-center overflow-hidden bg-app-bg">
        {site.imageUrl ? (
          <>
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10 }}
              src={site.imageUrl}
              alt={site.name}
              className="h-full w-full object-cover"
            />
            {/* CC 계열 라이선스는 출처 표기가 의무다 — 출처가 기록된 사진에만 붙는다 */}
            {site.imageSource && (
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
          <h1 className="mb-4 mt-3 text-4xl font-extrabold leading-tight tracking-tight">
            {site.name}
          </h1>
          <p className="mb-4 flex items-center gap-2 text-sm font-medium opacity-90">
            <MapPin size={16} className="text-brand-violet" />
            {site.location}
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
            {/* 고령 순례자를 위한 음성 안내. 브라우저 내장 TTS라 별도 비용이 없다. */}
            <button
              onClick={toggleSpeech}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                isSpeaking
                  ? 'border-brand-violet bg-brand-violet text-white'
                  : 'border-app-border bg-app-bg text-app-text-muted'
              }`}
              id="tts-toggle"
              aria-label={isSpeaking ? '읽기 중지' : '성지 이야기 읽어주기'}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
          <div className="relative overflow-hidden rounded-[40px] border border-brand-blue/5 bg-brand-blue/[0.03] p-8">
            <History
              size={100}
              className="absolute -bottom-6 -right-6 rotate-12 text-brand-blue/5"
            />
            {site.description && (
              <p className="relative z-10 mb-6 text-lg font-bold italic leading-snug tracking-tight text-brand-blue/90">
                &ldquo;{site.description}&rdquo;
              </p>
            )}
            {site.history && (
              <p className="relative z-10 text-[15px] font-medium leading-relaxed text-app-text-muted">
                {site.history}
              </p>
            )}
          </div>
        </section>

        {/* 주변 관광지 — TourAPI 실시간 조회 (저장하지 않는다) */}
        {(attractionsLoading || attractions.length > 0) && (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
              <h2 className="text-xl font-extrabold tracking-tight text-app-text">주변 정보</h2>
              <span className="text-[10px] font-bold text-app-text-muted">
                실시간 · 한국관광공사
              </span>
            </div>
            <div className="no-scrollbar -mx-8 flex gap-4 overflow-x-auto px-8">
              {attractionsLoading
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-64 w-44 flex-shrink-0 animate-pulse rounded-[32px] bg-app-bg"
                    />
                  ))
                : attractions.map((spot) => (
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
          {!stamped && (
            <p className="text-center text-[11px] font-bold text-app-text-muted">
              오늘 찍으면{' '}
              <span className={todayLiturgical.colorClass.text}>
                {todayLiturgical.emoji} {todayLiturgical.label}
              </span>{' '}
              한정판 스탬프예요
            </p>
          )}

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
            <p className="mt-1 text-xs leading-relaxed text-app-text-muted">
              한 줄만 남겨주세요. 다음 순례자가 조용한 때를 고르는 데 도움이 됩니다.
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

        {myStamp?.note && (
          <div className="rounded-[20px] border border-app-border bg-white p-5">
            <p className="text-xs font-bold text-app-text-muted">내가 남긴 한 줄</p>
            <p className="mt-2 text-sm leading-relaxed text-app-text">
              &ldquo;{myStamp.note}&rdquo;
            </p>
          </div>
        )}

        {/* 다녀온 사람의 한 줄 — 추정 지수를 사람의 증언이 보정한다 */}
        {visitNotes.length > 0 && (
          <div className="rounded-[20px] border border-app-border bg-white p-5">
            <p className="text-sm font-bold text-app-text">다녀온 사람의 한 줄</p>
            <ul className="mt-3 space-y-3">
              {visitNotes.map((n, i) => (
                <li key={`${n.visitedAt}-${i}`} className="border-l-2 border-brand-violet/30 pl-3">
                  <p className="text-sm leading-relaxed text-app-text">&ldquo;{n.note}&rdquo;</p>
                  <p className="mt-1 text-xs text-app-text-muted">
                    {new Date(n.visitedAt).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}{' '}
                    방문
                  </p>
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
