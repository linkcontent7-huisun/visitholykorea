import { describe, expect, it } from 'vitest';
import { normalizeNote, NOTE_MAX_LENGTH } from './stamp-note';

describe('normalizeNote', () => {
  it('앞뒤 공백을 정리한다', () => {
    expect(normalizeNote('  조용했어요  ')).toBe('조용했어요');
  });

  it('줄바꿈·연속 공백은 한 칸으로 접는다 — "한 줄" 약속', () => {
    expect(normalizeNote('평일 오후,\n저 말고   아무도\t없었어요')).toBe(
      '평일 오후, 저 말고 아무도 없었어요',
    );
  });

  it('빈 입력은 null — 빈 문자열을 저장하면 뷰에 빈 한 줄이 공개된다', () => {
    expect(normalizeNote('')).toBeNull();
    expect(normalizeNote('   \n\t  ')).toBeNull();
  });

  it('DB 체크 제약과 같은 길이로 자른다', () => {
    const long = '가'.repeat(NOTE_MAX_LENGTH + 40);
    expect(normalizeNote(long)).toHaveLength(NOTE_MAX_LENGTH);
  });

  it('제약 길이 이내면 그대로 둔다', () => {
    const ok = '나'.repeat(NOTE_MAX_LENGTH);
    expect(normalizeNote(ok)).toBe(ok);
  });
});
