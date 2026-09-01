import { describe, expect, it } from 'vitest';
import { pickVoice, splitSentences } from './use-docent-player';

/** getVoices() 가 주는 목록을 흉내 낸다 — 이름과 lang 만 있으면 충분하다. */
function voice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe('pickVoice', () => {
  it('언어가 맞는 음성이 없으면 null 을 준다 — 눌러도 소리가 안 날 것을 미리 알 수 있다', () => {
    expect(pickVoice([voice('Samantha', 'en-US')], 'ko-KR')).toBeNull();
  });

  it('목록이 비어 있으면 null 을 준다 (음성이 아직 안 실린 상태)', () => {
    expect(pickVoice([], 'ko-KR')).toBeNull();
  });

  it('로케일이 정확히 맞는 음성을 고른다 — 기본 음성에 맡기면 엉뚱한 언어로 읽는다', () => {
    const picked = pickVoice([voice('Samantha', 'en-US'), voice('Heami', 'ko-KR')], 'ko-KR');
    expect(picked?.name).toBe('Heami');
  });

  it('같은 언어라면 신경망 음성을 낡은 합성음보다 먼저 고른다', () => {
    const picked = pickVoice(
      [voice('Microsoft Heami', 'ko-KR'), voice('Microsoft SunHi Online (Natural)', 'ko-KR')],
      'ko-KR',
    );
    expect(picked?.name).toBe('Microsoft SunHi Online (Natural)');
  });

  it('지역이 달라도 같은 언어면 받아들인다 — pt-PT 밖에 없어도 읽어준다', () => {
    const picked = pickVoice([voice('Joana', 'pt-PT')], 'pt-BR');
    expect(picked?.name).toBe('Joana');
  });

  it('lang 표기가 밑줄(ko_KR)인 안드로이드 기기도 인식한다', () => {
    expect(pickVoice([voice('Korean', 'ko_KR')], 'ko-KR')?.name).toBe('Korean');
  });
});

describe('splitSentences', () => {
  it('문장 단위로 끊는다 — 한 문단을 통째로 넘기면 쉼 없이 읽어 기계처럼 들린다', () => {
    expect(splitSentences('첫 문장입니다. 둘째 문장입니다.')).toEqual([
      '첫 문장입니다.',
      '둘째 문장입니다.',
    ]);
  });

  it('물음표·느낌표에서도 끊는다', () => {
    expect(splitSentences('보이시나요? 놀랍습니다!')).toEqual(['보이시나요?', '놀랍습니다!']);
  });

  it('문장 부호가 없으면 통째로 하나로 둔다', () => {
    expect(splitSentences('끝맺음 없는 문장')).toEqual(['끝맺음 없는 문장']);
  });

  it('빈 문자열은 빈 배열 — 재생할 것이 없다', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});
