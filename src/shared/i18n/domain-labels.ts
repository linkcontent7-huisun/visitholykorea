/**
 * DB 에 한국어로 저장된 값을 화면에서 옮기기 위한 대응표.
 *
 * 성지 분류(`category`)와 감성 태그(`emotion_tag`)는 우리가 직접 수집한 자체
 * 데이터라 값 자체가 한국어다. 그 값을 그대로 그리면 영어 모드에서
 * `#주교좌성당` 같은 한국어가 남는다(T-007 에서 실제로 그랬다).
 *
 * DB 값을 영어로 바꾸는 방법도 있지만, 그러면 208행과 시드·스크립트를 모두
 * 손대야 하고 한국인 운영자가 읽던 값이 사라진다. **저장은 한국어로 두고
 * 화면에서만 옮긴다.**
 *
 * 표에 없는 값(운영자가 새 분류를 넣는 경우)은 `undefined` 가 나오므로,
 * 부르는 쪽에서 원래 문자열을 그대로 쓰면 된다 — 화면이 비지 않는다.
 */

import type { Language, TranslationKey } from './dictionary';
import type { EmotionTag } from '@/shared/types/domain';

export const EMOTION_TAG_KEY: Record<EmotionTag, TranslationKey> = {
  위로: 'emotionComfort',
  새출발: 'emotionNewStart',
  평온: 'emotionCalm',
  치유: 'emotionHealing',
  감사: 'emotionGratitude',
};

export const CATEGORY_KEY: Record<string, TranslationKey> = {
  전체: 'categoryAll',
  순교성지: 'categoryMartyrdom',
  성당: 'categoryChurch',
  역사사적지: 'categoryHistoric',
  주교좌성당: 'categoryCathedral',
  순례길: 'categoryPilgrimRoute',
  교우촌: 'categoryVillage',
  // catholic_directory(본당·공소·피정의집 5,918건)의 값 — holy_sites 와 같은 표를 쓴다.
  본당: 'categoryParish',
  공소: 'categoryMission',
  피정의집: 'categoryRetreatHouse',
};

/** 분류·태그를 지금 언어로. 모르는 값은 원래 한국어를 그대로 돌려준다. */
export function localizeDomainValue(
  value: string,
  t: (key: TranslationKey) => string,
): string {
  const key = CATEGORY_KEY[value] ?? EMOTION_TAG_KEY[value as EmotionTag];
  return key ? t(key) : value;
}

/**
 * 시·도(`REGIONS`)와 교구명(`DIOCESES`, `holy_sites.region`)의 로마자 표기.
 *
 * 지명은 언어마다 다르게 옮기지 않고 로마자 표기를 그대로 쓰는 것이 국제
 * 관행이다("Seoul"은 영어·스페인어·프랑스어·포르투갈어·이탈리아어 어디서나
 * 같다) — 그래서 6개 국어 사전 대신 언어 하나짜리 맵으로 충분하다.
 * 표에 없는 값은 원문을 그대로 돌려준다(운영자가 새 지역을 넣어도 화면이 비지 않는다).
 */
const REGION_ROMANIZED: Record<string, string> = {
  서울: 'Seoul',
  부산: 'Busan',
  대구: 'Daegu',
  인천: 'Incheon',
  광주: 'Gwangju',
  대전: 'Daejeon',
  울산: 'Ulsan',
  세종: 'Sejong',
  경기: 'Gyeonggi',
  강원: 'Gangwon',
  충북: 'Chungbuk',
  충남: 'Chungnam',
  전북: 'Jeonbuk',
  전남: 'Jeonnam',
  경북: 'Gyeongbuk',
  경남: 'Gyeongnam',
  제주: 'Jeju',
  수원: 'Suwon',
  의정부: 'Uijeongbu',
  춘천: 'Chuncheon',
  원주: 'Wonju',
  청주: 'Cheongju',
  전주: 'Jeonju',
  안동: 'Andong',
  마산: 'Masan',
  기타: 'Other',
  전체: 'All',
};

/** 시·도·교구명을 지금 언어로. 한국어 모드거나 표에 없는 값은 원문 그대로. */
export function localizeRegionName(value: string, language: Language): string {
  if (language === 'ko') return value;
  return REGION_ROMANIZED[value] ?? value;
}

/** 붐빔 등급(`CrowdingLevel`)을 지금 언어로. 모르는 값은 원문 그대로. */
export const CROWDING_LEVEL_KEY: Record<string, TranslationKey> = {
  '아주 조용': 'crowdingLevelVeryQuiet',
  조용: 'crowdingLevelQuiet',
  보통: 'crowdingLevelNormal',
  붐빔: 'crowdingLevelBusy',
  '매우 붐빔': 'crowdingLevelVeryBusy',
};

export function localizeCrowdingLevel(value: string, t: (key: TranslationKey) => string): string {
  const key = CROWDING_LEVEL_KEY[value];
  return key ? t(key) : value;
}

/**
 * 스탬프 모티프(`resolveStampMotif`)의 표시 이름을 지금 언어로.
 * `motif.label` 자체는 한국어 원문이라 매핑은 `motif.id`(gothic·brick 등, 언어와
 * 무관한 고정 값) 기준으로 한다 — label 문자열을 키로 쓰면 오탈자 하나로 깨진다.
 */
export const STAMP_MOTIF_KEY: Record<string, TranslationKey> = {
  gothic: 'motifGothic',
  romanesque: 'motifRomanesque',
  brick: 'motifBrick',
  hanok: 'motifHanok',
  fortress: 'motifFortress',
  riverside: 'motifRiverside',
  pine: 'motifPine',
  kiln: 'motifKiln',
  monument: 'motifMonument',
  cathedral: 'categoryCathedral',
  historic: 'motifHistoric',
  path: 'categoryPilgrimRoute',
  cross: 'motifCross',
};

export function localizeMotifLabel(
  motifId: string,
  t: (key: TranslationKey) => string,
): string {
  const key = STAMP_MOTIF_KEY[motifId];
  return key ? t(key) : motifId;
}

/**
 * 순례 인증서 등급(`CERTIFICATE_LEVELS[].label`)의 표시 이름을 지금 언어로.
 * `label` 자체는 PDF 인증서·공유 카드에 그대로 찍히는 한국어 기록물이라 바꾸지
 * 않는다 — 화면에 보여줄 때만 이 매핑을 거친다.
 */
export const CERT_LEVEL_KEY: Record<string, TranslationKey> = {
  첫_순례자: 'certLevelFirst',
  순례_도보자: 'certLevelWalker',
  순례_순례자: 'certLevelDevoted',
  순례_구도자: 'certLevelSeeker',
  순례_완주자: 'certLevelFinisher',
};

export function localizeCertLevel(label: string, t: (key: TranslationKey) => string): string {
  const key = CERT_LEVEL_KEY[label.replace(/\s+/g, '_')];
  return key ? t(key) : label;
}
