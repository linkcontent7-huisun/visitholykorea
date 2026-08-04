import { BookOpen, Compass, Home, Map as MapIcon, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSettings } from '@/shared/i18n/use-settings';

/** 하단 탭 내비게이션. 라우터 경로와 1:1로 대응한다. */
export function BottomNav({ widthClass }: { widthClass: string }) {
  const { t } = useSettings();

  const tabs = [
    { id: 'home', to: paths.home, icon: Home, label: t('home'), end: true },
    { id: 'map', to: paths.map, icon: MapIcon, label: t('map'), end: false },
    { id: 'explore', to: paths.explore, icon: Compass, label: t('explore'), end: false },
    { id: 'record', to: paths.records, icon: BookOpen, label: t('record'), end: false },
    { id: 'menu', to: paths.menu, icon: Menu, label: t('menu'), end: false },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 ${widthClass} safe-area-inset-bottom border-t border-app-border bg-white transition-[max-width] duration-300`}
      aria-label="주요 메뉴"
    >
      <div className="flex h-[70px] items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isExplore = tab.id === 'explore';

          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.end}
              className="flex flex-1 flex-col items-center justify-center gap-1"
              id={`tab-${tab.id}`}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-8 items-center justify-center transition-all ${
                      isActive
                        ? isExplore
                          ? 'rounded-full bg-brand-violet'
                          : 'rounded-lg bg-brand-blue'
                        : 'rounded-lg bg-app-border'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-[#ADB5BD]'} />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-tighter ${
                      isActive ? 'text-brand-blue' : 'text-[#ADB5BD]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
