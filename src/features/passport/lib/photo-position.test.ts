import { describe, expect, it } from 'vitest';
import { nextPhotoPosition } from './photo-position';

describe('사진을 이어 붙일 자리', () => {
  it('사진이 없으면 1번', () => expect(nextPhotoPosition([])).toBe(1));
  it('빈 자리 없이 1·2·3 이면 4번', () =>
    expect(nextPhotoPosition([{ position: 1 }, { position: 2 }, { position: 3 }])).toBe(4));
  it('1번을 지워 2·3 만 남아도 3번(남은 사진)을 덮어쓰지 않고 4번', () =>
    expect(nextPhotoPosition([{ position: 2 }, { position: 3 }])).toBe(4));
});
