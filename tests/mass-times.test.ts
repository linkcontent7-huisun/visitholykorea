import { describe, expect, it } from 'vitest';
import { extractMassLines, findMassLinks, htmlToText } from '../scripts/lib/mass-times';

describe('미사 시간 줄 고르기', () => {
  it('솔뫼성지 공지처럼 한 줄에 「미사」와 시각이 있으면 잡는다', () => {
    const text = htmlToText(
      '<div>매일 오전 7:00, 11:00 에 미사가 있습니다.(성삼일 예외)</div><div>주요정보링크</div>',
    );
    expect(extractMassLines(text)).toEqual([
      '매일 오전 7:00, 11:00 에 미사가 있습니다.(성삼일 예외)',
    ]);
  });

  it('「미사 시간」 제목 아래 표(요일·시각)를 따라 읽는다', () => {
    const html =
      '<h3>미사 시간</h3><table><tr><td>평일</td><td>11:00</td></tr><tr><td>주일</td><td>10:30, 15:00</td></tr></table><p>오시는 길</p>';
    expect(extractMassLines(htmlToText(html))).toEqual(['평일 11:00', '주일 10:30, 15:00']);
  });

  it('시각이 없는 안내문·전화번호 줄은 버린다', () => {
    const text = '미사 봉헌 신청 안내\n전화 041-362-5021\n순례 미사는 사전 예약 필수';
    expect(extractMassLines(text)).toEqual([]);
  });

  it('메뉴에서 미사 링크를 절대 주소로 찾는다', () => {
    const html =
      '<a href="/bbs/content.php?co_id=missatime">미사안내</a><a href="/about">소개</a><a href="javascript:void(0)">미사</a>';
    expect(findMassLinks(html, 'http://solmoe.or.kr/')).toEqual([
      'http://solmoe.or.kr/bbs/content.php?co_id=missatime',
    ]);
  });
});
