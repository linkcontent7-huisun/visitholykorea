import type { ReactElement } from 'react';
import type { SceneKey } from '../data/bread-story';

/**
 * 웹툰 칸 삽화 v2 (2026-11-08) — 따뜻한 손그림 애니메이션 느낌.
 * 하늘 그러데이션·빛 번짐·종이 결(feTurbulence)·겹친 구름과 연기로 깊이를 낸다.
 * 사진을 베끼지 않고 출처의 「사실」만 보고 새로 그린다. 실존 인물은 뒷모습·실루엣만, 상호 로고 없음.
 * 한 화면에 여러 장이 뜨므로 그러데이션·필터 id 는 장면 이름을 앞에 붙여 겹치지 않게 한다.
 */

const INK = '#2a2620';

/** 종이 결 + 부드러운 번짐 — 모든 장면 공통 */
function Defs({ k, children }: { k: string; children?: ReactElement | ReactElement[] }) {
  return (
    <defs>
      {/* 종이 결 — feTurbulence 는 한 화면 13장에서 브라우저를 멈추게 해서, 가벼운 점 무늬로 대신한다 */}
      <pattern id={`${k}-grain`} width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.5" fill="#5a4a3a" opacity="0.10" />
        <circle cx="4" cy="3.5" r="0.4" fill="#fff" opacity="0.12" />
        <circle cx="2.5" cy="5" r="0.35" fill="#5a4a3a" opacity="0.07" />
      </pattern>
      <filter id={`${k}-soft`}>
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${k}-blur8`}>
        <feGaussianBlur stdDeviation="8" />
      </filter>
      {children}
    </defs>
  );
}

const Grain = ({ k }: { k: string }) => (
  <rect width="360" height="240" fill={`url(#${k}-grain)`} pointerEvents="none" />
);

const Sky = ({ id, stops }: { id: string; stops: [string, string][] }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    {stops.map(([o, c]) => (
      <stop key={o} offset={o} stopColor={c} />
    ))}
  </linearGradient>
);

/** 뭉게구름 — 원 여러 개를 겹치고 아랫면에 그림자 */
function Cloud({
  x,
  y,
  s = 1,
  c = '#fffaf0',
  sh = '#e6d6c3',
}: {
  x: number;
  y: number;
  s?: number;
  c?: string;
  sh?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx="34" ry="9" fill={sh} />
      <circle cx="-18" cy="0" r="12" fill={c} />
      <circle cx="0" cy="-8" r="16" fill={c} />
      <circle cx="18" cy="-2" r="12" fill={c} />
      <ellipse cx="0" cy="4" rx="32" ry="8" fill={c} />
    </g>
  );
}

/** 뒷모습 사람 — 머리·외투·다리·짐 */
function Figure({
  x,
  y,
  s = 1,
  coat = '#4a4f63',
  hair = '#2a2620',
  hat = false,
  bundle = false,
  kid = false,
}: {
  x: number;
  y: number;
  s?: number;
  coat?: string;
  hair?: string;
  hat?: boolean;
  bundle?: boolean;
  kid?: boolean;
}) {
  const k = kid ? 0.68 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      <ellipse cx="0" cy="0" rx="9" ry="2.2" fill="#000" opacity="0.18" />
      <rect x="-5" y="-14" width="4" height="14" rx="1.5" fill="#2d2a33" />
      <rect x="1" y="-14" width="4" height="14" rx="1.5" fill="#2d2a33" />
      <path d="M-10 -40 q10 -6 20 0 l3 28 q-13 4 -26 0 z" fill={coat} />
      <path
        d="M-10 -40 q2 14 -3 28"
        stroke="#000"
        strokeOpacity="0.15"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="0" cy="-47" r="7.5" fill="#e9c9a8" />
      <path d="M-7.5 -48 q7.5 -10 15 0 q0 6 -2 8 h-11 q-2 -2 -2 -8z" fill={hair} />
      {hat && <path d="M-9 -51 h18 l-3 -7 h-12 z M-12 -51 h24 v2.5 h-24z" fill="#3a3027" />}
      {bundle && (
        <g>
          <path
            d="M6 -42 q14 -4 16 10 q-8 8 -18 2 z"
            fill="#d8c3a0"
            stroke="#8b6f4e"
            strokeWidth="1"
          />
          <path d="M8 -38 l10 6" stroke="#8b6f4e" strokeWidth="1" />
        </g>
      )}
    </g>
  );
}

/** 김(증기) — 부드러운 원들 */
const Steam = ({ x, y, k, s = 1 }: { x: number; y: number; k: string; s?: number }) => (
  <g
    transform={`translate(${x} ${y}) scale(${s})`}
    filter={`url(#${k}-soft)`}
    fill="#fff"
    opacity="0.85"
  >
    <circle cx="0" cy="0" r="10" />
    <circle cx="8" cy="-16" r="12" />
    <circle cx="-4" cy="-32" r="13" />
    <circle cx="10" cy="-48" r="11" opacity="0.7" />
  </g>
);

function Tree({
  x,
  y,
  s = 1,
  c = '#6f8f4e',
  d = '#4f6b38',
}: {
  x: number;
  y: number;
  s?: number;
  c?: string;
  d?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2.5" y="-18" width="5" height="18" fill="#6b4f36" />
      <circle cx="0" cy="-30" r="16" fill={d} />
      <circle cx="-9" cy="-26" r="11" fill={c} />
      <circle cx="7" cy="-36" r="11" fill={c} />
      <circle cx="3" cy="-24" r="9" fill={c} opacity="0.9" />
    </g>
  );
}

const Title = ({ t, light = false }: { t: string; light?: boolean }) => (
  <g>
    <rect
      x="10"
      y="10"
      width={t.length * 12.5 + 20}
      height="26"
      rx="4"
      fill={light ? '#fffaf0' : '#1d2230'}
      opacity="0.82"
    />
    <text x="20" y="28" fontSize="13" fontWeight="800" fill={light ? INK : '#f6ead2'}>
      {t}
    </text>
  </g>
);

const SCENES: Record<SceneKey, (k: string) => ReactElement> = {
  harbor: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#141b33'],
            ['0.55', '#3a2d4f'],
            ['1', '#7a3b33'],
          ]}
        />
        <radialGradient id={`${k}-fire`} cx="0.2" cy="0.65" r="0.45">
          <stop offset="0" stopColor="#ffb25a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff7a3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${k}-moon`}>
          <stop offset="0.4" stopColor="#fff4d6" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      {[
        [30, 20],
        [80, 40],
        [140, 15],
        [200, 30],
        [250, 55],
        [330, 25],
        [110, 60],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="0.9" fill="#fff" opacity="0.8" />
      ))}
      <circle cx="300" cy="44" r="30" fill={`url(#${k}-moon)`} />
      <circle cx="300" cy="44" r="11" fill="#fff4d6" />
      <rect width="360" height="240" fill={`url(#${k}-fire)`} />
      <g filter={`url(#${k}-blur8)`} fill="#2a1f2a" opacity="0.7">
        <ellipse cx="60" cy="110" rx="60" ry="22" />
        <ellipse cx="110" cy="90" rx="40" ry="18" />
      </g>
      <path d="M0 160 L0 128 L30 120 L46 128 L70 116 L100 126 L130 122 L150 160 Z" fill="#241a1f" />
      <path d="M20 122 l6 -14 l6 14 M60 118 l5 -16 l5 16" fill="#ff9a48" opacity="0.8" />
      <rect y="160" width="360" height="80" fill="#1d2a40" />
      {[170, 182, 196, 212, 228].map((y, i) => (
        <path
          key={y}
          d={`M${20 + i * 30} ${y} h${60 + i * 10}`}
          stroke="#f2b46b"
          strokeOpacity={0.35 - i * 0.05}
          strokeWidth="1.5"
        />
      ))}
      <path d="M168 160 h176 l-20 34 h-140 z" fill="#2f3646" />
      <path d="M176 172 h150" stroke="#46506a" strokeWidth="3" />
      <rect x="226" y="118" width="74" height="42" fill="#3a4256" />
      {[234, 248, 262, 276, 290].map((x) => (
        <rect key={x} x={x} y="128" width="7" height="8" fill="#ffd27a" opacity="0.85" />
      ))}
      <rect x="252" y="92" width="14" height="26" fill="#3a4256" />
      <rect x="252" y="92" width="14" height="5" fill="#a33a2e" />
      <g filter={`url(#${k}-soft)`} fill="#5a5466" opacity="0.8">
        <circle cx="262" cy="80" r="9" />
        <circle cx="272" cy="66" r="12" />
        <circle cx="290" cy="56" r="14" />
      </g>
      <path d="M205 160 V96 M320 160 V104" stroke="#3a4256" strokeWidth="2.5" />
      <path d="M0 194 h150 v10 h-150z" fill="#2a2420" />
      {[18, 34, 50, 64, 80, 96, 112, 128].map((x, i) => (
        <Figure
          key={x}
          x={x}
          y={196}
          s={0.62}
          coat={['#4b4458', '#5b4a3e', '#3e4a5c'][i % 3]}
          bundle={i % 2 === 0}
          hat={i % 3 === 1}
          kid={i === 3 || i === 6}
        />
      ))}
      {[
        [40, 70],
        [120, 40],
        [180, 90],
        [240, 30],
        [330, 100],
        [90, 140],
        [300, 150],
      ].map(([x, y]) => (
        <circle key={`s${x}`} cx={x} cy={y} r="1.6" fill="#fff" opacity="0.7" />
      ))}
      <Grain k={k} />
      <Title t="1950. 12 · 흥남부두" />
    </>
  ),

  train: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#bcd3e6'],
            ['0.7', '#f2e7d3'],
            ['1', '#f6dcc0'],
          ]}
        />
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <Cloud x={70} y={46} s={0.9} />
      <Cloud x={250} y={34} s={0.7} />
      <path d="M190 150 V96 h150 v54z" fill="#e8dcc6" />
      <path d="M182 98 L265 64 L348 98 z" fill="#7d5a44" />
      <path d="M182 98 h166" stroke="#5a3f2f" strokeWidth="3" />
      {[204, 236, 268, 300].map((x) => (
        <g key={x}>
          <rect x={x} y="110" width="18" height="26" fill="#9db6cc" />
          <path d={`M${x} 123 h18 M${x + 9} 110 v26`} stroke="#e8dcc6" strokeWidth="1.5" />
        </g>
      ))}
      <rect
        x="236"
        y="74"
        width="58"
        height="18"
        rx="2"
        fill="#fffaf0"
        stroke="#5a3f2f"
        strokeWidth="1.5"
      />
      <text x="265" y="88" textAnchor="middle" fontSize="13" fontWeight="900" fill={INK}>
        대 전
      </text>
      <rect y="168" width="360" height="72" fill="#b8ab98" />
      <path d="M0 176 h360 M0 184 h360" stroke="#8e826f" strokeWidth="2" />
      <rect x="0" y="150" width="360" height="20" fill="#cfc3ae" />
      <g>
        <rect x="10" y="112" width="132" height="44" rx="6" fill="#2b2b33" />
        <rect x="104" y="96" width="38" height="30" rx="3" fill="#2b2b33" />
        <rect x="110" y="102" width="12" height="12" fill="#ffd27a" />
        <rect x="26" y="98" width="16" height="16" fill="#2b2b33" />
        <path d="M10 136 h132" stroke="#a33a2e" strokeWidth="3" />
        {[30, 62, 94, 122].map((x) => (
          <g key={x}>
            <circle cx={x} cy="160" r="11" fill="#1d1d22" />
            <circle cx={x} cy="160" r="5" fill="#a33a2e" />
          </g>
        ))}
        <path d="M142 150 l14 6 h-14z" fill="#1d1d22" />
      </g>
      <Steam x={34} y={92} k={k} s={1.3} />
      <Steam x={60} y={84} k={k} s={0.9} />
      <Figure x={196} y={166} s={1.05} coat="#5b4a3e" hat bundle />
      <Figure x={214} y={166} s={0.95} coat="#7a4a4a" hair="#3a2a20" />
      <Figure x={230} y={167} s={1} coat="#4b5a6c" kid />
      <Figure x={242} y={167} s={1} coat="#8a6b4a" kid />
      <Grain k={k} />
      <Title t="멈춰 선 기차 · 대전역" light />
    </>
  ),

  flour: (k) => (
    <>
      <Defs k={k}>
        <linearGradient id={`${k}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a3a30" />
          <stop offset="1" stopColor="#6b5442" />
        </linearGradient>
        <linearGradient id={`${k}-ray`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9b8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffe9b8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${k}-sack`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fbf3e2" />
          <stop offset="1" stopColor="#d8c7a6" />
        </radialGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-wall)`} />
      <path d="M220 240 V80 a58 58 0 0 1 116 0 V240 z" fill="#f7e2b4" />
      <path d="M232 240 V86 a46 46 0 0 1 92 0 V240" fill="none" stroke="#8b6f4e" strokeWidth="4" />
      <path
        d="M220 240 L336 240 L200 240 L60 240 L230 90 L330 90 z"
        fill={`url(#${k}-ray)`}
        opacity="0.55"
      />
      <rect y="196" width="360" height="44" fill="#3d2f26" />
      <path d="M0 200 h360" stroke="#5a4636" strokeWidth="2" />
      {(
        [
          [78, 0],
          [150, 1],
        ] as const
      ).map(([x, i]) => (
        <g key={x}>
          <ellipse cx={x} cy="204" rx="38" ry="6" fill="#000" opacity="0.25" />
          <path
            d={`M${x - 34} 204 q-8 -64 10 -84 q24 -10 48 0 q18 20 10 84 z`}
            fill={`url(#${k}-sack)`}
            stroke="#8b6f4e"
            strokeWidth="2"
          />
          <path d={`M${x - 16} 122 q16 -16 32 0`} fill="none" stroke="#8b6f4e" strokeWidth="2.5" />
          <path
            d={`M${x - 22} 140 q-2 20 2 40 M${x + 20} 142 q3 20 -1 40`}
            stroke="#bba67f"
            strokeWidth="1.2"
            fill="none"
          />
          <text x={x} y="170" textAnchor="middle" fontSize="14" fontWeight="900" fill="#7a5a3a">
            밀가루
          </text>
          {i === 1 && <circle cx={x + 26} cy="196" r="2" fill="#fff" opacity="0.7" />}
        </g>
      ))}
      {[
        [110, 190],
        [128, 186],
        [200, 194],
        [240, 180],
      ].map(([x, y]) => (
        <circle key={`d${x}`} cx={x} cy={y} r="1.4" fill="#fff6dc" opacity="0.8" />
      ))}
      <Grain k={k} />
      <Title t="밀가루 두 포대" />
    </>
  ),

  tent: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#5b6f93'],
            ['0.6', '#e8a77a'],
            ['1', '#f3c999'],
          ]}
        />
        <radialGradient id={`${k}-lamp`} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <path d="M220 150 V100 h130 v50z" fill="#7a6a5e" opacity="0.6" />
      <path d="M214 102 L285 78 L356 102z" fill="#5a4a44" opacity="0.6" />
      <rect y="188" width="360" height="52" fill="#9c8468" />
      <circle cx="170" cy="140" r="110" fill={`url(#${k}-lamp)`} />
      <path d="M50 190 V104 L170 54 L290 104 V190 z" fill="#efe1c2" />
      <path d="M50 104 L170 54 L290 104 z" fill="#d6c094" />
      <path
        d="M110 80 L100 190 M170 54 V190 M230 80 L240 190"
        stroke="#c4ad80"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M50 104 q20 10 40 0 q20 10 40 0 q20 10 40 0 q20 10 40 0 q20 10 40 0 q20 10 40 0"
        fill="none"
        stroke="#b39466"
        strokeWidth="2.5"
      />
      <path d="M170 60 v10" stroke="#5a3f2f" strokeWidth="2" />
      <circle cx="170" cy="74" r="5" fill="#ffd98a" />
      <rect x="128" y="150" width="84" height="40" rx="4" fill="#6b4a36" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={136 + i * 0}
            y={136 - i * 14}
            width="68"
            height="13"
            rx="3"
            fill="#c9a874"
            stroke="#8b6f4e"
          />
          <path d={`M140 ${142 - i * 14} h60`} stroke="#8b6f4e" strokeWidth="0.8" />
        </g>
      ))}
      <Steam x={160} y={104} k={k} />
      <Steam x={182} y={100} k={k} s={0.8} />
      {[104, 116, 228, 240].map((x) => (
        <circle key={x} cx={x} cy="176" r="6" fill="#fffaf0" stroke="#d6c094" />
      ))}
      <g transform="rotate(-7 74 150)">
        <rect x="70" y="112" width="6" height="80" fill="#6b4a36" />
        <rect
          x="52"
          y="112"
          width="42"
          height="24"
          rx="2"
          fill="#fffaf0"
          stroke="#6b4a36"
          strokeWidth="1.5"
        />
        <text x="73" y="129" textAnchor="middle" fontSize="12" fontWeight="900" fill="#a33a2e">
          찐빵
        </text>
      </g>
      <Figure x={310} y={198} s={0.9} coat="#5b4a3e" hat />
      <Figure x={330} y={199} s={0.85} coat="#4b5a6c" />
      <Grain k={k} />
      <Title t="1956 · 대전역 앞 천막" />
    </>
  ),

  share: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#f6b77d'],
            ['0.6', '#f7d8a8'],
            ['1', '#e9c9a0'],
          ]}
        />
        <linearGradient id={`${k}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb0c8" />
          <stop offset="1" stopColor="#5d7d98" />
        </linearGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <circle cx="290" cy="70" r="22" fill="#ffe2a8" opacity="0.9" />
      <Cloud x={80} y={40} s={0.8} c="#fde3c4" sh="#efc29a" />
      <path d="M0 120 q90 -16 180 0 t180 0 v20 h-360z" fill="#a7a08c" />
      <rect x="0" y="118" width="360" height="12" fill="#8d8576" />
      {[40, 130, 220, 310].map((x) => (
        <path
          key={x}
          d={`M${x - 40} 130 q40 40 80 0`}
          fill="none"
          stroke="#8d8576"
          strokeWidth="6"
        />
      ))}
      {[40, 130, 220, 310].map((x) => (
        <rect key={`p${x}`} x={x - 46} y="128" width="12" height="44" fill="#8d8576" />
      ))}
      <rect y="168" width="360" height="72" fill={`url(#${k}-water)`} />
      {[180, 194, 210, 226].map((y, i) => (
        <path
          key={y}
          d={`M${30 + i * 40} ${y} h${80}`}
          stroke="#ffe2a8"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
      ))}
      <path d="M0 172 q60 -10 140 -4 v26 h-140z" fill="#7d6b52" />
      <Figure x={88} y={196} s={1.25} coat="#5b4a3e" hat />
      <circle cx="104" cy="160" r="5.5" fill="#fffaf0" stroke="#c9a874" />
      <Figure x={118} y={196} s={1.15} coat="#7a4a4a" kid />
      <Figure x={132} y={197} s={1.1} coat="#4b5a6c" kid />
      <Figure x={60} y={197} s={1.05} coat="#6b5a7a" kid />
      <Grain k={k} />
      <Title t="해 질 녘, 목척교 아래" light />
    </>
  ),

  line: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#a9cfee'],
            ['1', '#eef6fb'],
          ]}
        />
        <radialGradient id={`${k}-glow`}>
          <stop offset="0" stopColor="#bfe0ff" />
          <stop offset="1" stopColor="#bfe0ff" stopOpacity="0" />
        </radialGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <Cloud x={90} y={40} s={0.9} />
      <Cloud x={190} y={28} s={0.6} />
      <rect x="226" y="58" width="128" height="140" fill="#f5efe6" />
      <path d="M220 96 h140 l-8 -16 h-124z" fill="#b8473a" />
      {[228, 248, 268, 288, 308, 328].map((x) => (
        <path key={x} d={`M${x} 96 q10 8 20 0`} fill="#d9695a" />
      ))}
      <rect x="236" y="60" width="108" height="18" fill="#fffaf0" stroke="#b8473a" />
      <text x="290" y="74" textAnchor="middle" fontSize="12" fontWeight="900" fill="#b8473a">
        빵 집
      </text>
      <rect x="244" y="110" width="44" height="40" fill="#d7e6ee" />
      <rect x="298" y="110" width="40" height="88" fill="#cfe0ea" />
      <circle cx="262" cy="140" r="6" fill="#e8c48c" />
      <circle cx="274" cy="142" r="5" fill="#d9a86a" />
      <Tree x={210} y={198} s={1.2} />
      <rect y="196" width="360" height="44" fill="#d8d2c8" />
      <path d="M0 210 h360" stroke="#c4bdb1" strokeWidth="1.5" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <Figure
            x={18 + i * 16}
            y={204 + (i % 2)}
            s={0.82}
            coat={['#6b7fa3', '#a35a4a', '#5b6e5a', '#8a6b9a', '#c49a4a'][i % 5]}
            hair={i % 4 ? '#2a2620' : '#6b4a2a'}
            kid={i === 4 || i === 9}
          />
          {i % 2 === 0 && <circle cx={22 + i * 16} cy="168" r="6" fill={`url(#${k}-glow)`} />}
        </g>
      ))}
      <Grain k={k} />
      <Title t="지금, 당신이 선 줄" light />
    </>
  ),

  church1919: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#bfd9ec'],
            ['1', '#f4ead8'],
          ]}
        />
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <Cloud x={70} y={50} />
      <Cloud x={280} y={40} s={0.8} />
      <path d="M0 190 q90 -70 200 -40 t160 -10 v100 h-360z" fill="#9fbc7e" />
      <path d="M0 210 q120 -40 360 -20 v50 h-360z" fill="#86a868" />
      <g>
        <rect x="150" y="104" width="76" height="56" fill="#b45e42" />
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <path
            key={r}
            d={`M150 ${110 + r * 9} h76`}
            stroke="#8e4632"
            strokeWidth="0.8"
            opacity="0.6"
          />
        ))}
        <path d="M142 106 L188 76 L234 106z" fill="#5d3a2c" />
        <rect x="178" y="56" width="20" height="40" fill="#b45e42" />
        <path d="M174 58 L188 42 L202 58z" fill="#5d3a2c" />
        <path d="M188 26 v16 M182 32 h12" stroke="#3a2a20" strokeWidth="2.5" />
        <path d="M180 160 v-24 a8 8 0 0 1 16 0 v24z" fill="#4a2e22" />
        {[160, 210].map((x) => (
          <path key={x} d={`M${x} 140 v-14 a5 5 0 0 1 10 0 v14z`} fill="#f2d9a0" />
        ))}
      </g>
      <Tree x={110} y={172} s={1.1} c="#f2b9c6" d="#d98ea2" />
      <Tree x={262} y={168} s={1.2} c="#f2b9c6" d="#d98ea2" />
      <Tree x={40} y={196} s={1} />
      <text
        x="320"
        y="96"
        textAnchor="middle"
        fontSize="30"
        fontWeight="900"
        fill="#1f4e8c"
        opacity="0.9"
      >
        1919
      </text>
      <Grain k={k} />
      <Title t="대전의 첫 성당 · 목동" light />
    </>
  ),

  tower: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#8fbde3'],
            ['1', '#e7f1f8'],
          ]}
        />
        <linearGradient id={`${k}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f4f1ea" />
          <stop offset="1" stopColor="#d9d3c6" />
        </linearGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <Cloud x={80} y={50} s={1.1} />
      <Cloud x={190} y={80} s={0.7} />
      <rect y="206" width="360" height="34" fill="#b9b3a6" />
      <path d="M30 206 V128 l14 -14 h170 l14 14 v78z" fill={`url(#${k}-wall)`} />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${44 + i * 20} 114 l10 14 l10 -14`}
          fill="none"
          stroke="#bdb5a5"
          strokeWidth="2"
        />
      ))}
      {[52, 92, 132, 172].map((x) => (
        <g key={x}>
          <rect x={x} y="140" width="24" height="58" rx="2" fill="#6f95bd" />
          <path d={`M${x} 160 h24 M${x + 12} 140 v58`} stroke="#f4f1ea" strokeWidth="1.2" />
          <rect x={x + 3} y="143" width="7" height="14" fill="#c9a4d8" opacity="0.7" />
          <rect x={x + 14} y="163" width="7" height="14" fill="#f2c46b" opacity="0.7" />
        </g>
      ))}
      <path d="M256 206 V82 L278 16 L300 82 V206z" fill={`url(#${k}-wall)`} />
      <path d="M278 16 V206" stroke="#cfc7b8" strokeWidth="1.5" />
      <rect x="268" y="96" width="20" height="34" rx="2" fill="#4f5f74" />
      <path d="M278 4 v12 M273 9 h10" stroke="#3a3a3a" strokeWidth="2" />
      <Tree x={230} y={206} s={1.3} />
      <Tree x={330} y={206} s={1.1} />
      <Figure x={200} y={214} s={0.8} coat="#6b7fa3" />
      <Grain k={k} />
      <Title t="1962 · 대흥동성당" light />
    </>
  ),

  ringer: (k) => (
    <>
      <Defs k={k}>
        <linearGradient id={`${k}-in`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2a33" />
          <stop offset="1" stopColor="#4a3f3a" />
        </linearGradient>
        <linearGradient id={`${k}-shaft`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe3a8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffe3a8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${k}-bell`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f3d68a" />
          <stop offset="0.6" stopColor="#c99a3e" />
          <stop offset="1" stopColor="#8a6424" />
        </radialGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-in)`} />
      <rect x="250" y="20" width="40" height="60" rx="20" fill="#ffe3a8" opacity="0.85" />
      <path d="M250 40 L60 240 H220 L290 60z" fill={`url(#${k}-shaft)`} />
      <path d="M100 18 h170 M120 18 v30 M250 18 v30" stroke="#5a4636" strokeWidth="6" />
      <path d="M150 34 q30 -16 60 0 q8 46 22 70 h-104 q14 -24 22 -70z" fill={`url(#${k}-bell)`} />
      <path d="M128 104 h104" stroke="#8a6424" strokeWidth="4" />
      <circle cx="180" cy="112" r="7" fill="#7a5620" />
      <path d="M196 42 q6 20 4 50" stroke="#fff4c8" strokeWidth="3" opacity="0.5" fill="none" />
      <path d="M180 118 V186" stroke="#d8c7a0" strokeWidth="2.5" />
      <g fill="#5a4c44">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M${12 + i * 16} ${236 - i * 14} h40 v6 h-40z`} />
        ))}
      </g>
      <Figure x={180} y={236} s={1.45} coat="#3a3f52" hair="#8a8a8a" />
      <path d="M172 178 l8 10 l8 -10" stroke="#e9c9a8" strokeWidth="3" fill="none" />
      {[
        [120, 150],
        [150, 120],
        [230, 160],
        [260, 110],
        [100, 190],
        [210, 200],
      ].map(([x, y]) => (
        <circle key={`p${x}`} cx={x} cy={y} r="1.3" fill="#ffe9b8" opacity="0.8" />
      ))}
      <text x="306" y="196" textAnchor="middle" fontSize="28" fontWeight="900" fill="#f6ead2">
        120
      </text>
      <text x="306" y="214" textAnchor="middle" fontSize="11" fill="#f6ead2">
        계단
      </text>
      <Grain k={k} />
      <Title t="종지기, 1969~2019" />
    </>
  ),

  silence: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#5a6a9a'],
            ['0.55', '#e6a07a'],
            ['1', '#f6d2a2'],
          ]}
        />
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <circle cx="90" cy="150" r="34" fill="#ffd9a0" opacity="0.8" />
      <Cloud x={250} y={60} s={0.9} c="#f3c7a8" sh="#d99a82" />
      <path d="M190 240 V96 L212 30 L234 96 V240z" fill="#3b3346" />
      <rect x="202" y="110" width="20" height="32" rx="2" fill="#6a5a7a" />
      <path d="M212 18 v12 M207 23 h10" stroke="#3b3346" strokeWidth="2" />
      <path
        d="M0 210 q100 -24 190 -6 v36 h-190z M234 214 q60 -16 126 -4 v30 h-126z"
        fill="#4a3f52"
      />
      {[
        [110, 70],
        [128, 62],
        [146, 74],
      ].map(([x, y]) => (
        <path
          key={x}
          d={`M${x} ${y} q5 -5 10 0 q5 -5 10 0`}
          stroke="#3b3346"
          strokeWidth="2"
          fill="none"
        />
      ))}
      <text x="300" y="150" fontSize="54" fontWeight="900" fill="#fffaf0" opacity="0.9">
        ?
      </text>
      <Grain k={k} />
      <Title t="2019. 9. 22 · 마지막 종" />
    </>
  ),

  office: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#9fc4e2'],
            ['1', '#f0ead9'],
          ]}
        />
        <linearGradient id={`${k}-tile`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99a6a" />
          <stop offset="1" stopColor="#a87a4e" />
        </linearGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <Cloud x={60} y={40} s={0.9} />
      <Cloud x={300} y={56} s={0.7} />
      <rect y="200" width="360" height="40" fill="#bdb3a2" />
      <rect x="30" y="96" width="300" height="104" fill={`url(#${k}-tile)`} />
      <rect x="132" y="66" width="96" height="134" fill={`url(#${k}-tile)`} />
      {Array.from({ length: 10 }, (_, r) => (
        <path
          key={r}
          d={`M30 ${104 + r * 10} h300`}
          stroke="#8e6440"
          strokeWidth="0.6"
          opacity="0.4"
        />
      ))}
      <path d="M26 96 h308 v-6 h-308z M128 66 h104 v-6 h-104z" fill="#6e4c30" />
      {[44, 72, 100, 244, 272, 300].map((x) =>
        [110, 152].map((y) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="16" height="28" fill="#e9e2d0" />
            <path d={`M${x} ${y + 14} h16 M${x + 8} ${y} v28`} stroke="#8e6440" strokeWidth="1" />
          </g>
        )),
      )}
      {[146, 172, 198].map((x) => (
        <rect key={x} x={x} y="80" width="14" height="24" fill="#e9e2d0" />
      ))}
      <path d="M160 200 v-34 a20 20 0 0 1 40 0 v34z" fill="#4a3220" />
      <path d="M124 200 h112 v6 h-112z" fill="#9a8f80" />
      <Tree x={18} y={204} s={1.2} />
      <Tree x={344} y={204} s={1.2} />
      <Grain k={k} />
      <Title t="1932 · 충남도청, 대전으로" light />
    </>
  ),

  capital: (k) => (
    <>
      <Defs k={k}>
        <Sky
          id={`${k}-sky`}
          stops={[
            ['0', '#8a8f9a'],
            ['1', '#d9d4c8'],
          ]}
        />
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-sky)`} />
      <g filter={`url(#${k}-blur8)`} fill="#6e7380" opacity="0.6">
        <ellipse cx="80" cy="40" rx="70" ry="20" />
        <ellipse cx="260" cy="50" rx="90" ry="22" />
      </g>
      <rect y="200" width="360" height="40" fill="#a59c8c" />
      <rect x="20" y="104" width="200" height="96" fill="#b58a5e" />
      <rect x="84" y="76" width="72" height="124" fill="#a67c52" />
      <path d="M16 104 h208 v-5 h-208z M80 76 h80 v-5 h-80z" fill="#6e4c30" />
      {[34, 58, 172, 196].map((x) =>
        [116, 156].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="14" height="24" fill="#e2dccb" />
        )),
      )}
      <path d="M120 71 V30" stroke="#3a3027" strokeWidth="2.5" />
      <path
        d="M120 30 q14 -6 28 2 v18 q-14 -8 -28 -2z"
        fill="#f4f1ea"
        stroke="#3a3027"
        strokeWidth="1"
      />
      {/* 태극기(단순화) — 태극 + 네 귀퉁이 괘 */}
      <path d="M130 40 a4.5 4.5 0 0 1 9 0z" fill="#c8323c" />
      <path d="M130 40 a4.5 4.5 0 0 0 9 0z" fill="#1f4e8c" />
      <path
        d="M123 34 l3 -2 M124 36 l3 -2 M142 32 l3 2 M141 34 l3 2 M123 46 l3 2 M124 44 l3 2 M142 48 l3 -2 M141 46 l3 -2"
        stroke="#2a2620"
        strokeWidth="1"
      />
      <g transform="rotate(4 290 130)">
        <rect
          x="240"
          y="68"
          width="100"
          height="116"
          rx="4"
          fill="#fffaf0"
          stroke="#3a3027"
          strokeWidth="1.5"
        />
        <rect x="240" y="68" width="100" height="28" rx="4" fill="#b8473a" />
        <text x="290" y="88" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff">
          1950. 7
        </text>
        <text x="290" y="148" textAnchor="middle" fontSize="44" fontWeight="900" fill={INK}>
          21
        </text>
        <text x="290" y="170" textAnchor="middle" fontSize="11" fill={INK}>
          일 동안 임시 수도
        </text>
      </g>
      <Figure x={70} y={210} s={0.85} coat="#4a4f5a" hat />
      <Figure x={180} y={210} s={0.85} coat="#5b5a4a" hat />
      <Grain k={k} />
      <Title t="1950 · 전쟁과 임시 수도" />
    </>
  ),

  walk: (k) => (
    <>
      <Defs k={k}>
        <linearGradient id={`${k}-map`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6ecd2" />
          <stop offset="1" stopColor="#ecdcb6" />
        </linearGradient>
      </Defs>
      <rect width="360" height="240" fill={`url(#${k}-map)`} />
      <path
        d="M0 150 q80 -20 140 10 t220 -20"
        stroke="#9cc3d8"
        strokeWidth="14"
        fill="none"
        opacity="0.8"
      />
      <path d="M118 140 h22 v26 h-22z" fill="#b9ad98" />
      {[
        [30, 60],
        [70, 210],
        [160, 40],
        [250, 200],
        [330, 140],
        [300, 30],
      ].map(([x = 0, y = 0]) => (
        <Tree key={`t${x}`} x={x} y={y} s={0.6} />
      ))}
      <path
        d="M58 196 C110 150 150 210 196 128 S292 92 316 62"
        stroke="#1f4e8c"
        strokeWidth="3.5"
        strokeDasharray="7 7"
        fill="none"
      />
      {[
        [58, 196, '빵집', '#b8473a'],
        [196, 128, '성당', '#1f4e8c'],
        [316, 62, '도청', '#8a5a2e'],
      ].map(([x, y, t, c]) => (
        <g key={t as string}>
          <circle
            cx={x as number}
            cy={y as number}
            r="15"
            fill="#fffaf0"
            stroke={c as string}
            strokeWidth="3"
          />
          <circle cx={x as number} cy={y as number} r="6" fill={c as string} />
          <rect
            x={(x as number) - 24}
            y={(y as number) + 18}
            width="48"
            height="20"
            rx="10"
            fill="#fffaf0"
            stroke={c as string}
          />
          <text
            x={x as number}
            y={(y as number) + 32}
            textAnchor="middle"
            fontSize="12"
            fontWeight="900"
            fill={INK}
          >
            {t}
          </text>
        </g>
      ))}
      <Grain k={k} />
      <Title t="오늘 걸은 길" light />
    </>
  ),
};

export function StoryScene({ scene, label }: { scene: SceneKey; label: string }) {
  return (
    <svg viewBox="0 0 360 240" role="img" aria-label={label} className="block h-auto w-full">
      {SCENES[scene](`sc-${scene}`)}
    </svg>
  );
}
