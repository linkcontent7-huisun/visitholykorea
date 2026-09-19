/**
 * 외부 공식 안내 링크.
 *
 * WYD 2027 서울·교구대회(DID) 의 등록·일정·숙박·단체 이동은 이 앱이 아니라 공식 채널이 맡는다.
 * 이 앱은 공식 협력 서비스가 아니므로 그렇게 표현하지 않는다(재기획 §3).
 *
 * URL 은 **운영자가 확인한 값만** 넣는다. `null` 이면 화면은 "운영자 확인 후 연결" 이라고
 * 정직하게 적는다 — 추측한 주소를 넣어 두면 심사·이용자 모두에게 거짓이 된다.
 */
export interface OfficialLink {
  id: 'wyd2027' | 'did' | 'cbck';
  labelKo: string;
  labelEn: string;
  url: string | null;
}

export const OFFICIAL_LINKS: readonly OfficialLink[] = [
  // 2026-09-18 사장님이 직접 확인해 준 주소(운영자 확인 완료).
  {
    id: 'wyd2027',
    labelKo: '2027 서울 세계청년대회(WYD) 공식 안내',
    labelEn: 'WYD Seoul 2027 official site',
    url: 'https://wydseoul.org/',
  },
  // labelEn 은 2026-09-19 에 줄였다 — 영어 화면에서 푸터 6개 항목(약관·개인정보·FAQ·WYD·DID·주교회의)이
  // 한 줄에 안 들어가 줄바꿈됐다(실측). "Days in the Dioceses (DID)" 는 이미 괄호 안에 약어(DID)를
  // 병기하고 있어 풀어쓴 이름을 빼도 뜻이 그대로 통한다.
  {
    id: 'did',
    labelKo: '교구대회(DID) 공식 안내',
    labelEn: 'DID official information',
    url: 'https://www.wyd2027did.org/kr',
  },
  {
    id: 'cbck',
    labelKo: '한국천주교주교회의',
    labelEn: 'Catholic Bishops’ Conference of Korea',
    url: 'https://cbck.or.kr',
  },
];
