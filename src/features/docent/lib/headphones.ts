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
    return judgeOutputs(list);
  } catch {
    return 'unknown';
  }
}
