/**
 * 성지 스탬프 모티프 — "성지 이모티콘" 시스템.
 *
 * 산티아고 순례길의 세요(sello)가 사랑받는 이유는 도장마다 그 장소의 얼굴이
 * 담겨 있어서다. 여기서는 성지의 실제 건축·지형 유형을 본뜬 선화(線畵) 도장을
 * 만든다 — 명동은 고딕 쌍탑, 약현은 벽돌 단탑, 해미읍성은 성곽, 배론은 토굴.
 *
 * 원칙: **사실이 확인된 성지만 이름으로 매핑한다.** 건축 양식을 모르는 곳에
 * 고딕 성당 도장을 찍으면 그 자체가 더미 데이터다(더미 금지 원칙). 확인 안 된
 * 곳은 분류(순교성지·주교좌성당…)의 상징 도장으로 폴백한다.
 *
 * path 데이터는 viewBox 0 0 100 100 기준이라 React SVG 와 Canvas(Path2D)
 * 양쪽에서 같은 그림을 그린다 — 여권 화면과 공유 카드의 도장이 항상 같다.
 */

export interface MotifPath {
  d: string;
  /** 선 굵기. 기본 4. */
  width?: number;
}

export interface StampMotif {
  id: string;
  /** 여권·카드에 붙는 짧은 이름 (예: "고딕 대성당") */
  label: string;
  paths: MotifPath[];
}

const MOTIFS = {
  gothic: {
    id: 'gothic',
    label: '고딕 성당',
    paths: [
      { d: 'M18 88 V40 L26 18 L34 40 V88' },
      { d: 'M66 88 V40 L74 18 L82 40 V88' },
      { d: 'M34 62 L50 48 L66 62' },
      { d: 'M43 72 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', width: 3 },
      { d: 'M50 48 V36 M45 41 H55', width: 3 },
      { d: 'M14 88 H86' },
    ],
  },
  romanesque: {
    id: 'romanesque',
    label: '로마네스크 성당',
    paths: [
      { d: 'M32 52 a18 18 0 0 1 36 0' },
      { d: 'M32 52 V88 M68 52 V88' },
      { d: 'M50 34 V22 M45 27 H55', width: 3 },
      { d: 'M44 88 v-12 a6 6 0 0 1 12 0 v12', width: 3 },
      { d: 'M32 68 H18 V88 M68 68 H82 V88' },
      { d: 'M14 88 H86' },
    ],
  },
  brick: {
    id: 'brick',
    label: '벽돌 성당',
    paths: [
      { d: 'M22 88 V38 L30 22 L38 38 V88' },
      { d: 'M30 22 V12 M25 17 H35', width: 3 },
      { d: 'M38 60 L58 46 L78 60 V88' },
      { d: 'M46 88 v-10 a5 5 0 0 1 10 0 v10', width: 3 },
      { d: 'M64 76 v-6 a4 4 0 0 1 8 0 v6', width: 3 },
      { d: 'M14 88 H86' },
    ],
  },
  hanok: {
    id: 'hanok',
    label: '한옥 성당',
    paths: [
      { d: 'M12 54 Q30 40 50 38 Q70 40 88 54' },
      { d: 'M30 44 H70', width: 3 },
      { d: 'M50 38 V26 M45 31 H55', width: 3 },
      { d: 'M28 56 V88 M72 56 V88' },
      { d: 'M44 88 V66 H56 V88', width: 3 },
      { d: 'M14 88 H86' },
    ],
  },
  fortress: {
    id: 'fortress',
    label: '읍성',
    paths: [
      { d: 'M14 88 V62 H20 V56 H28 V62 H36 V56 H44 V62 H56 V56 H64 V62 H72 V56 H80 V62 H86 V88' },
      { d: 'M42 88 v-14 a8 8 0 0 1 16 0 v14', width: 3 },
      { d: 'M30 50 Q50 38 70 50' },
      { d: 'M36 56 V50 M64 56 V50', width: 3 },
    ],
  },
  riverside: {
    id: 'riverside',
    label: '물가 순교터',
    paths: [
      { d: 'M16 88 V56 Q20 44 34 40 H44 V88' },
      { d: 'M34 40 V22 M27 29 H41', width: 3 },
      { d: 'M52 74 q6 -6 12 0 t12 0 t12 0', width: 3 },
      { d: 'M52 84 q6 -6 12 0 t12 0 t12 0', width: 3 },
    ],
  },
  pine: {
    id: 'pine',
    label: '솔숲 생가',
    paths: [
      { d: 'M28 88 V44' },
      { d: 'M28 48 L14 54 M28 48 L42 54', width: 3 },
      { d: 'M28 38 L17 44 M28 38 L39 44', width: 3 },
      { d: 'M28 30 L20 35 M28 30 L36 35', width: 3 },
      { d: 'M28 30 V24', width: 3 },
      { d: 'M52 62 a18 12 0 0 1 36 0' },
      { d: 'M54 62 V88 M86 62 V88' },
      { d: 'M66 88 V72 H76 V88', width: 3 },
      { d: 'M14 88 H92' },
    ],
  },
  kiln: {
    id: 'kiln',
    label: '토굴·가마터',
    paths: [
      { d: 'M18 88 v-20 a16 16 0 0 1 32 0 v20' },
      { d: 'M26 88 v-14 a8 8 0 0 1 16 0 v14', width: 3 },
      { d: 'M34 44 V34 M29 39 H39', width: 3 },
      { d: 'M62 52 Q56 58 56 68 Q56 82 68 84 Q80 82 80 68 Q80 58 74 52' },
      { d: 'M62 52 Q68 48 74 52', width: 3 },
      { d: 'M14 88 H86' },
    ],
  },
  monument: {
    id: 'monument',
    label: '순교 기념비',
    paths: [
      { d: 'M44 88 V34 L50 24 L56 34 V88' },
      { d: 'M50 24 V12 M45 17 H55', width: 3 },
      { d: 'M20 84 Q26 66 36 56', width: 3 },
      { d: 'M24 74 q-8 -2 -12 -8 M24 74 q2 -8 8 -12', width: 3 },
      { d: 'M30 64 q-8 -3 -10 -9 M30 64 q3 -8 9 -11', width: 3 },
      { d: 'M16 88 H84' },
    ],
  },
  cathedral: {
    id: 'cathedral',
    label: '주교좌성당',
    paths: [
      { d: 'M28 88 V46 L50 30 L72 46 V88' },
      { d: 'M50 30 V18 M45 23 H55', width: 3 },
      { d: 'M43 56 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', width: 3 },
      { d: 'M44 88 v-12 a6 6 0 0 1 12 0 v12', width: 3 },
      { d: 'M14 88 H86' },
    ],
  },
  historic: {
    id: 'historic',
    label: '사적지',
    paths: [
      { d: 'M38 88 V42 a12 10 0 0 1 24 0 V88' },
      { d: 'M50 50 V60 M46 55 H54', width: 3 },
      { d: 'M50 66 V76', width: 3 },
      { d: 'M30 88 H70' },
      { d: 'M20 88 H80' },
    ],
  },
  path: {
    id: 'path',
    label: '순례길',
    paths: [
      { d: 'M30 88 Q54 68 46 48 Q42 38 58 26' },
      { d: 'M50 88 Q70 70 60 50 Q56 40 70 30' },
      { d: 'M64 26 V12 M58 18 H70', width: 3 },
    ],
  },
  cross: {
    id: 'cross',
    label: '성지',
    paths: [
      { d: 'M24 50 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0' },
      { d: 'M50 32 V72 M38 46 H62' },
    ],
  },
} satisfies Record<string, StampMotif>;

type MotifId = keyof typeof MOTIFS;

/**
 * 건축·지형이 문서로 확인된 성지의 이름 → 모티프 매핑.
 * 앞에서부터 첫 일치를 쓴다 — '해미읍성'이 '해미'보다 먼저 와야 하는 식의
 * 순서 의존이 있으므로 함부로 정렬하지 말 것.
 */
const NAME_MOTIFS: ReadonlyArray<readonly [string, MotifId]> = [
  ['해미읍성', 'fortress'],
  ['명동', 'gothic'], // 명동대성당 — 한국 최초의 고딕 대성당
  ['계산', 'gothic'], // 대구 계산주교좌대성당 — 고딕
  ['공세리', 'gothic'], // 공세리성당 — 고딕
  ['약현', 'brick'], // 약현성당 — 한국 최초의 벽돌 성당
  ['풍수원', 'brick'], // 풍수원성당 — 강원 최초의 벽돌 성당
  ['전동', 'romanesque'], // 전주 전동성당 — 로마네스크·비잔틴
  ['되재', 'hanok'], // 되재성당 — 한옥 성당
  ['나바위', 'hanok'], // 나바위성당 — 한옥·양옥 절충
  ['절두산', 'riverside'], // 한강가 절벽의 순교터
  ['갈매못', 'riverside'], // 바닷가 순교터
  ['솔뫼', 'pine'], // 솔뫼 = 소나무 숲 언덕, 김대건 신부 생가
  ['배론', 'kiln'], // 옹기 가마터·토굴 신학당
];

/** 분류별 기본 상징. 건축을 모르는 성지에 사실 아닌 건물을 그리지 않기 위한 폴백. */
const CATEGORY_MOTIFS: Record<string, MotifId> = {
  순교성지: 'monument',
  주교좌성당: 'cathedral',
  역사사적지: 'historic',
  순례길: 'path',
};

/** 성지 이름·분류로 스탬프 모티프를 정한다. 항상 무언가를 반환한다. */
export function resolveStampMotif(siteName: string, category: string | null): StampMotif {
  for (const [pattern, motifId] of NAME_MOTIFS) {
    if (siteName.includes(pattern)) return MOTIFS[motifId];
  }
  const categoryMotif = category ? CATEGORY_MOTIFS[category] : undefined;
  return categoryMotif ? MOTIFS[categoryMotif] : MOTIFS.cross;
}

/**
 * Canvas 에 모티프를 그린다 (공유 카드용).
 * (x, y)가 좌상단, size 가 한 변이다. 선 색만 받고 배경은 호출부 책임.
 */
export function drawStampMotif(
  ctx: CanvasRenderingContext2D,
  motif: StampMotif,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of motif.paths) {
    ctx.lineWidth = p.width ?? 4;
    ctx.stroke(new Path2D(p.d));
  }
  ctx.restore();
}
