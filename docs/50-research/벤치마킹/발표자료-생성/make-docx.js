const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType,
} = require('docx');
const C = require('./content');

const FONT = 'Malgun Gothic';
const out = process.argv[2];
const mmss = (s) => `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;
const total = C.slides.reduce((n, s) => n + s.sec, 0);

const p = (text, opt = {}) =>
  new Paragraph({ spacing: { after: 100 }, ...opt.para, children: [new TextRun({ text, ...opt.run })] });
const label = (k, v) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: `${k}  `, bold: true, color: '9C3B22' }), new TextRun(v)],
  });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
const W = [700, 5300, 1300, 1726];
const cell = (text, w, head) =>
  new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: '1E2430' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: head, color: head ? 'FFFFFF' : undefined })] })],
  });

const summary = new Table({
  width: { size: W.reduce((a, b) => a + b), type: WidthType.DXA },
  columnWidths: W,
  rows: [
    new TableRow({ tableHeader: true, children: ['장', '제목', '시간', '누적'].map((t, i) => cell(t, W[i], true)) }),
    ...(() => {
      let acc = 0;
      return C.slides.map((s, i) => {
        acc += s.sec;
        return new TableRow({
          children: [String(i + 1), s.t, `${s.sec}초`, mmss(acc)].map((t, j) => cell(t, W[j])),
        });
      });
    })(),
  ],
});

const body = [
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('본선 발표 흐름 (가안 v3)')] }),
  p(`2026 한남대 AI 바이브코딩 아이디어 경진대회 · 11/12(목) 14:00 · 발표 8분 + 질의 7분`, { run: { color: '595959' } }),
  p(`${C.presenter} · 1호 「${C.title}」`, { run: { color: '595959' } }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('핵심 한 문장')] }),
  p(C.core, { run: { bold: true } }),
  p('근거: 제출 제안서 §1·§3·§4, 「아이디어 취지와 실현 계획」(11/8). 기관 비용 방식 = 프로그램 1건 운영 대행료(11/8 확정).', { run: { color: '595959', size: 18 } }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`장별 흐름 (총 ${C.slides.length}장, ${mmss(total)})`)] }),
  summary,
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun('장별 요지와 대본')] }),
];

C.slides.forEach((s, i) => {
  body.push(
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${i + 1}. ${s.t}  (${s.sec}초)`)] }),
    label('요지', s.point),
    label('말할 대본', s.say),
  );
});

const doc = new Document({
  creator: '노희선',
  title: '본선 발표 흐름 가안 v3',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: FONT, size: 40, bold: true, color: '1E2430' }, paragraph: { spacing: { before: 0, after: 160 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: '1E2430' }, paragraph: { spacing: { before: 320, after: 120 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: '9C3B22' }, paragraph: { spacing: { before: 240, after: 80 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children: body }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('wrote', path.basename(out), buf.length);
});
