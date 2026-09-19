import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 개인정보 안내.
 *
 * ⚠️ 법률 문구를 여기서 확정하지 않는다. 운영자가 정해야 하는 값(보유기간·책임자·문의처 등)은
 * `needsOperator: true` 로 표시해 화면에 "운영자 확인 필요"로 드러낸다 — 빈칸을 그럴듯한 말로
 * 채워 두면 심사·이용자 모두에게 거짓이 된다. 값이 확정되면 이 표만 고치면 된다.
 *
 * 항목은 재기획(2026-09-14)이 요구한 6가지: 수집 항목 · 이용 목적 · 보유기간 · 삭제 방법 ·
 * 문의 연락처 · 외부 서비스 이용. 한국어·영어를 같이 둔다(그 외 언어는 영어로).
 */
interface PrivacyItem {
  title: { ko: string; en: string };
  body: { ko: string; en: string };
  /** 운영자가 확정해야 하는 값이 아직 비어 있음 */
  needsOperator?: boolean;
}

const ITEMS: PrivacyItem[] = [
  {
    title: { ko: '수집하는 항목', en: 'What we collect' },
    body: {
      ko: '회원 가입 시 이메일, 비밀번호(암호화 저장), 이름 또는 닉네임. 성지 기록 작성 시 성지·방문일·메모·(선택) 사진. 접속 통계용 익명 식별자(이름·이메일과 연결하지 않음). 현재 위치는 「현재 위치 사용」을 켠 동안 기기 안에서만 쓰고 서버로 보내지 않습니다.',
      en: 'On sign-up: email, password (stored hashed), and a name or nickname. When writing a visit record: shrine, visit date, note and optional photos. An anonymous identifier for usage statistics (not linked to name or email). Your current location is used on the device only while “Use current location” is on and is never sent to our server.',
    },
  },
  {
    title: { ko: 'AI 가이드(미카엘) 대화', en: 'AI guide (Michael) conversations' },
    body: {
      ko: '로그인한 상태에서 미카엘에게 한 질문과 답은 계정에 저장되어 다음에 열어도 이어서 볼 수 있습니다. 본인만 볼 수 있고, 대화창의 「대화 지우기」로 언제든 전부 삭제됩니다. 로그인하지 않으면 저장하지 않습니다. 질문에 이름·연락처 같은 개인정보를 넣지 마세요. 답변 생성에는 Google Gemini 를 사용하며 질문 내용이 그 서비스로 전송됩니다.',
      en: 'While signed in, your questions to Michael and its answers are saved to your account so the conversation continues next time. Only you can see them, and "Clear chat" in the chat window deletes them all at any time. Nothing is saved when you are not signed in. Please do not include personal details such as names or contact information in questions. Answers are generated with Google Gemini, so question text is sent to that service.',
    },
  },
  {
    title: { ko: '이용 목적', en: 'Why we use it' },
    body: {
      ko: '로그인과 본인 확인, 성지 기록의 저장·표시, 서비스 이용 통계. 다른 목적으로 쓰거나 동의 없이 제3자에게 제공하지 않습니다.',
      en: 'Sign-in and identity verification, storing and showing your visit records, and usage statistics. We do not use it for other purposes or share it with third parties without consent.',
    },
  },
  {
    title: { ko: '보유 기간', en: 'Retention period' },
    body: {
      ko: '회원 탈퇴 또는 삭제 요청 시 지체 없이 삭제합니다. 법령이 정한 보존 기간이 있는 항목은 그 기간 동안만 보관합니다. ▶ 구체적 기간(예: 접속 기록 N개월)은 운영자가 확정해야 합니다.',
      en: 'Deleted without delay upon account withdrawal or deletion request. Items with a statutory retention period are kept only for that period. ▶ Specific periods (e.g. access logs for N months) must be confirmed by the operator.',
    },
    needsOperator: true,
  },
  {
    title: { ko: '삭제 방법', en: 'How to delete' },
    body: {
      ko: '성지 기록은 「내 기록」에서 직접 삭제할 수 있습니다. 계정 삭제는 문의 연락처로 요청하면 처리합니다. ▶ 앱 안 계정 삭제 버튼은 준비 중입니다.',
      en: 'Visit records can be deleted directly in “My records”. Account deletion is handled on request through the contact below. ▶ An in-app account deletion button is being prepared.',
    },
    needsOperator: true,
  },
  {
    title: { ko: '문의 연락처', en: 'Contact' },
    body: {
      ko: '▶ 개인정보 담당자 이름·이메일은 운영자가 확정해야 합니다. 확정 전에는 자주 묻는 질문 화면의 연락 방법을 이용해 주세요.',
      en: '▶ The name and email of the privacy officer must be confirmed by the operator. Until then, please use the contact method on the FAQ page.',
    },
    needsOperator: true,
  },
  {
    title: { ko: '외부 서비스 이용', en: 'Third-party services' },
    body: {
      ko: '인증·데이터 저장은 Supabase, 웹 호스팅은 Vercel 을 사용합니다. 주변 관광 정보와 예상 붐빔 정도는 한국관광공사 OpenAPI(TourAPI)를 실시간으로 호출하며 응답을 저장하지 않습니다. 외부 지도(Google·Apple·카카오·T맵·네이버)는 링크로만 열리며 각 서비스의 정책을 따릅니다.',
      en: 'Authentication and data storage use Supabase; web hosting uses Vercel. Nearby tourism information and expected crowding are fetched live from the Korea Tourism Organization OpenAPI (TourAPI) and responses are not stored. External maps (Google, Apple, Kakao, T map, Naver) open by link only and follow their own policies.',
    },
  },
];

export default function PrivacyPage() {
  const { language } = useSettings();
  const lang: 'ko' | 'en' = language === 'ko' ? 'ko' : 'en';

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader
        back
        title={lang === 'ko' ? '개인정보 안내' : 'Privacy notice'}
        sub={
          lang === 'ko'
            ? '이 안내는 초안입니다. ▶ 표시가 있는 항목은 운영자가 값을 확정한 뒤 갱신됩니다.'
            : 'This notice is a draft. Items marked ▶ will be updated once the operator confirms the values.'
        }
      />

      <div className="mt-2">
        {ITEMS.map((item) => (
          <article key={item.title.en} className="mb-8">
            <h2 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold text-app-text">
              {item.title[lang]}
              {item.needsOperator && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {lang === 'ko' ? '운영자 확인 필요' : 'Operator to confirm'}
                </span>
              )}
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-app-text-muted">
              {item.body[lang]}
            </p>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}
