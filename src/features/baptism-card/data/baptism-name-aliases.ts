/**
 * 한국어 세례명의 「많이 쓰는 다른 표기」 — 버튼에 「체칠리아(세실리아)」처럼 함께 보이고 검색에도 걸린다.
 * (사장님 결정 2026-11-19: 공식 표기는 지키고 익숙한 표기를 괄호로 붙인다)
 *
 * baptism-names.ts 는 export_to_app.py 가 만드는 파일이라 손으로 고치지 않는다 — 그래서 따로 둔다.
 * 왼쪽 열쇠는 세례명 카드 slug, 값은 한국어 화면에서만 쓴다(외국어는 원래 표기 그대로).
 * 넣는 기준: 옛 공식 표기이거나 신자들이 실제로 흔히 쓰는 표기. 개신교식 표기(바울·마가 등)는 넣지 않는다.
 */
export const KO_NAME_ALIASES: Readonly<Record<string, string>> = {
  Cecilia: '세실리아',
  Teresa: '테레사',
  Catherine: '카타리나',
  Lucy: '루시아',
  Agnes: '아네스',
  Elizabeth: '엘리자벳',
  Margaret: '마가렛',
  Esther: '에스더',
  Clare: '글라라',
  Philip: '필립',
  Henry: '헨리',
  Thomas: '토마',
  Luke: '루가',
  Francis: '프란체스코',
  Augustine: '아우구스띠노',
  Bibiana: '비비아나',
};
