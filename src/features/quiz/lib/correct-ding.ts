/**
 * 퀴즈 정답 「딩동」 소리 (사장님 지시 2026-11-20: 「정답! 딩동이라는 효과음이 작게 나오게」).
 *
 * 소리 파일을 들여오지 않고 브라우저가 직접 만든다(Web Audio). 출처·사용 조건을 따질 일이 없고 내려받을 것도 없다.
 * 높은 음(미) → 낮은 음(도) 두 번, 맑은 사인파가 금방 사라지는 모양 — 초인종 「딩동」.
 *
 * 소리가 막혀도 퀴즈는 멈추지 않는다: 소리를 못 내는 브라우저, 무음 모드, 재생 거부는 모두 조용히 넘긴다.
 */

/** 최대 음량(0~1). 말소리보다 작게 — 기기 음량 중간에서 살짝 들릴 정도. */
export const DING_VOLUME = 0.08;

/** [주파수(Hz), 시작(초), 길이(초)] — E6 다음 C6 */
const NOTES: readonly (readonly [number, number, number])[] = [
  [1318.5, 0, 0.45],
  [1046.5, 0.16, 0.6],
];

type AudioContextCtor = new () => AudioContext;

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const g = globalThis as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  const Ctor = g.AudioContext ?? g.webkitAudioContext; // 옛 사파리는 webkit 이름만 있다
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** 정답일 때 한 번 부른다. 버튼을 누른 그 순간에 불러야 휴대폰 브라우저가 소리를 허락한다. */
export function playCorrectDing(): void {
  try {
    const ac = audioContext();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume().catch(() => {});
    const now = ac.currentTime;
    for (const [freq, start, length] of NOTES) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // 딱 소리 없이 빠르게 올라갔다가 천천히 사라진다
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(DING_VOLUME, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + start);
      osc.stop(now + start + length + 0.05);
    }
  } catch {
    // 소리는 덤이다. 실패해도 퀴즈 진행에는 아무 영향이 없어야 한다.
  }
}

/** 테스트에서 매번 새 AudioContext 로 시작하려고 둔다. */
export function resetDingForTest(): void {
  ctx = null;
}
