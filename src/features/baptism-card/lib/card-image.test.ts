import { afterEach, describe, expect, it, vi } from 'vitest';
import { cardShareData } from './card-image';

const file = new File(['x'], 'visitholykorea-andrew.png', { type: 'image/png' });
const text = '「안드레아」 세례명으로 만나는 한국 성지예요.';
const url = 'https://visitholykorea.com';

function stubCanShare(canShare: ((data: ShareData) => boolean) | undefined) {
  vi.stubGlobal('navigator', { canShare });
}

describe('cardShareData — 카드와 함께 사이트 주소를 보낸다', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('그림+글+주소를 받는 기기에서는 셋을 함께 넘긴다', () => {
    stubCanShare(() => true);
    expect(cardShareData(file, text, url)).toEqual({ files: [file], text, url });
  });

  it('그림과 글을 함께 못 받는 기기에서는 그림만 넘긴다', () => {
    stubCanShare((data) => !data.text && !data.url);
    expect(cardShareData(file, text, url)).toEqual({ files: [file] });
  });

  it('파일 공유가 안 되면 null — 호출한 쪽이 저장으로 넘어간다', () => {
    stubCanShare(() => false);
    expect(cardShareData(file, text, url)).toBeNull();
  });

  it('canShare 가 없는 브라우저도 null', () => {
    stubCanShare(undefined);
    expect(cardShareData(file, text, url)).toBeNull();
  });
});
