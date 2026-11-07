import type { ReactElement } from 'react';
import type { SceneKey } from '../data/bread-story';

/**
 * 웹툰 칸 삽화 — 사진을 베끼지 않고 출처의 「사실」만 보고 직접 그린 단순 그림(SVG).
 * 실존 인물은 뒷모습·실루엣만, 상호 로고는 그리지 않는다.
 */

const NAVY = '#1f4e8c';
const RUST = '#c2410c';
const CREAM = '#fbe7a1';
const BROWN = '#8b5e3c';
const INK = '#1e2430';

function Person({ x, y, s = 1, c = INK }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={c}>
      <circle cx="0" cy="-34" r="7" />
      <path d="M-9 -26 h18 l3 26 h-24 z" />
    </g>
  );
}

function Crowd({
  x,
  y,
  n,
  gap = 14,
  s = 0.8,
}: {
  x: number;
  y: number;
  n: number;
  gap?: number;
  s?: number;
}) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <Person
          key={i}
          x={x + i * gap}
          y={y + (i % 2) * 2}
          s={s}
          c={i % 3 === 0 ? '#3b4252' : INK}
        />
      ))}
    </>
  );
}

const SCENES: Record<SceneKey, ReactElement> = {
  harbor: (
    <>
      <rect width="360" height="240" fill="#1b2433" />
      <circle cx="300" cy="40" r="14" fill="#e8e1c8" />
      <rect y="150" width="360" height="90" fill="#24324a" />
      <path d="M0 150 h120 l20 -20 h30 v20" fill="#3b2a22" />
      <ellipse cx="60" cy="140" rx="70" ry="22" fill={RUST} opacity="0.45" />
      <path d="M170 150 h170 l-18 32 h-140 z" fill="#3a4250" />
      <rect x="230" y="110" width="60" height="40" fill="#4a5262" />
      <rect x="250" y="88" width="12" height="22" fill="#4a5262" />
      <Crowd x={190} y={150} n={10} gap={13} s={0.55} />
      <text x="16" y="28" fill="#e8e1c8" fontSize="14" fontWeight="700">
        1950. 12 · 흥남부두
      </text>
    </>
  ),
  train: (
    <>
      <rect width="360" height="240" fill="#dfe8f2" />
      <rect y="180" width="360" height="60" fill="#9aa4ae" />
      <rect x="20" y="110" width="220" height="70" rx="8" fill={NAVY} />
      {[40, 90, 140, 190].map((x) => (
        <rect key={x} x={x} y="124" width="34" height="22" rx="3" fill="#cfe0f3" />
      ))}
      <circle cx="60" cy="184" r="10" fill={INK} />
      <circle cx="200" cy="184" r="10" fill={INK} />
      <circle cx="250" cy="96" r="16" fill="#fff" opacity="0.9" />
      <circle cx="272" cy="80" r="12" fill="#fff" opacity="0.8" />
      <rect x="270" y="60" width="74" height="30" rx="4" fill="#fff" stroke={INK} strokeWidth="2" />
      <text x="307" y="81" textAnchor="middle" fontSize="16" fontWeight="800" fill={INK}>
        대전
      </text>
      <Person x={290} y={180} s={1} />
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        고장 난 기차, 대전역
      </text>
    </>
  ),
  flour: (
    <>
      <rect width="360" height="240" fill="#f3ead8" />
      <path d="M200 240 V90 a60 60 0 0 1 120 0 V240 z" fill="#b9a68a" />
      <path d="M218 240 V100 a42 42 0 0 1 84 0 V240 z" fill="#6b5442" />
      {[70, 140].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 32} 210 q-6 -70 12 -86 h40 q18 16 12 86 z`}
            fill="#fffaf0"
            stroke={BROWN}
            strokeWidth="3"
          />
          <path d={`M${x - 18} 124 q18 -14 36 0`} fill="none" stroke={BROWN} strokeWidth="3" />
          <text x={x} y="176" textAnchor="middle" fontSize="15" fontWeight="800" fill={BROWN}>
            밀가루
          </text>
        </g>
      ))}
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        밀가루 두 포대
      </text>
    </>
  ),
  tent: (
    <>
      <rect width="360" height="240" fill="#cfe0f3" />
      <rect y="190" width="360" height="50" fill="#b8a07a" />
      <path
        d="M60 190 V100 L180 50 L300 100 V190 z"
        fill="#efe4c8"
        stroke={BROWN}
        strokeWidth="3"
      />
      <path d="M60 100 L180 50 L300 100 z" fill="#d9c79c" />
      <rect x="140" y="140" width="80" height="50" rx="6" fill="#6b6f78" />
      <path
        d="M150 128 q10 -16 0 -30 M180 126 q10 -18 0 -34 M210 128 q10 -16 0 -30"
        stroke="#fff"
        strokeWidth="4"
        fill="none"
        opacity="0.9"
      />
      <g transform="rotate(-8 92 150)">
        <rect x="86" y="110" width="8" height="80" fill={BROWN} />
        <rect x="66" y="112" width="48" height="26" fill="#fff" stroke={BROWN} strokeWidth="2" />
        <text x="90" y="130" textAnchor="middle" fontSize="13" fontWeight="800" fill={RUST}>
          찐빵
        </text>
      </g>
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        1956 · 대전역 앞 천막
      </text>
    </>
  ),
  share: (
    <>
      <rect width="360" height="240" fill="#f6c58f" />
      <rect y="170" width="360" height="70" fill="#7aa0c4" />
      <path d="M0 120 h360 v14 h-360 z" fill="#8a8f98" />
      {[30, 110, 190, 270, 350].map((x) => (
        <rect key={x} x={x - 6} y="134" width="12" height="40" fill="#8a8f98" />
      ))}
      <Person x={150} y={230} s={1.2} />
      <circle cx="176" cy="196" r="7" fill="#fffaf0" stroke={BROWN} strokeWidth="2" />
      <Person x={200} y={230} s={0.75} c="#3b4252" />
      <Person x={224} y={230} s={0.7} c={INK} />
      <Person x={246} y={230} s={0.65} c="#3b4252" />
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        목척교 아래
      </text>
    </>
  ),
  line: (
    <>
      <rect width="360" height="240" fill="#eef4fc" />
      <rect x="230" y="60" width="120" height="140" fill="#fff" stroke={INK} strokeWidth="2" />
      <rect x="230" y="60" width="120" height="26" fill={RUST} />
      <text x="290" y="78" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
        빵집
      </text>
      <rect x="270" y="130" width="40" height="70" fill="#cfe0f3" />
      <rect y="200" width="360" height="40" fill="#cbd2da" />
      <Crowd x={20} y={200} n={15} gap={14} s={0.75} />
      {[34, 76, 118, 160].map((x) => (
        <rect key={x} x={x} y="168" width="6" height="9" rx="1" fill="#5aa0ff" />
      ))}
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        지금, 당신이 선 줄
      </text>
    </>
  ),
  church1919: (
    <>
      <rect width="360" height="240" fill="#e7efe1" />
      <path d="M0 200 q180 -60 360 0 v40 h-360 z" fill="#a9c08f" />
      <rect x="140" y="110" width="90" height="70" fill="#c46a4a" />
      <path d="M130 112 L185 74 L240 112 z" fill="#7a3d2b" />
      <rect x="176" y="40" width="18" height="40" fill="#c46a4a" />
      <path d="M185 22 v18 M178 30 h14" stroke={INK} strokeWidth="3" />
      <rect x="174" y="146" width="22" height="34" fill="#5a3324" />
      <text x="300" y="60" textAnchor="middle" fontSize="28" fontWeight="900" fill={NAVY}>
        1919
      </text>
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        대전의 첫 성당 · 목동
      </text>
    </>
  ),
  tower: (
    <>
      <rect width="360" height="240" fill="#dce7f3" />
      <rect y="210" width="360" height="30" fill="#aab3bd" />
      <rect
        x="40"
        y="130"
        width="200"
        height="80"
        fill="#e9e6df"
        stroke="#9a948a"
        strokeWidth="2"
      />
      {[60, 100, 140, 180].map((x) => (
        <rect key={x} x={x} y="146" width="22" height="50" fill="#7da3c8" />
      ))}
      <path
        d="M250 210 V80 L272 20 L294 80 V210 z"
        fill="#efece6"
        stroke="#9a948a"
        strokeWidth="2"
      />
      <rect x="262" y="96" width="20" height="30" fill="#5d6b7a" />
      <path d="M40 130 h200 l-18 -16 h-164 z" fill="#c9c3b8" />
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        1962 · 대흥동성당
      </text>
    </>
  ),
  ringer: (
    <>
      <rect width="360" height="240" fill="#2b3240" />
      <path d="M150 30 q30 -14 60 0 q8 40 18 60 h-96 q10 -20 18 -60 z" fill="#c9a24a" />
      <circle cx="180" cy="96" r="7" fill="#8a6a2a" />
      <path d="M180 100 V190" stroke="#d8c7a0" strokeWidth="3" />
      <g fill="#59606e">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={20 + i * 18} y={230 - i * 16} width="40" height="10" />
        ))}
      </g>
      <Person x={180} y={232} s={1.3} c="#11151c" />
      <text x="300" y="200" textAnchor="middle" fontSize="26" fontWeight="900" fill={CREAM}>
        120
      </text>
      <text x="300" y="220" textAnchor="middle" fontSize="11" fill={CREAM}>
        계단
      </text>
      <text x="16" y="28" fill={CREAM} fontSize="14" fontWeight="700">
        종지기, 1969~2019
      </text>
    </>
  ),
  silence: (
    <>
      <rect width="360" height="240" fill="#f4efe6" />
      <path
        d="M140 60 q40 -20 80 0 q10 56 24 84 h-128 q14 -28 24 -84 z"
        fill="#c9a24a"
        opacity="0.85"
      />
      <circle cx="180" cy="152" r="9" fill="#8a6a2a" />
      <text x="270" y="90" fontSize="48" fontWeight="900" fill={RUST}>
        ?
      </text>
      <path
        d="M100 70 q-14 20 0 40 M80 60 q-24 30 0 60"
        stroke={NAVY}
        strokeWidth="3"
        fill="none"
        opacity="0.5"
      />
      <text x="180" y="200" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK}>
        2019. 9. 22 · 마지막 종
      </text>
    </>
  ),
  office: (
    <>
      <rect width="360" height="240" fill="#e6eef6" />
      <rect y="200" width="360" height="40" fill="#b9b2a5" />
      <rect x="40" y="90" width="280" height="110" fill="#b98a5e" />
      <rect x="140" y="60" width="80" height="140" fill="#a57a50" />
      <path d="M40 90 h280 v-8 h-280 z M140 60 h80 v-8 h-80 z" fill="#7d5a3a" />
      {[56, 86, 236, 266, 296].map((x) =>
        [106, 150].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="16" height="26" fill="#efe6d4" />
        )),
      )}
      <rect x="164" y="150" width="32" height="50" fill="#5a3f28" />
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        1932 · 충남도청, 대전으로
      </text>
    </>
  ),
  capital: (
    <>
      <rect width="360" height="240" fill="#d8dde3" />
      <rect x="30" y="100" width="190" height="100" fill="#b98a5e" />
      <rect x="95" y="74" width="60" height="126" fill="#a57a50" />
      <path d="M125 74 V40" stroke={INK} strokeWidth="3" />
      <rect x="125" y="40" width="30" height="20" fill="#fff" stroke={INK} />
      <rect
        x="240"
        y="70"
        width="100"
        height="110"
        rx="6"
        fill="#fff"
        stroke={INK}
        strokeWidth="2"
      />
      <rect x="240" y="70" width="100" height="28" rx="6" fill={RUST} />
      <text x="290" y="90" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
        1950. 7
      </text>
      <text x="290" y="152" textAnchor="middle" fontSize="40" fontWeight="900" fill={INK}>
        21
      </text>
      <text x="290" y="172" textAnchor="middle" fontSize="12" fill={INK}>
        일 동안 임시 수도
      </text>
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        전쟁과 임시 수도
      </text>
    </>
  ),
  walk: (
    <>
      <rect width="360" height="240" fill={CREAM} />
      <path
        d="M50 180 C120 120 160 200 200 130 S300 90 320 60"
        stroke={NAVY}
        strokeWidth="4"
        strokeDasharray="8 8"
        fill="none"
      />
      {[
        [50, 180, '빵집'],
        [200, 130, '성당'],
        [320, 60, '도청'],
      ].map(([x, y, t]) => (
        <g key={t as string}>
          <circle cx={x as number} cy={y as number} r="12" fill={RUST} />
          <text
            x={x as number}
            y={(y as number) + 30}
            textAnchor="middle"
            fontSize="13"
            fontWeight="800"
            fill={INK}
          >
            {t}
          </text>
        </g>
      ))}
      <text x="16" y="28" fill={INK} fontSize="14" fontWeight="700">
        오늘 걸은 길
      </text>
    </>
  ),
};

export function StoryScene({ scene, label }: { scene: SceneKey; label: string }) {
  return (
    <svg viewBox="0 0 360 240" role="img" aria-label={label} className="block h-auto w-full">
      {SCENES[scene]}
    </svg>
  );
}
