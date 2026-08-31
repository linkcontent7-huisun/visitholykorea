import { describe, expect, it } from 'vitest';
import { judgeOutputs } from './headphones';

/** enumerateDevices 가 주는 항목을 흉내 낸다. */
function dev(kind: MediaDeviceKind, label: string) {
  return { kind, label };
}

describe('judgeOutputs — 이어폰 연결 판정', () => {
  it('출력 장치 이름에 이어폰이 보이면 connected', () => {
    expect(judgeOutputs([dev('audiooutput', 'AirPods Pro')])).toBe('connected');
    expect(judgeOutputs([dev('audiooutput', 'Galaxy Buds2')])).toBe('connected');
    expect(judgeOutputs([dev('audiooutput', 'USB Headset')])).toBe('connected');
  });

  it('이름들이 보이는데 스피커뿐이면 none — 재생을 막는 근거가 된다', () => {
    expect(judgeOutputs([dev('audiooutput', 'Speakers (Realtek)')])).toBe('none');
  });

  it('권한 전이라 이름이 비어 있으면 unknown — 감지 실패로 사람을 막지 않는다', () => {
    expect(judgeOutputs([dev('audiooutput', '')])).toBe('unknown');
  });

  it('출력 장치 정보가 아예 없으면 unknown (iOS 사파리가 이렇다)', () => {
    expect(judgeOutputs([dev('audioinput', 'Microphone')])).toBe('unknown');
    expect(judgeOutputs([])).toBe('unknown');
  });

  it('스피커와 이어폰이 같이 잡혀 있으면 connected — 연결돼 있다는 뜻', () => {
    expect(
      judgeOutputs([dev('audiooutput', 'Speakers'), dev('audiooutput', '이어폰 (Bluetooth)')]),
    ).toBe('connected');
  });
});
