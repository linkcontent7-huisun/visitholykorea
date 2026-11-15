import { Room, type Client } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { SPACES, isSpaceId, INTENTIONS, GREETINGS, REACTS, CANDLE_MS, cleanCandleText, type SpaceId, type SpaceMeta } from '../shared/spaces.ts';

export class Visitor extends Schema {
  @type('string') nick = '';
  @type('string') color = '#8899aa';
  @type('float32') x = 0;
  @type('float32') y = 0;
  @type('float32') z = 0;
  @type('float32') yaw = 0;
  @type('boolean') sit = false;
}

export class Candle extends Schema {
  @type('boolean') lit = false;
  @type('uint8') phrase = 0;
  @type('string') by = '';
  @type('float64') at = 0;
  /** v3-6: 직접 쓴 기도(비면 phrase 의 정해진 문구) */
  @type('string') text = '';
}

export class SpaceState extends Schema {
  @type('string') spaceId = '';
  @type({ map: Visitor }) visitors = new MapSchema<Visitor>();
  @type({ map: 'boolean' }) doors = new MapSchema<boolean>();
  @type({ map: Candle }) candles = new MapSchema<Candle>();
  @type({ map: 'uint16' }) reacts = new MapSchema<number>();
}

const COLORS = ['#c0392b', '#2471a3', '#1e8449', '#b9770e', '#7d3c98', '#117a65', '#a04000', '#2e4053', '#922b21', '#1f618d'];

const num = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null;

/** 별칭만 받는다 — 글자 · 숫자 · 공백 · _ - 만 남기고 12자로 자른다 */
export function cleanNick(v: unknown): string {
  const s = String(v ?? '').normalize('NFC').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 12);
  return s || `순례자${Math.floor(1000 + Math.random() * 9000)}`;
}

export class SpaceRoom extends Room<{ state: SpaceState }> {
  maxClients = 40;
  patchRate = 100; // 10Hz

  private meta!: SpaceMeta;
  private lastAt = new Map<string, Map<string, number>>();
  private bellAt = 0;

  /** 같은 사람이 같은 동작을 너무 자주 보내지 못하게 한다 */
  private allow(c: Client, kind: string, ms: number): boolean {
    let m = this.lastAt.get(c.sessionId);
    if (!m) this.lastAt.set(c.sessionId, (m = new Map()));
    const now = Date.now();
    if (now - (m.get(kind) ?? 0) < ms) return false;
    m.set(kind, now);
    return true;
  }

  onCreate(options: { spaceId?: unknown }) {
    if (!isSpaceId(options?.spaceId)) throw new Error('unknown space');
    const id: SpaceId = options.spaceId;
    this.meta = SPACES[id];
    this.maxClients = this.meta.capacity;

    const st = new SpaceState();
    st.spaceId = id;
    for (const d of this.meta.doors) st.doors.set(d, false);
    for (const c of this.meta.candles) st.candles.set(c, new Candle());
    this.setState(st);

    // 봉헌초는 10분 뒤 꺼진다
    this.clock.setInterval(() => {
      const now = Date.now();
      this.state.candles.forEach((c) => {
        if (c.lit && now - c.at > CANDLE_MS) { c.lit = false; c.by = ''; c.text = ''; }
      });
    }, 15_000);

    this.onMessage('move', (c, m: any) => {
      if (!this.allow(c, 'move', 60)) return;
      const v = this.state.visitors.get(c.sessionId);
      const x = num(m?.x, -200, 200), y = num(m?.y, -5, 60), z = num(m?.z, -200, 200), yaw = num(m?.yaw, -100, 100);
      if (!v || x === null || y === null || z === null || yaw === null) return;
      v.x = x; v.y = y; v.z = z; v.yaw = yaw;
      v.sit = m?.sit === true;
    });

    this.onMessage('door', (c, m: any) => {
      if (!this.allow(c, 'door', 600)) return;
      const id = String(m?.id ?? '');
      if (!this.meta.doors.includes(id)) return;
      this.state.doors.set(id, !this.state.doors.get(id));
    });

    this.onMessage('candle', (c, m: any) => {
      if (!this.allow(c, 'candle', 1500)) return;
      const id = String(m?.id ?? '');
      const phrase = num(m?.phrase, 0, INTENTIONS.length - 1);
      const cd = this.state.candles.get(id);
      if (!cd || cd.lit || phrase === null) return;
      cd.lit = true; cd.phrase = Math.round(phrase); cd.at = Date.now();
      cd.by = this.state.visitors.get(c.sessionId)?.nick ?? '';
      cd.text = cleanCandleText(m?.text); // 직접 쓴 기도(v3-6) — 없거나 걸러지면 빈 문자열
    });

    this.onMessage('bell', (c, m: any) => {
      const id = String(m?.id ?? '');
      if (!this.meta.bells.includes(id)) return;
      const now = Date.now();
      if (now - this.bellAt < 5000 || !this.allow(c, 'bell', 5000)) return; // 방 전체 5초에 한 번
      this.bellAt = now;
      this.broadcast('bell', { id, from: c.sessionId });
    });

    this.onMessage('react', (c, m: any) => {
      if (!this.allow(c, 'react', 400)) return;
      const art = String(m?.art ?? ''), kind = String(m?.kind ?? '');
      if (!this.meta.arts.includes(art) || !(REACTS as readonly string[]).includes(kind)) return;
      const key = `${art}:${kind}`;
      this.state.reacts.set(key, Math.min(65535, (this.state.reacts.get(key) ?? 0) + 1));
      this.broadcast('react', { art, kind, from: c.sessionId });
    });

    this.onMessage('say', (c, m: any) => {
      if (!this.allow(c, 'say', 2000)) return;
      const idx = num(m?.idx, 0, GREETINGS.length - 1);
      if (idx === null) return;
      this.broadcast('say', { from: c.sessionId, idx: Math.round(idx) });
    });
  }

  onJoin(c: Client, options?: { nick?: unknown }) {
    const v = new Visitor();
    v.nick = cleanNick(options?.nick);
    v.color = COLORS[this.state.visitors.size % COLORS.length];
    this.state.visitors.set(c.sessionId, v);
  }

  onLeave(c: Client) {
    this.state.visitors.delete(c.sessionId);
    this.lastAt.delete(c.sessionId);
  }
}
