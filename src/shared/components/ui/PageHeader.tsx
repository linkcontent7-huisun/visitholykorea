import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

/**
 * 화면 제목 한 벌 (2026-09-17 화면 규칙).
 *
 * 제목은 명조(Gowun Batang) 26px·PC 30px — 9/16 시안이 기록·더보기에 정한 크기를 모든 화면에 편다.
 * 그전엔 화면마다 text-xl·2xl·3xl·4xl 과 font-black·extrabold 가 제각각이라 화면을 옮길 때마다
 * 「다른 앱에 온 것」처럼 보였다. 설명은 16px — 50대 이상 기준 본문 최소 크기다.
 *
 * `back` 을 주면 제목 위에 「← 뒤로」가 같은 자리에 온다. `action` 은 오른쪽 끝(「전체 보기」 등).
 */
export function PageHeader({
  title,
  sub,
  back,
  action,
  className = '',
}: {
  title: ReactNode;
  sub?: ReactNode;
  /**
   * `true` 면 브라우저 뒤로가기, 문자열이면 그 경로로. `{ to, label }` 로 문구도 바꿀 수 있다.
   * `{ onClick }` 은 이동 전에 정리(reset)가 필요한 화면(예: 나침반 질문 상태 초기화)에서만 쓴다.
   */
  back?: boolean | string | { to?: string; label?: string; onClick?: () => void };
  action?: ReactNode;
  className?: string;
}) {
  const backProps =
    back === true ? {} : typeof back === 'string' ? { to: back } : back ? back : null;

  return (
    <header className={`pb-5 pt-6 ${className}`}>
      {backProps && (
        <div className="mb-3">
          <BackButton {...backProps} />
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-keep font-display text-[1.625rem] leading-tight text-app-text lg:text-3xl">
            {title}
          </h1>
          {sub && <p className="mt-2 text-base leading-relaxed text-app-text-muted">{sub}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
