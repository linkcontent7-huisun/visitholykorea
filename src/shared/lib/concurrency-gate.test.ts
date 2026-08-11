import { describe, expect, it } from 'vitest';
import { createConcurrencyGate } from './concurrency-gate';

/** 게이트를 통과하는 가짜 작업. 언제 끝낼지는 테스트가 직접 정한다. */
function makeTask(gate: ReturnType<typeof createConcurrencyGate>, record: { peak: number }) {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });

  const run = (async () => {
    await gate.acquire();
    record.peak = Math.max(record.peak, gate.inFlight);
    try {
      await done;
    } finally {
      gate.release();
    }
  })();

  return { run, finish };
}

describe('createConcurrencyGate', () => {
  it('한도를 넘는 작업은 대기시킨다', async () => {
    const gate = createConcurrencyGate(2);
    const record = { peak: 0 };
    const tasks = [makeTask(gate, record), makeTask(gate, record), makeTask(gate, record)];

    // 세 번째는 앞의 둘이 끝날 때까지 시작조차 하지 못한다
    await Promise.resolve();
    expect(gate.inFlight).toBe(2);

    tasks.forEach((t) => t.finish());
    await Promise.all(tasks.map((t) => t.run));
    expect(record.peak).toBe(2);
    expect(gate.inFlight).toBe(0);
  });

  it('슬롯을 넘겨받는 순간에도 한도를 넘지 않는다', async () => {
    // 반납과 재획득 사이에 새 호출이 끼어드는 상황. 카운트를 넘겼다 받으면 5개가 나갈 수 있다.
    const gate = createConcurrencyGate(4);
    const record = { peak: 0 };
    const tasks = Array.from({ length: 12 }, () => makeTask(gate, record));

    // 먼저 시작한 4개를 끝내면서, 그 틈에 나머지가 몰려들게 한다
    for (const task of tasks) {
      task.finish();
      await Promise.resolve();
    }
    await Promise.all(tasks.map((t) => t.run));

    expect(record.peak).toBe(4);
    expect(gate.inFlight).toBe(0);
  });

  it('작업이 실패해도 슬롯을 돌려준다', async () => {
    const gate = createConcurrencyGate(1);

    await gate.acquire();
    try {
      throw new Error('호출 실패');
    } catch {
      gate.release();
    }

    // 반납되지 않았다면 여기서 영원히 멈춘다
    await gate.acquire();
    expect(gate.inFlight).toBe(1);
    gate.release();
    expect(gate.inFlight).toBe(0);
  });

  it('순서대로 깨운다 (먼저 기다린 쪽이 먼저)', async () => {
    const gate = createConcurrencyGate(1);
    const order: number[] = [];

    await gate.acquire(); // 슬롯 점유
    const waiters = [1, 2, 3].map(async (n) => {
      await gate.acquire();
      order.push(n);
      gate.release();
    });

    gate.release();
    await Promise.all(waiters);
    expect(order).toEqual([1, 2, 3]);
  });

  it('한도가 1 미만이면 만들 때 막는다', () => {
    expect(() => createConcurrencyGate(0)).toThrow();
    expect(() => createConcurrencyGate(1.5)).toThrow();
  });
});
