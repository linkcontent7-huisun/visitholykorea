import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildXlsx } from './xlsx';

describe('buildXlsx', () => {
  it('엑셀 파일 구조를 갖추고, 한글·0으로 시작하는 연락처·숫자·특수문자를 그대로 담는다', () => {
    const files = unzipSync(
      buildXlsx(
        [
          ['대표자', '연락처', '인원'],
          ['시험 <&>', '010-0000-0000', 3],
        ],
        '접수명단',
      ),
    );
    expect(Object.keys(files).sort()).toEqual(
      [
        '[Content_Types].xml',
        '_rels/.rels',
        'xl/_rels/workbook.xml.rels',
        'xl/styles.xml',
        'xl/workbook.xml',
        'xl/worksheets/sheet1.xml',
      ].sort(),
    );
    const sheet = strFromU8(files['xl/worksheets/sheet1.xml']!);
    expect(sheet).toContain('<t xml:space="preserve">시험 &lt;&amp;&gt;</t>');
    expect(sheet).toContain('<t xml:space="preserve">010-0000-0000</t>');
    expect(sheet).toContain('<c r="C2"><v>3</v></c>');
    expect(sheet).toContain('<c r="A1" t="inlineStr" s="1">');
    expect(strFromU8(files['xl/workbook.xml']!)).toContain('name="접수명단"');
  });
});
