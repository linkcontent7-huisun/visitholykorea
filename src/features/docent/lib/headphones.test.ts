import { describe, expect, it, vi } from 'vitest';
import { judgeInputs, judgeOutputs, verifyWithMicPermission } from './headphones';

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


describe('judgeInputs — 안드로이드용 마이크 이름 판정', () => {
  it('헤드셋·버즈 마이크가 잡히면 connected', () => {
    expect(judgeInputs([dev('audioinput', '헤드셋 마이크')])).toBe('connected');
    expect(judgeInputs([dev('audioinput', 'Galaxy Buds2 Pro')])).toBe('connected');
  });

  it('내장 마이크뿐이면 none — 이어폰 없이 확인 버튼만 누른 경우를 잡는다', () => {
    expect(judgeInputs([dev('audioinput', '내장 마이크')])).toBe('none');
    expect(judgeInputs([dev('audioinput', 'Default - Built-in Microphone')])).toBe('none');
  });

  it('이름이 안 보이거나 애매하면 unknown — 정직한 사용자를 잠그지 않는다', () => {
    expect(judgeInputs([dev('audioinput', '')])).toBe('unknown');
    expect(judgeInputs([dev('audioinput', 'Microphone (Realtek Audio)')])).toBe('unknown');
  });
});

describe('verifyWithMicPermission — 녹음 없이 장치 목록만 확인', () => {
  function fakeMedia(devices: { kind: MediaDeviceKind; label: string }[], deny = false) {
    const stop = vi.fn();
    return {
      media: {
        getUserMedia: deny
          ? vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
          : vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }),
        enumerateDevices: vi.fn().mockResolvedValue(devices),
      } as unknown as MediaDevices,
      stop,
    };
  }

  it('버즈가 잡히면 connected 를 주고 스트림은 즉시 끈다', async () => {
    const { media, stop } = fakeMedia([dev('audioinput', 'Galaxy Buds Live')]);
    await expect(verifyWithMicPermission(media)).resolves.toBe('connected');
    expect(stop).toHaveBeenCalled();
  });

  it('내장 마이크뿐이면 none — 재생을 막을 근거', async () => {
    const { media } = fakeMedia([dev('audioinput', '내장 마이크')]);
    await expect(verifyWithMicPermission(media)).resolves.toBe('none');
  });

  it('권한을 거부하면 unknown — 사용자 확인을 믿는 쪽으로 물러난다', async () => {
    const { media } = fakeMedia([], true);
    await expect(verifyWithMicPermission(media)).resolves.toBe('unknown');
  });

  it('mediaDevices 자체가 없으면 unknown', async () => {
    await expect(verifyWithMicPermission(undefined)).resolves.toBe('unknown');
  });
});
