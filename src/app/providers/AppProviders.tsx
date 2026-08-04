import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { SettingsProvider } from '@/shared/i18n/SettingsProvider';

/**
 * 앱 전역 프로바이더를 한 곳에 모은다.
 * 테스트에서도 이 컴포넌트로 감싸면 실제 앱과 같은 환경이 된다.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient 를 컴포넌트 밖에서 만들면 HMR 때 인스턴스가 중복 생성될 수 있어 state 로 고정한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>{children}</SettingsProvider>
    </QueryClientProvider>
  );
}
