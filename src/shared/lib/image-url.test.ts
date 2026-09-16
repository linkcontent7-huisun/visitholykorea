import { describe, expect, it } from 'vitest';
import { sizedImageUrl, wikimediaStandardWidth } from './image-url';

const WIKI =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Myeongdong_Cathedral_02.jpg/1280px-Myeongdong_Cathedral_02.jpg';

describe('sizedImageUrl — Wikimedia 썸네일 크기 맞추기', () => {
  it('1280px 썸네일을 요청 폭 이상의 표준 폭으로 줄인다 (800 → 960)', () => {
    // 800px 은 Wikimedia 표준 폭이 아니라 400 으로 거부된다 (2026-09-16 실측). 960 으로 올려야 받아진다.
    expect(sizedImageUrl(WIKI, 800)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Myeongdong_Cathedral_02.jpg/960px-Myeongdong_Cathedral_02.jpg',
    );
    expect(sizedImageUrl(WIKI, 960)).toBe(WIKI.replaceAll('1280px', '960px'));
    expect(sizedImageUrl(WIKI, 400)).toBe(WIKI.replaceAll('1280px', '500px'));
  });

  it('이미 더 작은 썸네일은 키우지 않는다 (원본보다 크면 Wikimedia 가 400)', () => {
    const small = WIKI.replaceAll('1280px', '640px');
    expect(sizedImageUrl(small, 800)).toBe(small);
    // 요청 폭이 표준 폭으로 올라가 저장된 폭과 같아지면 그대로 둔다
    expect(sizedImageUrl(WIKI, 1100)).toBe(WIKI);
  });

  it('Wikimedia 가 아닌 주소는 그대로 둔다', () => {
    const own = 'https://kaahuoqzkgshihypzzyh.supabase.co/storage/v1/object/public/site-photos/a.jpg';
    expect(sizedImageUrl(own, 800)).toBe(own);
    expect(sizedImageUrl('/placeholders/site-placeholder-1.webp', 800)).toBe(
      '/placeholders/site-placeholder-1.webp',
    );
    expect(sizedImageUrl('/images/sites/munsan.jpg', 800)).toBe('/images/sites/munsan.jpg');
  });

  it('null 은 null', () => {
    expect(sizedImageUrl(null, 800)).toBeNull();
  });
});

describe('wikimediaStandardWidth — 표준 폭으로 올림', () => {
  it('표준 폭은 그대로, 사이 값은 바로 위 표준 폭으로', () => {
    expect(wikimediaStandardWidth(960)).toBe(960);
    expect(wikimediaStandardWidth(800)).toBe(960);
    expect(wikimediaStandardWidth(801)).toBe(960);
    expect(wikimediaStandardWidth(1)).toBe(20);
    expect(wikimediaStandardWidth(1281)).toBe(1920);
  });

  it('최대치를 넘으면 최대치', () => {
    expect(wikimediaStandardWidth(10000)).toBe(3840);
  });
});
