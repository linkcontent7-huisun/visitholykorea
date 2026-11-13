import { Analytics } from '@vercel/analytics/react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { router } from './routes/router';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      {/*
        방문 통계(v7.0, 2026-11-13 사장님 결정): 지금까지 몇 명이 왔는지조차 몰랐다.
        Vercel Web Analytics 는 쿠키를 쓰지 않아 동의 팝업이 필요 없다.
        Vercel 대시보드에서 Analytics 를 켜야 수집이 시작된다(꺼져 있으면 아무 일도 안 한다).
      */}
      <Analytics />
    </AppProviders>
  );
}
