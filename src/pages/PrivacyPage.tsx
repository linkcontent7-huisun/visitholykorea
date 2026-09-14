import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
      ko: '회원 가입 시 이메일, 비밀번호(암호화 저장), 이름 또는 닉네임. 방문 기록 작성 시 성지·방문일·메모·(선택) 사진. 접속 통계용 익명 식별자(이름·이메일과 연결하지 않음). 현재 위치는 「현재 위치 사용」을 켠 동안 기기 안에서만 쓰고 서버로 보내지 않습니다.',
      en: 'On sign-up: email, password (stored hashed), and a name or nickname. When writing a visit record: shrine, visit date, note and optional photos. An anonymous identifier for usage statistics (not linked to name or email). Your current location is used on the device only while “Use current location” is on and is never sent to our server.',
    },
  },
  {
    title: { ko: '이용 목적', en: 'Why we use it' },
    body: {
      ko: '로그인과 본인 확인, 방문 기록의 저장·표시, 서비스 이용 통계. 다른 목적으로 쓰거나 동의 없이 제3자에게 제공하지 않습니다.',
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
      ko: '방문 기록은 「내 기록」에서 직접 삭제할 수 있습니다. 계정 삭제는 문의 연락처로 요청하면 처리합니다. ▶ 앱 안 계정 삭제 버튼은 준비 중입니다.',
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
  const navigate = useNavigate();
  const { wideView, language, t } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const lang: 'ko' | 'en' = language === 'ko' ? 'ko' : 'en';

  return (
    <div className={`mx-auto flex min-h-page ${widthClass} flex-col bg-white`}>
      <div className="flex h-16 shrink-0 items-center px-4">
        <button
          onClick={() => navigate(-1)}
          className="min-h-11 min-w-11 p-2 text-slate-800"
          aria-label={t('backAria')}
        >
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="flex-1 px-8 pb-16">
        <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">
          {lang === 'ko' ? '개인정보 안내' : 'Privacy notice'}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          {lang === 'ko'
            ? '이 안내는 초안입니다. ▶ 표시가 있는 항목은 운영자가 값을 확정한 뒤 갱신됩니다.'
            : 'This notice is a draft. Items marked ▶ will be updated once the operator confirms the values.'}
        </p>

        {ITEMS.map((item) => (
          <article key={item.title.en} className="mb-8">
            <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
              {item.title[lang]}
              {item.needsOperator && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-800">
                  {lang === 'ko' ? '운영자 확인 필요' : 'Operator to confirm'}
                </span>
              )}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {item.body[lang]}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
