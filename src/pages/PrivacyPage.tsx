import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 개인정보 안내.
 *
 * 앱의 실제 저장·삭제 동작과 운영자가 확정한 값만 공개한다.
 * 한국어·영어를 같이 둔다(그 외 언어는 영어로).
 */
interface PrivacyItem {
  title: { ko: string; en: string };
  body: { ko: string; en: string };
}

const ITEMS: PrivacyItem[] = [
  {
    title: { ko: '수집하는 항목', en: 'What we collect' },
    body: {
      ko: '회원 가입 시 이메일, 비밀번호(해시 형태), 이름 또는 닉네임을 처리합니다. SNS 로그인 시에는 제공업체가 전달하는 계정 식별 정보와 이메일·이름을 처리합니다. 순례 기록에는 성지·방문일·메모·선택한 사진이, 즐겨찾기와 마음 나침반을 이용하면 선택·응답 내용이 저장됩니다. 기기에만 남기는 방문 표시는 서버에 보내지 않습니다. 현재 위치는 「현재 위치 사용」 중 기기에서만 이용하며 서버에 저장하지 않습니다.',
      en: 'When you create an account, we process your email, password (stored as a hash), and name or nickname. Social sign-in provides an account identifier, email and name. Visit records contain the shrine, visit date, note and optional photos. Favorites and compass answers are saved when used. Device-only visit markers are not sent to our server. Your location is used on your device while location access is on and is not stored on our server.',
    },
  },
  {
    title: { ko: 'AI 가이드(미카엘) 대화', en: 'AI guide (Michael) conversations' },
    body: {
      ko: '로그인한 상태에서 미카엘에게 한 질문과 답은 계정에 저장되어 다음에 열어도 이어서 볼 수 있습니다. 본인만 볼 수 있고, 대화창의 「대화 지우기」로 언제든 전부 삭제됩니다. 로그인하지 않으면 저장하지 않습니다. 질문에 이름·연락처 같은 개인정보를 넣지 마세요. 답변 생성에는 Anthropic Claude 를 사용하며(장애 시 Google Gemini 로 대신 답합니다) 질문 내용이 그 서비스로 전송됩니다.',
      en: 'While signed in, your questions to Michael and its answers are saved to your account so the conversation continues next time. Only you can see them, and "Clear chat" in the chat window deletes them all at any time. Nothing is saved when you are not signed in. Please do not include personal details such as names or contact information in questions. Answers are generated with Anthropic Claude (Google Gemini as a backup when Claude is unavailable), so question text is sent to that service.',
    },
  },
  {
    title: { ko: '이용 목적', en: 'Why we use it' },
    body: {
      ko: '로그인과 본인 확인, 순례 기록·즐겨찾기·AI 대화·마음 나침반 결과의 저장과 표시에 사용합니다. 순례 후기와 첨부 사진은 다른 이용자에게도 공개됩니다.',
      en: 'We use this information to sign you in, verify your identity, and save and show visit records, favorites, AI chats and compass results. Visit notes and attached photos are also visible to other users.',
    },
  },
  {
    title: { ko: '보유 기간', en: 'Retention period' },
    body: {
      ko: '계정 정보와 이에 연결된 순례 기록·사진·즐겨찾기·AI 대화·마음 나침반 응답은 회원이 서비스를 이용하는 동안 보유합니다. 개별 기록을 지우거나 탈퇴하면 해당 정보를 지체 없이 삭제합니다. 다른 법령에 따라 특정 정보를 보존해야 하는 경우에는 해당 항목만 그 법정 기간 동안 분리해 보관합니다. 기기에 저장된 방문 표시는 계정 탈퇴 시 그 기기에서 삭제되며, 브라우저 저장소를 지워도 삭제됩니다.',
      en: 'Account data and linked visit records, photos, favorites, AI chats and compass answers are kept while you use the service. We delete a record when you delete it, and delete account-linked information without delay when you close your account. If another law requires retention of specific information, only that information is kept separately for the required period. Device visit markers are removed from that device when you delete your account or clear browser storage.',
    },
  },
  {
    title: { ko: '삭제 방법', en: 'How to delete' },
    body: {
      ko: '순례 기록은 「내 기록」에서 직접 삭제할 수 있습니다. 탈퇴는 로그인 후 「더보기 → 계정 설정 → 계정 삭제」에서 진행합니다. 사진 원본과 공개 후기를 포함한 연결 정보를 삭제한 뒤 계정을 삭제합니다. 로그인이 어려우면 아래 이메일로 요청하세요. 담당자가 본인 여부를 확인한 뒤 지체 없이 처리하고, 요청 접수 후 10일 이내에 처리 결과를 이메일로 알립니다. 전자 파일은 복구되지 않도록 삭제합니다.',
      en: 'Delete individual visit records in “My records”. To close your account, sign in and choose “More → Account settings → Delete account”. Linked information, including original photos and public notes, is removed before the account. If you cannot sign in, request deletion by email below. We verify your identity, act without delay, and email the result within 10 days of receiving the request. Electronic files are deleted so they cannot be restored.',
    },
  },
  {
    title: { ko: '개인정보 문의 및 고충처리', en: 'Privacy inquiries and complaints' },
    body: {
      ko: 'Visit Holy Korea 운영팀이 개인정보 문의와 고충을 처리합니다. 이메일: visitholykorea@gmail.com',
      en: 'The Visit Holy Korea operations team handles privacy inquiries and complaints. Email: visitholykorea@gmail.com',
    },
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
      <PageHeader back title={lang === 'ko' ? '개인정보 안내' : 'Privacy notice'} />

      <div className="mt-2">
        {ITEMS.map((item) => (
          <article key={item.title.en} className="mb-8">
            <h2 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold text-app-text">
              {item.title[lang]}
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
