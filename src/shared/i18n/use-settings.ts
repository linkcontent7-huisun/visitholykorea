import { useContext } from 'react';
import { SettingsContext, type SettingsContextValue } from './settings-context';

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings 는 SettingsProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
