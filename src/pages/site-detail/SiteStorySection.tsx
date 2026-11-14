import { useMemo } from 'react';
import { DocentPlayer } from '@/features/docent/components/DocentPlayer';
import { buildChapters } from '@/features/docent/lib/chapters';
import { getDocentScript } from '@/features/docent/data/scripts';
import { useDocentScripts } from '@/features/docent/hooks/use-docent-script';
import { buildDbChapters, pickIntro } from '@/features/docent/lib/db-chapters';
import { splitMassInfo } from '@/features/sites/lib/mass-info';
import type { TranslatedSiteView } from '@/features/sites/lib/translated-site';
import { Card } from '@/shared/components/ui/Card';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';

/** 「성지 이야기」 — 소개글·역사 카드와 오디오 도슨트 (#102 에서 페이지에서 떼어 냄) */
export function SiteStorySection({
  site,
  view,
}: {
  site: HolySite;
  view: TranslatedSiteView | null;
}) {
  const { language, t } = useSettings();

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
  const dbScripts = useDocentScripts(site.id);
  const docentScript = getDocentScript(site.id);
  const docentChapters = useMemo(
    () =>
      buildDbChapters(dbScripts, language) ??
      buildChapters(
        {
          name: view?.name ?? site.name,
          description: view?.description ?? site.description ?? null,
          history: view?.history ?? site.history ?? null,
        },
        docentScript,
        language,
      ),
    [
      view?.name,
      view?.description,
      view?.history,
      site.name,
      site.description,
      site.history,
      dbScripts,
      docentScript,
      language,
    ],
  );
  // 「소개글」 — 순교·신앙 역사 / 위치·지리 / 건축물 세 문단. 없으면 기존 description 한 줄을 그대로 보여준다.
  const docentIntro = useMemo(() => pickIntro(dbScripts, language), [dbScripts, language]);

  // 소개글 끝의 「▷ 미사 시간」 문단은 인용문에서 떼어 방문 정보 카드로 보낸다 (2026-09-13)
  const { body: descriptionBody } = splitMassInfo(site.description);
  /**
   * 인용문에 보여줄 소개글 — 번역이 실제로 있으면(view.description 이 원문과 다르면)
   * 그대로, 없어 한국어 원문으로 돌아온 것이면 위에서 미사 시간을 뗀 본문을 쓴다.
   * (버그 발견 2026-09-17: `view?.description ?? descriptionBody` 로 늘 원문을 먼저 봐서,
   * 한국어 화면에서 "▷ 미사 시간(...) — 주일: …" 원문이 인용문에 그대로 보이고 있었다.)
   */
  const description =
    view?.description && view.description !== site.description ? view.description : descriptionBody;

  return (
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
            {/* 참고한 자료 — 굿뉴스 성지 안내·교구 홈페이지처럼 주소가 있는 것만(T-032, 2026-09-21).
                    글은 우리가 다시 쓴 것이고, 무엇을 보고 썼는지 밝혀 신뢰를 얻는다. */}
            {docentIntro.sources.length > 0 && (
              <p className="text-xs leading-relaxed text-app-text-muted">
                {t('storySourcesLabel')}{' '}
                {docentIntro.sources.map((source, i) => (
                  <span key={source.url}>
                    {i > 0 && ' · '}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-app-border underline-offset-2 hover:text-brand-blue"
                    >
                      {source.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        ) : (
          description && (
            <p className="mb-5 font-display text-lg leading-relaxed text-brand-blue">
              &ldquo;{description}&rdquo;
            </p>
          )
        )}
        {(view?.history ?? site.history) && (
          <p className="text-base leading-relaxed text-app-text">{view?.history ?? site.history}</p>
        )}
      </Card>
      {/* 오디오 도슨트 — 박물관 오디오 가이드처럼 챕터를 골라 듣는다 */}
      <DocentPlayer chapters={docentChapters} language={language} />
    </section>
  );
}
