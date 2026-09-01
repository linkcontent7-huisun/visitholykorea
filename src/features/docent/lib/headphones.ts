/**
 * 이어폰 연결 감지 — 성당 안 예절 가드의 계산부.
 *
 * 성당은 미사와 기도가 이어지는 곳이다. 스피커로 도슨트를 틀면 다른 순례자와
 * 신자들에게 방해가 되므로, 휴대폰·태블릿에서는 이어폰 없이 재생되지 않게 막는다.
 *
 * 다만 브라우저는 이어폰 연결을 **확실하게 알 방법이 없다**. iOS 사파리는
 * 오디오 출력 장치를 아예 열거해 주지 않고, 안드로이드도 권한 전에는 장치
 * 이름을 감춘다. 그래서 세 갈래로 답한다:
 * - 'connected' — 이름에서 이어폰이 확인됨 → 바로 재생
 * - 'none'      — 장치 이름들이 보이는데 이어폰이 없음 → 차단
 * - 'unknown'   — 알 수 없음(대부분의 휴대폰) → 사용자에게 정중히 확인받는다
 */

const HEADPHONE_NAME = /head|ear|airpod|buds|pods|헤드|이어|버즈/i;

export type HeadphoneState = 'connected' | 'none' | 'unknown';

/** 화면을 손가락으로 쓰는 기기인가 — 성당에 들고 가는 것은 휴대폰·태블릿이다. */
export function isCoarsePointer(): boolean {
  return window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
}

/** 오디오 출력 장치 목록으로 이어폰 연결 여부를 가늠한다. */
export function judgeOutputs(devices: Pick<MediaDeviceInfo, 'kind' | 'label'>[]): HeadphoneState {
  const outputs = devices.filter((d) => d.kind === 'audiooutput');
  if (outputs.length === 0) return 'unknown';
  // 권한 전에는 label 이 빈 문자열로 온다 — 이름이 없으면 판단하지 않는다
  const named = outputs.filter((o) => o.label.trim().length > 0);
  if (named.length === 0) return 'unknown';
  return named.some((o) => HEADPHONE_NAME.test(o.label)) ? 'connected' : 'none';
}

/** 현재 기기의 이어폰 상태. 실패하면 'unknown' — 감지 실패로 사람을 막지 않는다. */
export async function detectHeadphones(): Promise<HeadphoneState> {
  try {
    const list = await navigator.mediaDevices?.enumerateDevices?.();
    if (!list) return 'unknown';
    const byOutput = judgeOutputs(list);
    // 안드로이드는 출력을 안 보여준다 — 마이크 권한을 이미 받았다면
    // 입력 장치 이름으로도 판단할 수 있다 (이어폰을 꽂으면 devicechange 로 갱신됨)
    return byOutput !== 'unknown' ? byOutput : judgeInputs(list);
  } catch {
    return 'unknown';
  }
}

/** 안드로이드인가 — 갤럭시 등. 이 계열에서만 마이크 권한 검증이 의미가 있다. */
export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/**
 * 입력 장치(마이크) 이름으로 이어폰을 가늠한다.
 *
 * 안드로이드 크롬은 출력 장치를 안 보여주지만, 마이크 권한을 받으면
 * **입력 장치 이름**은 보여준다. 갤럭시 번들 이어폰·버즈는 전부 마이크가
 * 달려 있어서, "헤드셋 마이크"·"Galaxy Buds" 같은 입력이 잡히면
 * 이어폰이 연결된 것이다.
 */
export function judgeInputs(devices: Pick<MediaDeviceInfo, 'kind' | 'label'>[]): HeadphoneState {
  const named = devices.filter((d) => d.kind === 'audioinput' && d.label.trim().length > 0);
  if (named.length === 0) return 'unknown';
  if (named.some((d) => HEADPHONE_NAME.test(d.label) || /headset|헤드셋/i.test(d.label))) {
    return 'connected';
  }
  /**
   * 내장 마이크뿐이어도 'none' 이라고 단정하지 않는다 — 마이크 없는 3극 유선
   * 이어폰(어르신들이 많이 쓰는 저가 이어폰)은 입력 장치에 아예 안 잡힌다.
   * 실기기에서 이 오판이 재생을 영구히 잠갔다 (2026-09-01 사용자 제보).
   * 입력 장치는 **있음을 증명**할 수 있을 뿐, 없음을 증명하지 못한다.
   */
  return 'unknown';
}

/**
 * 마이크 권한을 받아 이어폰 연결을 실제로 확인한다 (안드로이드용 정밀 검증).
 *
 * 노인 사용자가 안내문을 읽지 않고 확인 버튼만 누르는 경우를 잡기 위한
 * 장치다. 권한은 장치 목록을 읽는 데만 쓰고 **녹음은 하지 않는다** —
 * 스트림은 받자마자 끈다. 권한 거부·미지원이면 'unknown' 으로 물러난다.
 * 마이크 없는 유선 이어폰 사용자를 잠그면 안 되기 때문이다.
 */
export async function verifyWithMicPermission(
  media: Pick<MediaDevices, 'getUserMedia' | 'enumerateDevices'> | undefined = navigator.mediaDevices,
): Promise<HeadphoneState> {
  if (!media?.getUserMedia || !media.enumerateDevices) return 'unknown';
  try {
    const stream = await media.getUserMedia({ audio: true });
    try {
      const devices = await media.enumerateDevices();
      const byOutput = judgeOutputs(devices);
      if (byOutput !== 'unknown') return byOutput;
      return judgeInputs(devices);
    } finally {
      stream.getTracks().forEach((t) => t.stop());
    }
  } catch {
    return 'unknown';
  }
}
