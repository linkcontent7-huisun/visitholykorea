/* global window, HTMLMediaElement */
// QA 브라우저 전용 — 사장님 스피커로 소리가 나가지 않게 한다 (2026-09 TTS 가 스피커로 나간 사고).
// 낭독(speechSynthesis)은 브라우저 음소거(--mute-audio)를 무시하고 OS 음성으로 나갈 수 있어서,
// 실제로 말하지 않고 "무엇을 말하려 했는지"만 window.__qaTts 에 쌓는다. QA 는 이걸로 재생 여부를 판단한다.
(() => {
  window.__qaTts = [];
  const ss = window.speechSynthesis;
  if (ss) {
    let speaking = false;
    ss.speak = (u) => {
      window.__qaTts.push({ text: String(u && u.text).slice(0, 80), lang: u && u.lang });
      speaking = true;
      // 앱이 다음 문장으로 넘어가는지도 보이도록 시작·끝 이벤트를 짧게 흉내 낸다.
      setTimeout(() => {
        speaking = false;
        if (u && u.onstart) u.onstart(new Event('start'));
        if (u && u.onend) u.onend(new Event('end'));
      }, 300);
    };
    ss.cancel = () => {
      speaking = false;
    };
    Object.defineProperty(ss, 'speaking', { get: () => speaking, configurable: true });
  }
  // 무음 반복 오디오 등 미디어 요소도 전부 음소거
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    this.muted = true;
    this.volume = 0;
    return play.call(this);
  };
})();
