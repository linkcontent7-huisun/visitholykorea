import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 웹앱 하나로 Android / iOS 네이티브 앱까지 빌드하기 위한 Capacitor 설정.
 *
 * 네이티브 프로젝트는 저장소에 커밋하지 않고(.gitignore) 필요할 때 생성한다:
 *   npm run build && npx cap add android && npx cap add ios
 *   npm run cap:android   # Android Studio 열기
 *   npm run cap:ios       # Xcode 열기 (macOS 필요)
 */
const config: CapacitorConfig = {
  appId: 'kr.visitholykorea.app',
  appName: 'Visit Holy Korea',
  webDir: 'dist',
  android: {
    // 시스템 글꼴 크기 설정을 존중한다(고령 순례자 접근성).
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
