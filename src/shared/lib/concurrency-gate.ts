/**
 * 동시 실행 수를 제한하는 게이트.
 *
 * 외부 API 가 "초당 몇 건까지"를 정해 두었는데 우리가 `Promise.all` 로 한 번에 쏘면,
 * 일일 한도가 남아 있어도 초당 한도에 걸려 거절당한다. TourAPI 의 에러코드 23 이 그 경우다.
 *
 * 총 호출 수는 그대로 두고 **나가는 시점만 나눈다.** 응답을 붙들거나 재사용하지 않으므로
 * 캐시가 아니다 — 실시간 호출을 요구하는 공모전 규정(ADR 0002)에 영향이 없다.
 */
export interface ConcurrencyGate {
  /** 슬롯이 날 때까지 기다린다. 반드시 `finally` 에서 `release()` 를 부를 것. */
  acquire(): Promise<void>;
  release(): void;
  /** 진행 중인 작업 수 (테스트·디버깅용) */
  readonly inFlight: number;
}

export function createConcurrencyGate(max: number): ConcurrencyGate {
  if (!Number.isInteger(max) || max < 1) {
    throw new Error(`동시 실행 수는 1 이상의 정수여야 합니다 (받은 값: ${max})`);
  }

  let inFlight = 0;
  const waiting: Array<() => void> = [];

  return {
    acquire() {
      if (inFlight < max) {
        inFlight += 1;
        return Promise.resolve();
      }
      // 대기자는 깨어날 때 카운트를 올리지 않는다 — 반납하는 쪽이 슬롯을 그대로 넘긴다.
      // 여기서 올리면 반납과 재획득 사이(마이크로태스크 한 틱)에 카운트가 잠깐 비어,
      // 새로 들어온 호출이 그 틈으로 끼어들어 한도를 넘을 수 있다.
      return new Promise<void>((resolve) => waiting.push(resolve));
    },

    release() {
      const next = waiting.shift();
      // 대기자가 있으면 슬롯을 넘겨주기만 한다(카운트 유지).
      // 실패로 빠져나갈 때도 반드시 깨워야 한다 — 안 그러면 화면이 영원히 로딩된다.
      if (next) next();
      else if (inFlight > 0) inFlight -= 1;
    },

    get inFlight() {
      return inFlight;
    },
  };
}
