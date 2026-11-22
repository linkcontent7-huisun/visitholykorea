// 순례 기록을 기기에 읽고 쓰는 곳 — 한 군데로 모아 둔다.
// 지금은 수호천사의 빛만 'vhk-guardian-lights-v1' 에 둔다. 한복 꾸미기와 한 기록('vhk-pilgrim-v1' { days, lights, dress })으로
// 묶는 안(기획자료/3D-계획/성지-작업/2026-11-22-한복-꾸미기-설계.md)은 사장님 답 뒤에 정한다 — 그때 이 파일만 고치면 된다.
// 저장 이름은 아직 바꾸지 않는다(팀장 11/22).

export interface StoredLight { shape: number; color: string; at: string; seed?: number }
interface Saved { lights: StoredLight[] }

export const LIGHTS_KEY = 'vhk-guardian-lights-v1';

/** 기기의 현지 날짜(예: 한국 시간). toISOString() 은 세계 표준시라 한국 오전 9시 전이 전날로 세어졌다(2026-11-22 고침) */
export function localDay(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function loadLights(): StoredLight[] {
  try {
    const s = JSON.parse(globalThis.localStorage?.getItem(LIGHTS_KEY) || 'null') as Saved | null;
    if (s && Array.isArray(s.lights)) return s.lights;
  } catch { /* 저장소 없음 */ }
  return [];
}

export function saveLights(lights: StoredLight[]): void {
  try { globalThis.localStorage?.setItem(LIGHTS_KEY, JSON.stringify({ lights } satisfies Saved)); } catch { /* 무시 */ }
}

/** 오늘(현지 날짜) 이미 받은 빛 수 */
export function receivedToday(lights: StoredLight[], now: Date = new Date()): number {
  const today = localDay(now);
  return lights.filter((l) => l.at === today).length;
}
