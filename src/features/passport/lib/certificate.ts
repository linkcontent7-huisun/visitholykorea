/**
 * 순례 여권 완주 인증서(PDF) 생성.
 *
 * jsPDF의 내장 폰트는 한글을 지원하지 않아서(라틴 문자 전용), 폰트를 통째로
 * 임베드하는 대신 — Canvas에 시스템 한글 폰트로 인증서를 그린 뒤 그 이미지를
 * PDF 한 장에 붙이는 방식을 쓴다. Camino 콤포스텔라 인증서가 순례자에게 갖는
 * 상징적 의미를 국내 버전으로 옮긴 것 — 자세한 배경은 가톨릭_지식창고의
 * 여행업계동향과_기능제안서 3-1절 ⑦번 참고.
 */

const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754; // A4 비율(150dpi 근사)

interface CertificateOptions {
  pilgrimName: string;
  levelLabel: string;
  levelEmoji: string;
  stampCount: number;
  siteNames: string[];
  issuedAt: Date;
}

function buildCertificateCanvas(options: CertificateOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // 배경
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 이중 테두리
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 60, CANVAS_WIDTH - 120, CANVAS_HEIGHT - 120);
  ctx.strokeStyle = '#c4b5fd';
  ctx.lineWidth = 2;
  ctx.strokeRect(84, 84, CANVAS_WIDTH - 168, CANVAS_HEIGHT - 168);

  const centerX = CANVAS_WIDTH / 2;
  ctx.textAlign = 'center';

  // 로고
  ctx.font = '700 34px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#4338ca';
  ctx.fillText('VISIT HOLY KOREA', centerX, 220);

  // 제목
  ctx.font = '800 64px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText('순례 완주 인증서', centerX, 340);

  // 등급 배지
  ctx.font = '700 48px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText(`${options.levelEmoji} ${options.levelLabel}`, centerX, 460);

  // 본문
  ctx.font = '500 30px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.fillText('위 순례자는 아래와 같이 대한민국 천주교 성지를', centerX, 560);
  ctx.fillText('순례하며 걸었음을 증명합니다.', centerX, 600);

  // 순례자 이름
  ctx.font = '800 46px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText(options.pilgrimName, centerX, 720);
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 220, 750);
  ctx.lineTo(centerX + 220, 750);
  ctx.stroke();

  // 스탬프 개수
  ctx.font = '600 32px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#4338ca';
  ctx.fillText(`총 ${options.stampCount}곳의 성지를 순례했습니다`, centerX, 830);

  // 방문 성지 목록 (최대 12곳, 넘으면 "외 N곳")
  ctx.font = '500 26px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#6b7280';
  const maxListed = 12;
  const listed = options.siteNames.slice(0, maxListed);
  const remain = options.siteNames.length - listed.length;
  const lines: string[] = [];
  for (let i = 0; i < listed.length; i += 3) {
    lines.push(listed.slice(i, i + 3).join('  ·  '));
  }
  if (remain > 0) lines.push(`외 ${remain}곳`);
  let y = 900;
  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += 44;
  }

  // 발급일
  const dateStr = options.issuedAt.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.font = '500 28px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#4b5563';
  ctx.fillText(dateStr, centerX, CANVAS_HEIGHT - 220);
  ctx.font = '700 32px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText('VisitHolyKorea', centerX, CANVAS_HEIGHT - 170);

  return canvas;
}

/**
 * 인증서를 만들어 즉시 PDF로 다운로드한다.
 *
 * jsPDF는 무거운 라이브러리라 화면 로딩까지 붙잡지 않도록, 실제로 인증서를 뽑는
 * 이 순간에만 동적으로 불러온다(순례자 대부분은 이 버튼을 누르지 않는다).
 */
export async function downloadCertificatePDF(options: CertificateOptions) {
  const { default: jsPDF } = await import('jspdf');

  const canvas = buildCertificateCanvas(options);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [CANVAS_WIDTH, CANVAS_HEIGHT],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  pdf.save(`visitholykorea-인증서-${options.pilgrimName}.pdf`);
}
