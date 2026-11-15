// v3-8 포인트 — 미션을 하나씩 마칠 때마다 오른다. 이 브라우저 탭 안에서만 기억(sessionStorage)하고 서버로 보내지 않는다.
//  · 한 번만 오르는 미션(성수·십자성호, 봉헌초, 십자가의 길 각 처 …)은 키로 한 번만 센다
//  · 종 줄(종지기)은 점수를 받으면 3분 동안은 쳐도 소리만 나고 점수는 오르지 않는다
const KEY = 'vhk.points.v1';
export const BELL_COOLDOWN_MS = 3 * 60 * 1000;
export const PTS = { font: 20, candleGrotto: 30, candleAltar: 20, bell: 50, station: 10, allStations: 50 } as const;

interface Saved { total: number; done: string[]; bellAt: number }
export class Points {
  total = 0;
  private done = new Set<string>();
  private bellAt = 0;
  onChange: (total: number, gained: number) => void = () => {};
  constructor() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw) as Saved; this.total = s.total | 0; this.done = new Set(s.done); this.bellAt = s.bellAt || 0; }
    } catch { /* 저장소 없음 — 이번 화면에서만 센다 */ }
  }
  private save() { try { sessionStorage.setItem(KEY, JSON.stringify({ total: this.total, done: [...this.done], bellAt: this.bellAt } satisfies Saved)); } catch { /* 무시 */ } }
  has(key: string) { return this.done.has(key); }
  /** 한 번만 오르는 미션. 처음이면 true */
  award(key: string, pts: number): boolean {
    if (this.done.has(key)) return false;
    this.done.add(key); this.total += pts; this.save(); this.onChange(this.total, pts); return true;
  }
  /** 종지기 — 3분이 지났으면 점수를 주고 true, 아니면 false(소리만) */
  awardBell(): boolean {
    if (!this.bellReady()) return false;
    this.bellAt = Date.now(); this.total += PTS.bell; this.save(); this.onChange(this.total, PTS.bell); return true;
  }
  bellReady() { return Date.now() - this.bellAt >= BELL_COOLDOWN_MS; }
  bellWaitMs() { return Math.max(0, BELL_COOLDOWN_MS - (Date.now() - this.bellAt)); }
}
