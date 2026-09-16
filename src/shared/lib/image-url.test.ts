import { describe, expect, it } from 'vitest';
import { sizedImageUrl } from './image-url';

const WIKI =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Myeongdong_Cathedral_02.jpg/1280px-Myeongdong_Cathedral_02.jpg';

describe('sizedImageUrl — Wikimedia 썸네일 크기 맞추기', () => {
  it('1280px 썸네일을 요청 폭으로 줄인다', () => {
    expect(sizedImageUrl(WIKI, 800)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Myeongdong_Cathedral_02.jpg/800px-Myeongdong_Cathedral_02.jpg',
    );
  });

  it('이미 더 작은 썸네일은 키우지 않는다 (원본보다 크면 Wikimedia 가 400)', () => {
    const small = WIKI.replace('1280px', '640px');
    expect(sizedImageUrl(small, 800)).toBe(small);
  });

  it('Wikimedia 가 아닌 주소는 그대로 둔다', () => {
    const own = 'https://kaahuoqzkgshihypzzyh.supabase.co/storage/v1/object/public/site-photos/a.jpg';
    expect(sizedImageUrl(own, 800)).toBe(own);
    expect(sizedImageUrl('/placeholders/ko/site-placeholder-1.webp', 800)).toBe(
      '/placeholders/ko/site-placeholder-1.webp',
    );
  });

  it('null 은 null', () => {
    expect(sizedImageUrl(null, 800)).toBeNull();
  });
});
