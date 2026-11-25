import type { ReactNode } from 'react';
import shapes from '../data/diocese-shapes.json';
import { DIOCESE_INFO, dioceseText, type DioceseIcon } from '../data/diocese-info';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import type { Language } from '@/shared/i18n/dictionary';
import { TILT } from '../lib/relief';

/**
 * 입체감 있는 교구 지도 — 성지 찾기(/search) 지도 (지시서 10호, 사장님 결정 2026-11-25 «세련 A · SVG 그림 안»).
 *
 * 평평한 파스텔 지도(DioceseLayer)를 세로로 살짝 눌러(TILT) 눕힌 판처럼 보이게 하고, 교구마다
 * 윗면(위에서 비추는 빛 그라데이션) + 어두운 옆면 + 흐린 그림자 세 겹으로 두께를 낸다. 3D 라이브러리는 쓰지 않는다.
 * 바다는 하늘색에 구름·물결·배 몇 개, 땅은 선명한 구획색 + 또렷한 외곽선(사장님 참고 일러스트에서 «밝고 친근한» 톤만 빌림).
 * 교구마다 그림 하나(diocese-info.ts — 근거가 있는 것만). 그림 → 점 → 글자 순서로 그려 글자가 늘 가장 잘 보이게 한다.
 * 교구 이름 글자를 늘 둔다 — 색만으로 교구를 가르지 않는다.
 *
 * 성지 점은 이 층이 아니라 SearchResultsMap 이 그린다 — 좌표에 TILT 를 곱해서.
 */
interface DioceseShape {
  diocese: string;
  path: string;
  label: [number, number];
}

/** 옆면 두께(지도 좌표) */
const DEPTH = 10;

/** 땅색 — 교구 이름(#13244a) 대비 6.8:1 이상(WCAG 4.5:1 넘음, 2026-11-25 계산) */
const FILL: Record<string, string> = {
  서울: '#F7A98B',
  인천: '#8EC3EC',
  의정부: '#B9A3E3',
  수원: '#F6CF6B',
  춘천: '#9ED98A',
  원주: '#F4A6A6',
  대전: '#F2B865',
  청주: '#7FD1A6',
  전주: '#C7A6EA',
  광주: '#8FB8EE',
  대구: '#F59C7A',
  안동: '#E9D27A',
  마산: '#86D3B0',
  부산: '#C9A7EC',
  제주: '#F7B36B',
};
const INK = '#13244a';

/** 좁은 교구의 글자를 이웃과 겹치지 않게 미는 값 (DioceseLayer 와 같은 값) */
const LABEL_OFFSET: Record<string, [number, number]> = {
  서울: [30, -34],
  인천: [-58, 22],
};

function darker(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f)).join(',')})`;
}

function labelPoint(s: DioceseShape): [number, number] {
  const o = LABEL_OFFSET[s.diocese] ?? [0, 0];
  return [s.label[0] + o[0], (s.label[1] + o[1]) * TILT];
}

/** 바다 장식 — 구름·물결·배. 누를 수 없고 화면 읽기에서도 빠진다 */
function SeaDecor() {
  const waves: Array<[number, number]> = [
    [60, 120],
    [700, 60],
    [80, 520],
    [780, 430],
    [40, 760],
    [720, 820],
    [520, 960],
    [120, 930],
  ];
  const cloud = (x: number, y: number, s: number) =>
    `M${x} ${y}h${60 * s}a${14 * s} ${14 * s} 0 0 0-${14 * s}-${16 * s}a${20 * s} ${20 * s} 0 0 0-${34 * s}-${4 * s}a${14 * s} ${14 * s} 0 0 0-${12 * s} ${20 * s}z`;
  const boat = (x: number, y: number, s: number, key: string) => (
    <g key={key}>
      <path d={`M${x - 18 * s} ${y}h${36 * s}l-${7 * s} ${9 * s}h-${22 * s}z`} fill="#3b5bab" />
      <path
        d={`M${x} ${y - 2}v-${28 * s}l${15 * s} ${24 * s}z`}
        fill="#fff"
        stroke="#3b5bab"
        strokeWidth={1.5}
      />
    </g>
  );
  return (
    <g
      aria-hidden
      className="pointer-events-none motion-safe:animate-[sea-drift_26s_linear_infinite_alternate]"
    >
      {waves.map(([x, y]) => (
        <g key={`${x}-${y}`} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.7}>
          <path d={`M${x} ${y}h44`} />
          <path d={`M${x + 26} ${y + 14}h30`} />
        </g>
      ))}
      <g fill="#fff" opacity={0.95}>
        <path d={cloud(140, 90, 1)} />
        <path d={cloud(790, 250, 1.2)} />
        <path d={cloud(90, 650, 0.9)} />
      </g>
      {boat(130, 380, 1, 'b1')}
      {boat(860, 690, 1.2, 'b2')}
      {boat(430, 930, 0.9, 'b3')}
    </g>
  );
}

/** 교구 그림 — 28×28 칸에 그린 단순한 선 그림(휴대폰마다 모양이 같도록 이모지 대신) */
function Icon({ kind }: { kind: DioceseIcon }) {
  const p = (d: string, fill: string, extra: Record<string, string | number> = {}) => (
    <path d={d} fill={fill} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" {...extra} />
  );
  const shapesOf: Record<DioceseIcon, ReactNode> = {
    church: (
      <>
        {p('M6 26V13l8-7 8 7v13z', '#fff')}
        {p('M14 2v6M11 4.5h6', 'none')}
        {p('M12 26v-6h4v6', '#8ec3ec')}
      </>
    ),
    boat: (
      <>
        {p('M4 20h20l-4 5H8z', '#3b5bab')}
        {p('M14 3v16M14 5l7 12h-7z', '#fff')}
      </>
    ),
    mountain: (
      <>
        {p('M2 25L11 9l5 8 3-4 7 12z', '#7fb069')}
        {p('M11 9l-3 5 3-1 2 2z', '#fff')}
      </>
    ),
    village: (
      <>
        {p('M5 25V14L14 6l9 8v11z', '#fff')}
        {p('M3 15l11-10 11 10', 'none')}
        {p('M12 25v-6h4v6', '#f2b865')}
      </>
    ),
    pine: (
      <>
        {p('M14 3L6 17h16z', '#4f9d69')}
        {p('M14 9L5 22h18z', '#4f9d69')}
        {p('M13 22h2v4h-2z', '#8a5a3b')}
      </>
    ),
    bamboo: (
      <>
        {p('M9 26V4M18 26V7', 'none', { strokeWidth: 3, stroke: '#4f9d69' })}
        {p('M7 12h4M7 19h4M16 14h4M16 21h4', 'none')}
        {p('M9 8c3-3 7-3 9-1-3 1-6 1-9 1z', '#7fc48a')}
      </>
    ),
    book: (
      <>
        {p('M3 7c4-2 8-2 11 1v17c-3-3-7-3-11-1z', '#fff')}
        {p('M25 7c-4-2-8-2-11 1v17c3-3 7-3 11-1z', '#fff')}
      </>
    ),
    pillar: (
      <>
        {p('M3 10L14 4l11 6z', '#fff')}
        {p('M5 11v12M10 11v12M18 11v12M23 11v12M3 24h22', 'none')}
      </>
    ),
    anchor: (
      <>
        {p('M14 5v19M8 10h12M5 18c2 5 6 6 9 6s7-1 9-6', 'none', {
          strokeWidth: 2.4,
          strokeLinecap: 'round',
        })}
        <circle cx={14} cy={4} r={2.4} fill="#fff" stroke={INK} strokeWidth={1.4} />
      </>
    ),
    island: (
      <>
        {p('M3 24c4-4 18-4 22 0z', '#f2d28b')}
        {p('M14 22V10', 'none', { strokeWidth: 2 })}
        {p('M14 10c-4-3-8-2-10 0 3 0 6 0 10 0zM14 10c4-3 8-2 10 0-3 0-6 0-10 0z', '#4f9d69')}
      </>
    ),
    dove: <>{p('M4 16c4-1 7-5 9-9 1 4 3 6 6 6l6-2-4 5c-2 5-8 7-13 5z', '#fff')}</>,
    orange: (
      <>
        <circle cx={14} cy={16} r={9} fill="#f59e2b" stroke={INK} strokeWidth={1.4} />
        {p('M14 7c2-3 5-4 7-3-1 3-4 4-7 3z', '#4f9d69')}
      </>
    ),
  };
  return <>{shapesOf[kind]}</>;
}

const LIFT_CLASS = 'motion-safe:transition-[transform,opacity] motion-safe:duration-[250ms]';

interface DioceseReliefProps {
  language: Language;
  /** 누른 교구(떠오르고 금빛 테두리). 다른 교구는 흐려진다 */
  selected: string | null;
  onSelect: (diocese: string) => void;
  /** 바깥에서 고른 교구(예전 DioceseLayer 의 highlight) — 고른 교구가 없을 때 이 교구만 진하게 */
  highlight?: string | null;
}

/** 바다·그림자·교구 판(누를 수 있음) — 성지 점보다 아래 층 */
export function DioceseRelief({
  language,
  selected,
  onSelect,
  highlight = null,
}: DioceseReliefProps) {
  const focus = selected ?? (highlight && highlight !== '전체' ? highlight : null);
  const list = shapes as DioceseShape[];
  return (
    <g>
      <defs>
        <filter id="dio-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        {/* 위에서 비추는 빛 — 윗면 위쪽이 밝고 아래쪽이 살짝 어둡다 */}
        <linearGradient id="dio-light" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#fff" stopOpacity={0.38} />
          <stop offset={0.55} stopColor="#fff" stopOpacity={0.06} />
          <stop offset={1} stopColor="#000" stopOpacity={0.06} />
        </linearGradient>
      </defs>
      <SeaDecor />
      <g transform={`matrix(1,0,0,${TILT},0,0)`}>
        <g
          aria-hidden
          filter="url(#dio-shadow)"
          opacity={0.3}
          transform={`translate(10,${DEPTH * 2.4})`}
        >
          {list.map((s) => (
            <path key={s.diocese} d={s.path} fill="#1d4e7a" />
          ))}
        </g>
        {/* 해안 하이라이트 — 땅 둘레의 옅은 흰 띠 */}
        <g aria-hidden>
          {list.map((s) => (
            <path
              key={s.diocese}
              d={s.path}
              fill="none"
              stroke="#e8f6ff"
              strokeWidth={16}
              strokeLinejoin="round"
              opacity={0.85}
            />
          ))}
        </g>
        {list.map((s) => {
          const info = DIOCESE_INFO.find((d) => d.key === s.diocese);
          const isSel = selected === s.diocese;
          const dim = focus !== null && focus !== s.diocese;
          const fill = FILL[s.diocese] ?? '#EEF0F6';
          return (
            <g
              key={s.diocese}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={info ? dioceseText(info.name, language) : s.diocese}
              data-diocese={s.diocese}
              className={`cursor-pointer outline-none focus-visible:[&>.top]:stroke-[#c9961a] focus-visible:[&>.top]:[stroke-width:4.5] ${LIFT_CLASS}`}
              style={{ transform: isSel ? 'translateY(-12px)' : undefined, opacity: dim ? 0.6 : 1 }}
              onClick={() => onSelect(s.diocese)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(s.diocese);
                }
              }}
            >
              <path
                d={s.path}
                fill={darker(fill, 0.62)}
                transform={`translate(0,${DEPTH})`}
                stroke={INK}
                strokeWidth={1.6}
              />
              <path
                className="top"
                d={s.path}
                fill={fill}
                stroke={isSel ? '#c9961a' : INK}
                strokeWidth={isSel ? 4.5 : 1.8}
                strokeLinejoin="round"
              />
              <path d={s.path} fill="url(#dio-light)" pointerEvents="none" />
            </g>
          );
        })}
      </g>
      {/* 교구 그림 — 점·글자보다 먼저(아래) 그린다 */}
      <g aria-hidden className="pointer-events-none">
        {list.map((s) => {
          const info = DIOCESE_INFO.find((d) => d.key === s.diocese);
          if (!info?.icon) return null;
          const [x, y] = labelPoint(s);
          const ix = x + (s.diocese === '인천' ? -52 : 0);
          const iy = y - (s.diocese === '인천' ? 6 : 44);
          const lifted = selected === s.diocese;
          const dim = focus !== null && focus !== s.diocese;
          return (
            <g
              key={s.diocese}
              className={LIFT_CLASS}
              style={{ transform: lifted ? 'translateY(-9px)' : undefined, opacity: dim ? 0.5 : 1 }}
            >
              <g transform={`translate(${ix - 21},${iy - 21}) scale(1.5)`}>
                <Icon kind={info.icon} />
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** 교구 이름 — 성지 점 위(맨 위 층)에 정면으로. 흰 외곽선으로 어떤 땅색 위에서도 읽힌다 */
export function DioceseLabels({
  language,
  selected,
  highlight = null,
}: {
  language: Language;
  selected: string | null;
  highlight?: string | null;
}) {
  const focus = selected ?? (highlight && highlight !== '전체' ? highlight : null);
  return (
    <g aria-hidden className="pointer-events-none">
      {(shapes as DioceseShape[]).map((s) => {
        const [x, y] = labelPoint(s);
        const dim = focus !== null && focus !== s.diocese;
        return (
          <text
            key={s.diocese}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={26}
            fontWeight={800}
            fill={INK}
            stroke="#fff"
            strokeWidth={6}
            strokeLinejoin="round"
            paintOrder="stroke"
            className={LIFT_CLASS}
            style={{
              transform: selected === s.diocese ? 'translateY(-9px)' : undefined,
              opacity: dim ? 0.5 : 1,
            }}
          >
            {localizeRegionName(s.diocese, language)}
          </text>
        );
      })}
    </g>
  );
}
