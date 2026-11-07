const path = require('path');
const pptxgen = require('pptxgenjs');
const C = require('./content');

const out = process.argv[2];
const IMG = path.join(__dirname, '..', 'img');
const img = (n) => path.join(IMG, `${n}.jpg`);

const DARK = '1E2430';
const PAPER = 'F4EFE6';
const RUST = '9C3B22';
const SOFT = 'E6DCCB';
const MUTED = '5B6270';
const HEAD = 'Batang';
const BODY = 'Malgun Gothic';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.author = '노희선';
pres.title = '하늘에서 빵이 내린다면 — 본선 발표 가안 v3';
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

pres.defineSlideMaster({
  title: 'LIGHT',
  background: { color: PAPER },
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 11, color: '8A8478', align: 'right' },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 0.5, w: 11.9, h: 0.95, fontFace: HEAD, fontSize: 32, bold: true, color: DARK, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({ title: 'DARK', background: { color: DARK } });

const T = (s, text, o) => s.addText(text, { isTextBox: true, fontFace: BODY, color: DARK, margin: 0, ...o });
const card = (s, x, y, w, h, fill = 'FFFFFF') =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill },
    shadow: { type: 'outer', color: '000000', opacity: 0.12, blur: 6, offset: 2, angle: 90 },
  });
const pic = (s, name, x, y, w, ratio) => {
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.04, y: y - 0.04, w: w + 0.08, h: w * ratio + 0.08, fill: { color: 'FFFFFF' }, line: { color: 'C9BFAE', width: 1 } });
  s.addImage({ path: img(name), x, y, w, h: w * ratio });
};

function content(sl) {
  const s = pres.addSlide({ masterName: 'LIGHT' });
  s.addText(sl.t, { placeholder: 'title' });
  return s;
}

for (const sl of C.slides) {
  let s;
  switch (sl.kind) {
    case 'cover': {
      s = pres.addSlide({ masterName: 'DARK' });
      T(s, `체험여행 1호 · 대전`, { x: 0.9, y: 1.3, w: 8, h: 0.4, fontSize: 18, color: 'E8C9A8' });
      T(s, C.title, { x: 0.9, y: 1.9, w: 11.5, h: 1.3, fontFace: HEAD, fontSize: 54, bold: true, color: 'FFFFFF' });
      T(s, C.subtitle, { x: 0.9, y: 3.3, w: 11.5, h: 0.6, fontSize: 24, color: 'F4EFE6' });
      T(s, C.presenter, { x: 0.9, y: 6.2, w: 8, h: 0.4, fontSize: 16, color: 'B9BDC6' });
      break;
    }
    case 'end': {
      s = pres.addSlide({ masterName: 'DARK' });
      T(s, sl.t, { x: 0.9, y: 2.2, w: 11.5, h: 1.2, fontFace: HEAD, fontSize: 54, bold: true, color: 'FFFFFF' });
      T(s, '성당 하나, 걸어서 닿는 문화재, 그 도시의 이야기.\n대전은 빵, 강경은 젓갈, 공세리는 쌀.', { x: 0.9, y: 3.6, w: 11.5, h: 1.2, fontSize: 22, color: 'F4EFE6', paraSpaceAfter: 6 });
      T(s, C.presenter, { x: 0.9, y: 6.2, w: 8, h: 0.4, fontSize: 16, color: 'B9BDC6' });
      break;
    }
    case 'scene': {
      s = content(sl);
      // 줄 선 사람들 — 단순한 실루엣과 휴대폰
      for (let i = 0; i < 11; i++) {
        const x = 0.9 + i * 0.95;
        s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: 3.2, w: 0.4, h: 0.4, fill: { color: i % 3 ? DARK : '3B4252' }, line: { color: PAPER } });
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.65, w: 0.7, h: 1.3, rectRadius: 0.12, fill: { color: i % 3 ? DARK : '3B4252' }, line: { color: PAPER } });
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.42, y: 3.75, w: 0.18, h: 0.3, rectRadius: 0.03, fill: { color: '5AA0FF' }, line: { color: '5AA0FF' } });
      }
      s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 4.95, w: 11.9, h: 0.06, fill: { color: 'C9BFAE' }, line: { color: 'C9BFAE' } });
      T(s, '20분', { x: 0.7, y: 1.75, w: 4, h: 1.2, fontFace: HEAD, fontSize: 72, bold: true, color: RUST });
      T(s, '모두 휴대폰만 보고 있습니다.\n이 20분을 이야기를 듣는 시간으로 바꿉니다.', { x: 0.7, y: 5.35, w: 11.9, h: 1.0, fontSize: 20, color: MUTED });
      break;
    }
    case 'image': {
      s = content(sl);
      pic(s, sl.img, 0.7, 1.85, 7.4, 510 / 960);
      T(s, sl.bullets.slice(0, 3).map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < 2 } })), { x: 8.6, y: 1.95, w: 4.1, h: 2.4, fontSize: 18, paraSpaceAfter: 10 });
      T(s, sl.bullets[3], { x: 8.6, y: 4.5, w: 4.1, h: 0.8, fontSize: 13, color: MUTED });
      T(s, '실제 화면: 나의 체험 링크 → 줄에서 보는 이야기 (웹툰 + 듣기)', { x: 0.7, y: 6.0, w: 7.4, h: 0.4, fontSize: 13, color: MUTED });
      break;
    }
    case 'problem':
    case 'money': {
      s = content(sl);
      const n = sl.cards.length;
      const gap = 0.4;
      const w = (11.9 - gap * (n - 1)) / n;
      sl.cards.forEach((c, i) => {
        const x = 0.7 + i * (w + gap);
        card(s, x, 2.0, w, 2.7);
        T(s, c.h, { x: x + 0.4, y: 2.35, w: w - 0.8, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: i === 0 ? RUST : DARK });
        T(s, c.b, { x: x + 0.4, y: 3.1, w: w - 0.8, h: 1.4, fontSize: 20, valign: 'top' });
      });
      break;
    }
    case 'loop': {
      s = content(sl);
      const n = sl.steps.length;
      const d = 1.55;
      const gap = (11.9 - d * n) / (n - 1);
      sl.steps.forEach((st, i) => {
        const x = 0.7 + i * (d + gap);
        s.addShape(pres.shapes.OVAL, { x, y: 2.3, w: d, h: d, fill: { color: i === 2 ? RUST : DARK }, line: { color: i === 2 ? RUST : DARK } });
        T(s, String(i + 1), { x, y: 2.3, w: d, h: d, align: 'center', valign: 'middle', fontFace: HEAD, fontSize: 40, bold: true, color: 'FFFFFF' });
        T(s, st, { x: x - 0.3, y: 4.0, w: d + 0.6, h: 0.8, align: 'center', fontSize: 16, bold: true });
        if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + d + gap / 2 - 0.15, y: 2.95, w: 0.3, h: 0.25, fill: { color: 'B5A994' }, line: { color: 'B5A994' } });
      });
      card(s, 0.7, 5.15, 11.9, 1.2, 'FFFFFF');
      T(s, [
        { text: '나의 체험 링크 하나로  ', options: { bold: true, color: RUST } },
        { text: '이용자는 저렴하고 간편하게, 기관은 엑셀 한 파일로.' },
      ], { x: 1.1, y: 5.15, w: 11.1, h: 1.2, fontSize: 20, valign: 'middle' });
      break;
    }
    case 'courses': {
      s = content(sl);
      sl.courses.forEach((c, i) => {
        const y = 1.95 + i * 1.75;
        card(s, 0.7, y, 6.6, 1.5);
        T(s, c.h, { x: 1.0, y: y + 0.18, w: 6.0, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: i ? DARK : RUST });
        T(s, c.b, { x: 1.0, y: y + 0.7, w: 6.0, h: 0.7, fontSize: 15, color: MUTED });
      });
      T(s, '종교와 관계없이, 아이 동반 가족 · 성인 · 어르신 누구나', { x: 0.7, y: 5.6, w: 6.6, h: 0.5, fontSize: 16, bold: true });
      pic(s, 'popup', 7.8, 1.95, 4.8, 710 / 1280);
      T(s, '실제 화면: 홈에 뜨는 1호 카드', { x: 7.8, y: 4.75, w: 4.8, h: 0.4, fontSize: 13, color: MUTED });
      break;
    }
    case 'demo': {
      s = content(sl);
      sl.steps.forEach((st, i) => {
        const y = 1.95 + i * 0.85;
        s.addShape(pres.shapes.OVAL, { x: 0.7, y, w: 0.55, h: 0.55, fill: { color: RUST }, line: { color: RUST } });
        T(s, String(i + 1), { x: 0.7, y, w: 0.55, h: 0.55, align: 'center', valign: 'middle', fontSize: 18, bold: true, color: 'FFFFFF' });
        T(s, st, { x: 1.45, y, w: 4.0, h: 0.55, valign: 'middle', fontSize: 18 });
      });
      T(s, '3분 · 행사장 브라우저 / 예비 녹화 영상', { x: 0.7, y: 6.3, w: 5, h: 0.4, fontSize: 13, color: MUTED });
      pic(s, 'apply', 7.4, 1.85, 4.3, 710 / 1280);
      pic(s, 'admin', 7.4, 4.35, 4.3, 710 / 1280);
      T(s, '접수', { x: 11.85, y: 1.85, w: 0.8, h: 0.4, fontSize: 13, color: MUTED });
      T(s, '기관 화면', { x: 11.85, y: 4.35, w: 0.8, h: 0.6, fontSize: 13, color: MUTED });
      break;
    }
    case 'table': {
      s = content(sl);
      const head = ['기관이 하는 일', '지금 (따로따로)', 'Visit Holy Korea (한 번에)'].map((t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: DARK } } }));
      const rows = sl.rows.map((r) => r.map((t, j) => ({ text: t, options: { bold: j === 0, color: j === 2 ? RUST : DARK, fill: { color: j === 2 ? 'FFFFFF' : 'FBF8F2' } } })));
      s.addTable([head, ...rows], { x: 0.7, y: 1.95, w: 11.9, colW: [2.9, 4.2, 4.8], fontFace: BODY, fontSize: 17, rowH: 0.75, valign: 'middle', border: { type: 'solid', pt: 1, color: 'D8CFBF' }, margin: 0.12 });
      T(s, '기관은 이 일을 덜어내는 값으로 프로그램 1건 운영 대행료를 냅니다 (금액 추후 협의)', { x: 0.7, y: 6.0, w: 11.9, h: 0.5, fontSize: 16, bold: true, color: RUST });
      break;
    }
    case 'vibe': {
      s = content(sl);
      card(s, 0.7, 1.95, 6.0, 4.2);
      T(s, '대전은 빵, 강경은 젓갈.\n프로그램마다 내용이 다릅니다.\n\n매번 개발자를 쓰면 작은 성당·문화원은 감당하지 못합니다.\n바이브코딩이라 혼자서도 말로 빠르게 만듭니다.', { x: 1.1, y: 2.2, w: 5.2, h: 3.7, fontSize: 18, valign: 'top', paraSpaceAfter: 4 });
      T(s, '이번 주에 실제로 만든 것', { x: 7.2, y: 1.95, w: 5.4, h: 0.5, fontSize: 18, bold: true, color: RUST });
      T(s, sl.bullets.slice(0, 2).map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < 1 } })), { x: 7.2, y: 2.55, w: 5.4, h: 1.6, fontSize: 17, paraSpaceAfter: 10 });
      T(s, '515', { x: 7.2, y: 4.3, w: 3, h: 1.1, fontFace: HEAD, fontSize: 64, bold: true, color: DARK });
      T(s, '자동 검사 모두 통과', { x: 7.2, y: 5.45, w: 5, h: 0.4, fontSize: 15, color: MUTED });
      break;
    }
    case 'next': {
      s = content(sl);
      sl.steps.forEach((st, i) => {
        const x = 0.7 + i * 3.0;
        s.addShape(pres.shapes.CHEVRON, { x, y: 2.1, w: 2.9, h: 1.0, fill: { color: i === 3 ? RUST : DARK }, line: { color: PAPER } });
        T(s, st, { x: x + 0.35, y: 2.1, w: 2.2, h: 1.0, align: 'center', valign: 'middle', fontSize: 16, bold: true, color: 'FFFFFF' });
      });
      card(s, 0.7, 3.6, 5.8, 2.5);
      T(s, '2호 · 논산 강경', { x: 1.1, y: 3.85, w: 5, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: RUST });
      T(s, '강경성당과 근대 거리\n이후 후보: 공주, 아산 공세리', { x: 1.1, y: 4.55, w: 5, h: 1.2, fontSize: 17 });
      card(s, 6.8, 3.6, 5.8, 2.5);
      T(s, '다시 안내', { x: 7.2, y: 3.85, w: 5, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: DARK });
      T(s, '1호에서 안내에 동의한 분께\n2호 소식을 바로 보냅니다', { x: 7.2, y: 4.55, w: 5, h: 1.2, fontSize: 17 });
      break;
    }
    case 'open': {
      s = content(sl);
      sl.bullets.forEach((b, i) => {
        const y = 2.0 + i * 0.95;
        const [h, rest] = b.split(': ');
        s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: y + 0.12, w: 0.22, h: 0.22, fill: { color: RUST }, line: { color: RUST } });
        T(s, [{ text: `${h}  `, options: { bold: true } }, { text: rest, options: { color: MUTED } }], { x: 1.15, y, w: 11.4, h: 0.5, fontSize: 18, valign: 'middle' });
      });
      T(s, '모두 아이디어 단계의 기획이며, 협의해서 확정합니다.', { x: 0.7, y: 6.0, w: 11.9, h: 0.5, fontSize: 16, color: MUTED });
      break;
    }
  }
  s.addNotes(`[${sl.sec}초] ${sl.say}`);
}

// 시연 장 이미지 2장(접수·기관 화면)을 나란히 다시 배치
pres.writeFile({ fileName: out }).then(() => console.log('wrote', out));
