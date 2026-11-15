// 클라이언트와 서버가 함께 쓰는 공간 정의 — 서버는 이 목록 밖의 id 를 받지 않는다.

export type SpaceId = 'cathedral' | 'chapel';

export interface SpaceMeta {
  title: string;
  doors: string[];
  candles: string[];
  bells: string[];
  arts: string[];
  capacity: number;
  /** 메인 앱(visitholykorea.com) holy_sites.id — «성지 정보로 돌아가기» 대상. 없으면 메인 첫 화면 */
  siteId?: string;
}

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

export const SPACES: Record<SpaceId, SpaceMeta> = {
  cathedral: {
    title: '명동대성당 구내',
    doors: ['front'],
    candles: ids('c', 12),
    bells: ['tower'],
    arts: ['a0', 'a1'],
    capacity: 40,
    siteId: '4b4199cf-2236-4842-8996-38ee9d36e542',
  },
  chapel: {
    title: '언덕 위 경당',
    doors: [],
    candles: ids('k', 8),
    bells: [],
    arts: ids('b', 10),
    capacity: 30,
  },
};

/** 메인 앱의 해당 성지 상세 주소 */
export const siteHref = (id: SpaceId): string => (SPACES[id].siteId ? `/sites/${SPACES[id].siteId}` : '/');

export const isSpaceId = (v: unknown): v is SpaceId => v === 'cathedral' || v === 'chapel';

/** 봉헌초 지향 — 고르는 기도. 앞 여섯은 예전 방 서버도 아는 번호(순서를 바꾸지 않는다), 뒤 넷은 v3-6 추가 */
export const INTENTIONS = [
  '가족의 건강을 위하여',
  '세상의 평화를 위하여',
  '감사의 마음으로',
  '떠난 이를 기억하며',
  '새로운 시작을 위하여',
  '아픈 이들을 위하여',
  '시험·면접을 앞둔 이를 위하여',
  '한반도의 화해와 일치를 위하여',
  '가난하고 외로운 이들을 위하여',
  '사제·수도자 성소를 위하여',
];

/** 직접 쓴 기도(v3-6) — 길이 제한, 줄바꿈·제어문자 제거, 욕설·연락처 걸러내기. 서버와 클라이언트가 같은 규칙을 쓴다 */
export const CANDLE_TEXT_MAX = 40;
const BAD_WORDS = ['시발', '씨발', '병신', '개새', '좆', 'fuck', 'shit', '니애미', '느금'];
export function cleanCandleText(v: unknown): string {
  let s = String(v ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CANDLE_TEXT_MAX);
  if (/https?:\/\/|www\.|\d{3}[- ]?\d{3,4}[- ]?\d{4}/i.test(s)) return ''; // 주소·전화번호는 받지 않는다
  const low = s.toLowerCase();
  if (BAD_WORDS.some((w) => low.includes(w))) return '';
  return s;
}

/** 인사말 — 자유 채팅 대신 정해진 문구만 쓴다 */
export const GREETINGS = ['안녕하세요', '함께 둘러봐요', '이쪽으로 오세요', '정말 아름다워요', '평화를 빕니다', '감사합니다'];

export const REACTS = ['heart', 'clap', 'pray'] as const;
export type ReactKind = (typeof REACTS)[number];
export const REACT_LABEL: Record<ReactKind, string> = { heart: '마음', clap: '박수', pray: '기도' };

/** 봉헌초가 꺼지기까지의 시간 */
export const CANDLE_MS = 10 * 60 * 1000;

/** 십자가의 길 14처(한국 천주교 통용 제목) — v3-7 안내 걷기·표지 제목에 쓴다 */
export const STATION_NAMES = [
  '예수님께서 사형 선고 받으심', '예수님께서 십자가를 지심', '예수님께서 기력이 떨어져 넘어지심', '예수님께서 성모님을 만나심',
  '시몬이 예수님을 도와 십자가를 짐', '베로니카가 수건으로 예수님의 얼굴을 닦아 드림', '기력이 다하신 예수님께서 두 번째 넘어지심',
  '예수님께서 예루살렘 부인들을 위로하심', '예수님께서 세 번째 넘어지심', '예수님께서 옷 벗김 당하심',
  '예수님께서 십자가에 못 박히심', '예수님께서 십자가 위에서 돌아가심', '제자들이 예수님의 시신을 십자가에서 내림', '예수님께서 무덤에 묻히심',
  '예수님의 부활', // 명동성당 십자가의 길은 14처에 제15처 부활이 더해져 있다(최종태 작 청동 부조, 1989)
];
