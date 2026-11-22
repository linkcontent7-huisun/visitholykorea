// node --test tests/ (Node 22.6+ 는 .ts 를 그대로 돌린다)
process.env.TZ = 'Asia/Seoul';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDay, receivedToday } from '../src/pilgrim-store.ts';

test('한국 오전 9시 전 순례도 그날로 센다(세계 표준시로는 전날)', () => {
  const kst0859 = new Date('2026-11-22T23:59:59Z'); // 한국 11/23 08:59:59
  assert.equal(kst0859.toISOString().slice(0, 10), '2026-11-22'); // 옛 방식은 전날로 셌다
  assert.equal(localDay(kst0859), '2026-11-23');
  assert.equal(localDay(new Date('2026-11-23T00:00:00Z')), '2026-11-23'); // 한국 09:00
});

test('자정 앞뒤로 날짜가 바뀐다', () => {
  assert.equal(localDay(new Date('2026-11-22T14:59:59Z')), '2026-11-22'); // 한국 23:59:59
  assert.equal(localDay(new Date('2026-11-22T15:00:00Z')), '2026-11-23'); // 한국 00:00:00
});

test('하루 한 개: 같은 현지 날짜에 받은 빛만 센다', () => {
  const lights = [{ shape: 0, color: '#fff', at: '2026-11-23' }, { shape: 1, color: '#fff', at: '2026-11-22' }];
  assert.equal(receivedToday(lights, new Date('2026-11-22T23:30:00Z')), 1); // 한국 11/23 08:30
  assert.equal(receivedToday(lights, new Date('2026-11-23T15:00:00Z')), 0); // 한국 11/24 00:00
});
