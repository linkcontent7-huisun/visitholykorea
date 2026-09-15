import { describe, expect, it, vi } from 'vitest';
import { buildUpstreamUrl, handleTourProxy } from '../../api/_lib/tour-proxy-core';

const KEY = 'secret-service-key';

function query(params: Record<string, string>): URLSearchParams {
  return new URLSearchParams(params);
}

describe('buildUpstreamUrl — 허용 목록', () => {
  it('허용된 오퍼레이션은 서버가 키·공통값을 붙여 상위 URL 을 만든다', () => {
    const built = buildUpstreamUrl(
      query({ op: 'searchKeyword2', keyword: '경복궁', numOfRows: '10', contentTypeId: '12' }),
      KEY,
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.url.origin + built.url.pathname).toBe(
      'https://apis.data.go.kr/B551011/KorService2/searchKeyword2',
    );
    expect(built.url.searchParams.get('serviceKey')).toBe(KEY);
    expect(built.url.searchParams.get('_type')).toBe('json');
    expect(built.url.searchParams.get('MobileApp')).toBe('VisitHolyKorea');
    expect(built.url.searchParams.get('keyword')).toBe('경복궁');
  });

  it('목록에 없는 오퍼레이션·서비스는 거절한다 — 임의 URL 중계를 막는다', () => {
    expect(buildUpstreamUrl(query({ op: 'detailCommon2' }), KEY).ok).toBe(false);
    expect(buildUpstreamUrl(query({ op: 'searchKeyword2', service: 'Durunubi' }), KEY).ok).toBe(
      false,
    );
    expect(buildUpstreamUrl(query({}), KEY).ok).toBe(false);
  });

  it('클라이언트가 보낸 serviceKey·_type·낯선 파라미터는 버린다', () => {
    const built = buildUpstreamUrl(
      query({
        op: 'locationBasedList2',
        mapX: '126.9',
        mapY: '37.5',
        serviceKey: 'attacker',
        _type: 'xml',
        evil: '1',
      }),
      KEY,
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.url.searchParams.get('serviceKey')).toBe(KEY);
    expect(built.url.searchParams.get('_type')).toBe('json');
    expect(built.url.searchParams.has('evil')).toBe(false);
  });

  it('숫자 파라미터에 문자가 섞이거나 값이 너무 길면 거절한다', () => {
    expect(
      buildUpstreamUrl(query({ op: 'searchKeyword2', keyword: 'x', numOfRows: '10;drop' }), KEY)
        .ok,
    ).toBe(false);
    expect(
      buildUpstreamUrl(query({ op: 'searchKeyword2', keyword: 'a'.repeat(201) }), KEY).ok,
    ).toBe(false);
  });
});

describe('handleTourProxy — 응답 분류', () => {
  const okQuery = query({ op: 'searchKeyword2', keyword: '명동' });

  it('키가 없으면 503 not_configured — 화면은 자체 성지 탐색을 계속한다', async () => {
    const result = await handleTourProxy(okQuery, { serviceKey: undefined });
    expect(result.status).toBe(503);
    expect(JSON.parse(result.body).error.kind).toBe('not_configured');
  });

  it('정상 응답은 본문을 그대로 넘기고 저장 금지 헤더를 붙인다', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('{"response":{"header":{"resultCode":"0000"}}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as unknown as typeof fetch;
    const result = await handleTourProxy(okQuery, { serviceKey: KEY, fetchImpl });
    expect(result.status).toBe(200);
    expect(result.headers['cache-control']).toBe('no-store');
    expect(JSON.parse(result.body).response.header.resultCode).toBe('0000');
  });

  it('상위 429 는 rate_limited, 5xx 는 upstream 으로 구분한다', async () => {
    const make = (status: number) =>
      vi.fn(async () => new Response('busy', { status })) as unknown as typeof fetch;
    const limited = await handleTourProxy(okQuery, { serviceKey: KEY, fetchImpl: make(429) });
    expect(limited.status).toBe(429);
    expect(JSON.parse(limited.body).error.kind).toBe('rate_limited');

    const down = await handleTourProxy(okQuery, { serviceKey: KEY, fetchImpl: make(503) });
    expect(down.status).toBe(502);
    expect(JSON.parse(down.body).error).toEqual({ kind: 'upstream', status: 503 });
  });

  it('제한 시간을 넘기면 504 timeout — 화면이 영원히 돌지 않는다', async () => {
    const fetchImpl = vi.fn(
      (_url: URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    ) as unknown as typeof fetch;
    const result = await handleTourProxy(okQuery, { serviceKey: KEY, fetchImpl, timeoutMs: 10 });
    expect(result.status).toBe(504);
    expect(JSON.parse(result.body).error.kind).toBe('timeout');
  });

  it('로그에는 키가 남지 않는다', async () => {
    const log = vi.fn();
    const fetchImpl = vi.fn(async () => {
      throw new Error(`connect failed https://apis.data.go.kr/?serviceKey=${KEY}`);
    }) as unknown as typeof fetch;
    const result = await handleTourProxy(okQuery, { serviceKey: KEY, fetchImpl, log });
    expect(result.status).toBe(502);
    expect(JSON.stringify(log.mock.calls)).not.toContain(KEY);
  });
});
