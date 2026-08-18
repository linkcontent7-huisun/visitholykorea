import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 자주 묻는 질문.
 *
 * 투어원패스 고객센터(pass.knto.or.kr/faq)의 구성을 참고했다 —
 * 탭 2개(회원가입 및 로그인 / 서비스 이용) + 아코디언.
 * 답변은 실제 구현된 기능만 적는다. 없는 기능을 약속하지 않는다.
 */

type 탭 = '회원가입 및 로그인' | '서비스 이용';

const FAQ: Record<탭, { q: string; a: string }[]> = {
  '회원가입 및 로그인': [
    {
      q: '어떤 방법으로 로그인할 수 있나요?',
      a: `네 가지 방법이 있습니다.
1. 이메일 회원가입 후 로그인
2. 카카오 계정으로 간편 로그인
3. 구글 계정으로 간편 로그인
4. 네이버·페이스북 계정으로 간편 로그인
SNS 간편 로그인은 별도 회원가입 절차 없이 첫 로그인과 동시에 가입됩니다.`,
    },
    {
      q: '회원가입 없이도 이용할 수 있나요?',
      a: `네. 성지 정보 열람, 지도, 순례 코스, 검색은 로그인 없이 모두 이용할 수 있습니다.
순례 스탬프와 여행기처럼 "나의 기록"을 남기는 기능만 로그인이 필요합니다.`,
    },
    {
      q: 'SNS 계정으로 가입하면 비밀번호를 따로 만들어야 하나요?',
      a: `아니요. SNS 로그인은 해당 서비스(카카오·구글 등)의 인증을 그대로 사용하므로 별도 비밀번호를 만들지 않습니다. 비밀번호는 저희에게 전달되지 않습니다.`,
    },
    {
      q: '이메일 가입을 했는데 로그인이 안 돼요.',
      a: `이메일 가입 시 확인 메일이 발송됩니다. 메일함(스팸함 포함)에서 확인 메일의 링크를 눌러야 로그인할 수 있습니다. 메일이 오지 않았다면 다른 이메일로 다시 가입하시거나 SNS 간편 로그인을 이용해 주세요.`,
    },
    {
      q: '수집하는 개인정보는 무엇인가요?',
      a: `이메일 주소와 이름(또는 닉네임)만 수집합니다. SNS 로그인 시에도 본인 식별에 필요한 이 두 가지만 제공받으며, 그 외 정보는 요청하지 않습니다. 자세한 내용은 이용약관에서 확인할 수 있습니다.`,
    },
  ],
  '서비스 이용': [
    {
      q: 'Visit Holy Korea 가 무엇인가요?',
      a: `한국 가톨릭 성지 208곳을 안내하는 순례 웹앱입니다. 성지 소개와 지도, 박해의 역사를 따라 걷는 순례 코스, 감정 기반 성지 추천, 순례 기록(스탬프·여행기) 기능을 제공합니다.`,
    },
    {
      q: '성지 소개 글은 어디에서 온 정보인가요?',
      a: `각 교구 공식 홈페이지의 성지 안내, 한국천주교주교회의 자료 등 확인된 출처를 기반으로 작성합니다. 확인되지 않은 이야기는 싣지 않는 것을 원칙으로 합니다.`,
    },
    {
      q: '미사 시간은 정확한가요?',
      a: `교구 공식 자료 기준으로 안내하지만, 미사 시간과 개방 여부는 현지 사정에 따라 수시로 바뀝니다. 방문 전에 반드시 각 성지 사무실에 전화로 확인해 주세요. 성지 상세 화면에 전화번호를 함께 안내하고 있습니다.`,
    },
    {
      q: '주변 관광지·축제 정보는 어떻게 제공되나요?',
      a: `한국관광공사 TourAPI를 통해 매번 실시간으로 조회해 보여드립니다. 저장해 두고 재사용하지 않으므로 항상 최신 정보입니다.`,
    },
    {
      q: 'AI 순례 가이드의 답변은 믿을 수 있나요?',
      a: `AI 가이드 '미카엘'은 저희 성지 데이터베이스 안의 내용만으로 답하도록 제한되어 있고, 모르는 것은 모른다고 답합니다. 다만 AI 답변은 참고용이며, 중요한 정보(미사 시간·개방 여부 등)는 성지 사무실에 확인해 주세요.`,
    },
    {
      q: '성지 사진의 출처는 무엇인가요?',
      a: `직접 촬영한 사진과 자유 라이선스(Wikimedia Commons 등) 사진을 사용하며, 라이선스 표기가 필요한 사진은 화면에 출처를 함께 표시합니다.`,
    },
  ],
};

export default function FaqPage() {
  const navigate = useNavigate();
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const [탭선택, set탭선택] = useState<탭>('회원가입 및 로그인');
  const [열린질문, set열린질문] = useState<string | null>(null);

  return (
    <div className={`mx-auto flex min-h-screen ${widthClass} flex-col bg-white`}>
      <div className="flex h-16 shrink-0 items-center px-4">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-800" aria-label="뒤로 가기">
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-16">
        <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">자주 묻는 질문</h1>
        <p className="mb-8 text-sm font-medium text-slate-400">
          Visit Holy Korea 를 이용하며 자주 묻는 질문입니다.
        </p>

        {/* 탭 */}
        <div className="mb-6 flex overflow-hidden rounded-xl border border-slate-200" role="tablist">
          {(Object.keys(FAQ) as 탭[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={탭선택 === tab}
              onClick={() => {
                set탭선택(tab);
                set열린질문(null);
              }}
              className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
                탭선택 === tab ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 아코디언 */}
        <div className="space-y-3">
          {FAQ[탭선택].map(({ q, a }) => {
            const 열림 = 열린질문 === q;
            return (
              <div key={q} className="overflow-hidden rounded-xl border border-slate-100">
                <button
                  onClick={() => set열린질문(열림 ? null : q)}
                  aria-expanded={열림}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="flex items-start gap-3">
                    <span className="font-black text-blue-600" aria-hidden>
                      Q
                    </span>
                    <span className="text-[15px] font-bold text-slate-800">{q}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${열림 ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {열림 && (
                  <p className="whitespace-pre-line border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600">
                    {a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
