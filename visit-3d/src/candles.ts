// 저장되는 봉헌초 (2026-11-09 F2) — 메인 앱 Supabase 의 RPC `light_candle` · `candle_summary` 를 부른다.
//
// · 로그인 세션은 메인 앱(visitholykorea.com)과 같은 주소일 때만 함께 쓴다(rewrite 로 /visit/ 아래에 붙어 있어서
//   localStorage 의 Supabase 세션이 그대로 보인다). 3D 전용 주소(vercel.app)에서는 늘 비로그인으로 동작한다.
// · 메인 앱과 세션을 두고 다투지 않도록 이쪽에서는 토큰 자동 갱신을 끈다.
// · 표나 함수가 아직 없거나(마이그레이션 전) 접속이 안 되면 null 을 돌려주고, 3D 는 예전처럼 「그 자리에서만」 켠다.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface SavedCandle {
  intention: number;
  display_name: string;
  country: string | null;
  lit_at: string;
  expires_at: string;
  mine: boolean;
}
export interface CandleSummary {
  total: number;
  countries: number;
  recent: SavedCandle[];
  my_expires_at: string | null;
}
export type LightResult = 'ok' | 'login_required' | 'daily_limit' | 'error';

let client: SupabaseClient | null = null;
function sb(): SupabaseClient | null {
  if (!URL_ || !KEY) return null;
  client ??= createClient(URL_, KEY, {
    auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** 이 주소에서 로그인 세션을 메인 앱과 함께 쓸 수 있는가 */
export const sharesMainSession = /(^|\.)visitholykorea\.com$/.test(location.hostname);

export async function isLoggedIn(): Promise<boolean> {
  const c = sb();
  if (!c) return false;
  try {
    const { data } = await c.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

export async function fetchSummary(siteId: string): Promise<CandleSummary | null> {
  const c = sb();
  if (!c) return null;
  const { data, error } = await c.rpc('candle_summary', { p_site_id: siteId });
  if (error) { console.warn('[candles] 집계를 불러오지 못했다', error.message); return null; }
  return data as CandleSummary;
}

export async function lightCandle(siteId: string, space: string, intention: number, name: string, country: string | null): Promise<LightResult> {
  const c = sb();
  if (!c) return 'error';
  const { error } = await c.rpc('light_candle', {
    p_site_id: siteId, p_space: space, p_intention: intention, p_display_name: name, p_country: country,
  });
  if (!error) return 'ok';
  if (/login_required/.test(error.message)) return 'login_required';
  if (/daily_limit/.test(error.message)) return 'daily_limit';
  console.warn('[candles] 초를 저장하지 못했다', error.message);
  return 'error';
}

/** 브라우저 언어의 지역(예: pt-BR → BR). 묻지 않고 추정만 한다 — 없으면 null */
export function guessCountry(): string | null {
  const tag = navigator.languages?.[0] ?? navigator.language ?? '';
  const m = /-([A-Za-z]{2})(?:-|$)/.exec(tag);
  return m ? m[1].toUpperCase() : null;
}

/** 나라 코드 → 국기 이모지(KR → 🇰🇷) */
export function flag(country: string | null): string {
  if (!country || !/^[A-Z]{2}$/.test(country)) return '';
  return String.fromCodePoint(...[...country].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}
