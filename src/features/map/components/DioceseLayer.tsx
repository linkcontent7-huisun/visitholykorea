import shapes from '../data/diocese-shapes.json';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import type { Language } from '@/shared/i18n/dictionary';

/**
 * 한국 윤곽 + 교구 15개 구획 (2026-09-12).
 *
 * 흰 바탕에 점만 찍힌 조망도가 "어디가 어딘지" 안 보인다는 사장님 지적. 종이 순례 지도책처럼
 * 교구마다 옅은 색을 깔고 경계를 흰 선으로 그린다. 군종교구는 영토가 없어 그리지 않는다.
 *
 * 모양은 통계청 2018 시군구 경계를 교구 관할(천주교 주소록 기준)로 합쳐 만들었고,
 * 좌표는 `projection.ts` 와 같은 식으로 미리 옮겨 두었다(`diocese-shapes.json`, 57KB).
 * 만드는 스크립트: docs/70-agent-workspace/ 의 9/12 인수인계 참조.
 */
interface DioceseShape {
  diocese: string;
  path: string;
  label: [number, number];
}

/** 인접 교구끼리 같은 색이 되지 않게 손으로 고른 옅은 색. 책 지도의 파스텔 톤을 따랐다. */
const FILL: Record<string, string> = {
  서울: '#F6D5C4',
  인천: '#D9E6F7',
  의정부: '#E7DCF3',
  수원: '#FBE7C2',
  춘천: '#D8EFE0',
  원주: '#F9DBDB',
  대전: '#FBE7C2',
  청주: '#D8EFE0',
  전주: '#E7DCF3',
  광주: '#D9E6F7',
  대구: '#F6D5C4',
  안동: '#FBE7C2',
  마산: '#D8EFE0',
  부산: '#E7DCF3',
  제주: '#F9DBDB',
};

/** 좁은 교구의 글자를 이웃과 겹치지 않게 미는 값 (그림 좌표). 서울은 작아서 위로, 인천은 바다 쪽으로 */
const LABEL_OFFSET: Record<string, [number, number]> = {
  서울: [30, -34],
  인천: [-58, 22],
};

export function DioceseLayer({
  language,
  highlight,
}: {
  language: Language;
  /** 지도 화면에서 고른 교구. 있으면 그 교구만 진하게, 나머지는 흐리게 */
  highlight: string | null;
}) {
  return (
    <g aria-hidden>
      {(shapes as DioceseShape[]).map((s) => {
        const dim = highlight && highlight !== '전체' && highlight !== s.diocese;
        return (
          <path
            key={s.diocese}
            d={s.path}
            fill={FILL[s.diocese] ?? '#EEF0F6'}
            fillOpacity={dim ? 0.35 : 1}
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        );
      })}
      {(shapes as DioceseShape[]).map((s) => {
        const dim = highlight && highlight !== '전체' && highlight !== s.diocese;
        return (
          <text
            key={`${s.diocese}-label`}
            x={s.label[0] + (LABEL_OFFSET[s.diocese]?.[0] ?? 0)}
            y={s.label[1] + (LABEL_OFFSET[s.diocese]?.[1] ?? 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={22}
            fontWeight={800}
            fill="#1e3a8a"
            fillOpacity={dim ? 0.35 : 0.55}
            style={{ pointerEvents: 'none' }}
          >
            {localizeRegionName(s.diocese, language)}
          </text>
        );
      })}
    </g>
  );
}
