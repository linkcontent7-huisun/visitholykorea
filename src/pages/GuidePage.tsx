import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useSettings } from '@/shared/i18n/use-settings';
import { GUIDE } from './content/guide';

/** 「성지순례, 처음이라면」 — 글은 content/guide.ts (6개 국어). */
export default function GuidePage() {
  const { language } = useSettings();
  const g = GUIDE[language];

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={g.title} />
      <p className="text-base leading-relaxed text-app-text">{g.lead}</p>

      {g.sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="text-lg font-bold text-app-text">{s.heading}</h2>
          {s.body && <p className="mt-2 text-base leading-relaxed text-app-text">{s.body}</p>}
          {s.items && (
            <ul className="mt-3 space-y-2">
              {s.items.map((item) => (
                <li key={item.text}>
                  {item.to ? (
                    <Link
                      to={paths[item.to]}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-app-border bg-white px-4 py-3 text-base text-app-text hover:bg-app-bg"
                    >
                      <span>{item.text}</span>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-app-text-muted"
                        aria-hidden
                      />
                    </Link>
                  ) : (
                    <p className="rounded-lg bg-app-bg px-4 py-3 text-base leading-relaxed text-app-text">
                      {item.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </PageContainer>
  );
}
