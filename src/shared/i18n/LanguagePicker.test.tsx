import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguagePicker } from './LanguagePicker';
import * as useSettingsModule from './use-settings';
import type { SettingsContextValue } from './settings-context';

vi.mock('./use-settings');

function mockSettings(language: SettingsContextValue['language'], setLanguage = vi.fn()) {
  vi.mocked(useSettingsModule.useSettings).mockReturnValue({
    language,
    setLanguage,
    largeText: false,
    setLargeText: vi.fn(),
    origin: null,
    setOrigin: vi.fn(),
    t: ((k: string) => k) as SettingsContextValue['t'],
    wideView: false,
  });
  return setLanguage;
}

describe('LanguagePicker', () => {
  it('평소에는 현재 언어 코드만 보여준다 — 목록은 접어 둔다', () => {
    mockSettings('ko');
    render(<LanguagePicker />);
    expect(screen.getByRole('button', { name: /언어|Language/i })).toHaveTextContent('KO');
    expect(screen.queryByText('Español')).not.toBeInTheDocument();
  });

  it('누르면 6개 언어가 각자의 언어 이름으로 나온다', () => {
    mockSettings('ko');
    render(<LanguagePicker />);
    fireEvent.click(screen.getByRole('button', { name: /언어|Language/i }));
    for (const label of ['한국어', 'English', 'Español', 'Français', 'Português', 'Italiano']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }
  });

  it('고르면 그 언어로 바뀌고 목록이 닫힌다', () => {
    const setLanguage = mockSettings('ko');
    render(<LanguagePicker />);
    fireEvent.click(screen.getByRole('button', { name: /언어|Language/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Español' }));
    expect(setLanguage).toHaveBeenCalledWith('es');
    expect(screen.queryByRole('option', { name: 'Español' })).not.toBeInTheDocument();
  });

  it('지금 언어가 무엇인지 목록에서 알 수 있다', () => {
    mockSettings('fr');
    render(<LanguagePicker />);
    fireEvent.click(screen.getByRole('button', { name: /언어|Language/i }));
    expect(screen.getByRole('option', { name: 'Français' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('바깥을 누르면 닫힌다 — 열어놓고 다른 걸 누르려던 사람을 막지 않는다', () => {
    mockSettings('ko');
    render(<LanguagePicker />);
    fireEvent.click(screen.getByRole('button', { name: /언어|Language/i }));
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('option', { name: 'English' })).not.toBeInTheDocument();
  });
});
