import { describe, expect, it } from 'vitest';
import { photoCreditText } from './photo-credit';

describe('photoCreditText — 사진 출처 한 줄', () => {
  it('직접 찍었거나 앱에 쓰라고 받은 사진은 표기하지 않는다', () => {
    expect(photoCreditText('노희선 직접 촬영 (2026-09-17)', '앱 사용 동의')).toBeNull();
    expect(
      photoCreditText('노희선 제공 (2026-09-19, 대전교구·자체 촬영 취합)', '앱 사용 허락'),
    ).toBeNull();
    expect(
      photoCreditText('대전교구 홍보국 제공 (2026-09-18)', '대전교구 제공, 앱 사용 허락'),
    ).toBeNull();
    expect(photoCreditText(null, null)).toBeNull();
  });

  it('위키미디어·공공누리처럼 표기가 의무인 사진은 짧게 남긴다', () => {
    expect(photoCreditText('Wikimedia Commons (Jjw)', 'CC BY-SA 4.0')).toBe(
      'Wikimedia Commons (Jjw) · CC BY-SA 4.0',
    );
    expect(photoCreditText('국가유산청', '공공누리 제1유형 (KOGL Type 1)')).toBe(
      '국가유산청 · 공공누리 제1유형',
    );
    expect(
      photoCreditText('한국관광공사 포토코리아 (촬영 한국관광공사 김지호)', '공공누리 제1유형'),
    ).toBe('한국관광공사 포토코리아 · 공공누리 제1유형');
  });

  it('외국어 화면에서는 기관·라이선스 이름을 영어로 쓴다', () => {
    expect(photoCreditText('국가유산청', '공공누리 제1유형 (KOGL Type 1)', 'fr')).toBe(
      'Korea Heritage Service · KOGL Type 1',
    );
    expect(
      photoCreditText(
        '공공누리 포털 · 인천광역시 「제물진두 순교기념경당」(recommendIdx 28346)',
        '공공누리 제1유형',
        'it',
      ),
    ).toBe('KOGL Portal · Incheon Metropolitan City 「제물진두 순교기념경당」 · KOGL Type 1');
    expect(photoCreditText('Wikimedia Commons (Jjw)', 'CC BY-SA 4.0', 'es')).toBe(
      'Wikimedia Commons (Jjw) · CC BY-SA 4.0',
    );
  });
});
