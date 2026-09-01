/**
 * 순례 연대기 카드(별자리)와 교구 완주 카드.
 *
 * Strava Year in Sport / Spotify Wrapped 구조 — 쌓인 기록을 앱이 한 장의
 * 카드로 만들어 손에 쥐여주면 공유는 따라온다. 지도를 그대로 그리는 대신
 * 방문 성지들을 실제 좌표 그대로 밤하늘의 별로 찍고 시간순으로 잇는다.
 * "여정을 시간이 지날수록 옅어지는 선으로 그린다"는 지도 화면의 문법을
 * 카드로 옮긴 것 — 내 순례가 별자리가 된다.
 */

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

/** 남한 좌표 범위. 별자리의 상대 위치가 실제 지리와 같도록 고정 틀을 쓴다. */
const GEO = { latMin: 33.1, latMax: 38.7, lngMin: 124.5, lngMax: 129.7 };

export interface ChronicleStar {
  siteName: string;
  lat: number | null;
  lng: number | null;
  visitedAt: Date;
}

export interface ChronicleCardOptions {
  stars: ChronicleStar[]; // 방문 순서(과거 → 최근)로 정렬해서 넘길 것
  dioceseCount: number;
  totalSites: number;
}

const FONT = '"Pretendard", "Apple SD Gothic Neo", sans-serif';

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('이미지 생성에 실패했습니다.'));
    }, 'image/png');
  });
}

/** 나의 순례 연대기 — 방문 성지들이 밤하늘 별자리로 찍히는 카드. */
export async function generateChronicleCard(options: ChronicleCardOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context를 만들 수 없습니다.');

  // 밤하늘 배경
  const grad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  grad.addColorStop(0, '#0f0d2e');
  grad.addColorStop(1, '#312e81');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 제목
  ctx.textBaseline = 'top';
  ctx.font = `700 36px ${FONT}`;
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('VISIT HOLY KOREA', 64, 80);
  ctx.font = `800 72px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('나의 순례 별자리', 64, 140);

  // 별자리 영역 — 실제 위경도를 그대로 투영한다 (지리적 상대 위치 보존)
  const plot = { x: 150, y: 380, w: 780, h: 1000 };
  const project = (lat: number, lng: number) => ({
    x: plot.x + ((lng - GEO.lngMin) / (GEO.lngMax - GEO.lngMin)) * plot.w,
    y: plot.y + ((GEO.latMax - lat) / (GEO.latMax - GEO.latMin)) * plot.h,
  });

  const placed = options.stars
    .filter((s) => s.lat !== null && s.lng !== null)
    .map((s) => ({ ...project(s.lat!, s.lng!), name: s.siteName }));

  // 여정 선 — 오래된 구간일수록 옅다
  for (let i = 1; i < placed.length; i++) {
    const from = placed[i - 1]!;
    const to = placed[i]!;
    const age = placed.length - i; // 최근 구간일수록 0에 가깝다
    ctx.strokeStyle = `rgba(196, 181, 253, ${Math.max(0.12, 0.55 - age * 0.06)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  // 별 — 마지막(최근) 별은 크게 빛난다
  placed.forEach((p, i) => {
    const latest = i === placed.length - 1;
    const r = latest ? 14 : 8;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    glow.addColorStop(0, latest ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.8)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = latest ? '#fbbf24' : '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 최근 별에는 이름을 붙인다
  const lastStar = placed[placed.length - 1];
  if (lastStar) {
    ctx.font = `700 30px ${FONT}`;
    ctx.fillStyle = '#fde68a';
    const tw = ctx.measureText(lastStar.name).width;
    const lx = Math.min(Math.max(lastStar.x - tw / 2, 64), CARD_WIDTH - 64 - tw);
    ctx.fillText(lastStar.name, lx, Math.min(lastStar.y + 40, plot.y + plot.h + 20));
  }

  // 통계
  const stats = [
    `${options.stars.length}곳 순례`,
    `${options.dioceseCount}개 교구`,
    `전국 ${options.totalSites}곳 중`,
  ];
  ctx.font = `800 48px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(stats.join('  ·  '), 64, 1500);

  // 기간
  const firstStar = options.stars[0];
  if (firstStar) {
    const fmt = (d: Date) =>
      d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.font = `500 32px ${FONT}`;
    ctx.fillStyle = '#a5b4fc';
    const range =
      options.stars.length === 1
        ? `${fmt(firstStar.visitedAt)} · ${firstStar.siteName}에서 시작`
        : `${fmt(firstStar.visitedAt)} ${firstStar.siteName}에서 시작해 지금까지`;
    ctx.fillText(range, 64, 1580);
  }

  // 좌표가 없어 별로 찍지 못한 곳도 세었음을 정직하게 남긴다
  const unplotted = options.stars.length - placed.length;
  if (unplotted > 0) {
    ctx.font = `500 26px ${FONT}`;
    ctx.fillStyle = '#818cf8';
    ctx.fillText(`좌표가 준비되지 않은 ${unplotted}곳은 별로 표시하지 못했어요`, 64, 1650);
  }

  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('한국 천주교 성지순례 · visitholykorea', 64, CARD_HEIGHT - 120);

  return toBlob(canvas);
}

export interface DioceseCardOptions {
  diocese: string;
  siteNames: string[];
  completedAt: Date;
}

/** 교구 완주 카드 — 208곳 전부는 멀어도 교구 하나는 손에 잡힌다. */
export async function generateDioceseCard(options: DioceseCardOptions): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context를 만들 수 없습니다.');

  // 인증서 톤의 밝은 배경 + 이중 테두리
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 6;
  ctx.strokeRect(50, 50, W - 100, H - 100);
  ctx.strokeStyle = '#c4b5fd';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 70, W - 140, H - 140);

  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.font = `700 32px ${FONT}`;
  ctx.fillStyle = '#4338ca';
  ctx.fillText('VISIT HOLY KOREA', cx, 140);

  ctx.font = `800 88px ${FONT}`;
  ctx.fillStyle = '#1f2937';
  ctx.fillText(`${options.diocese} 완주`, cx, 230);

  ctx.font = `700 44px ${FONT}`;
  ctx.fillStyle = '#7c3aed';
  ctx.fillText(`이 교구의 성지 ${options.siteNames.length}곳을 모두 순례했습니다`, cx, 370);

  // 순례한 성지 목록 (최대 12곳)
  ctx.font = `500 30px ${FONT}`;
  ctx.fillStyle = '#4b5563';
  const listed = options.siteNames.slice(0, 12);
  const remain = options.siteNames.length - listed.length;
  let y = 500;
  for (let i = 0; i < listed.length; i += 2) {
    ctx.fillText(listed.slice(i, i + 2).join('  ·  '), cx, y);
    y += 52;
  }
  if (remain > 0) {
    ctx.fillText(`외 ${remain}곳`, cx, y);
    y += 52;
  }

  const dateStr = options.completedAt.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.font = `500 30px ${FONT}`;
  ctx.fillStyle = '#4b5563';
  ctx.fillText(dateStr, cx, H - 250);
  ctx.font = `700 34px ${FONT}`;
  ctx.fillStyle = '#1f2937';
  ctx.fillText('visitholykorea', cx, H - 190);

  return toBlob(canvas);
}
