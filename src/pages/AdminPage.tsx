import {
  ChevronRight,
  Image as ImageIcon,
  Inbox,
  ListTodo,
  LogOut,
  Search,
  Star,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { AdminGate } from '@/features/admin/components/AdminGate';
import {
  useAdminAccess,
  useAdminQueue,
  usePendingPhotos,
  usePhotoReview,
} from '@/features/admin/hooks/use-admin';
import { signOut } from '@/features/auth/api/auth';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

/**
 * 관리자 콘솔 — 「오늘 채울 곳」.
 *
 * 성지 208곳을 그냥 목록으로 늘어놓으면 어디부터 손댈지 알 수 없다.
 * 그래서 이 화면의 첫 줄은 목록이 아니라 **비어 있는 개수**다.
 *
 * 문구를 6개 국어로 만들지 않은 이유: 이 화면은 순례자가 아니라 운영자가 쓴다.
 * 관리 화면까지 다국어로 만들면 사전이 두 배가 되고, 정작 순례자 화면의
 * 잔여 한국어를 고칠 시간이 없어진다. 운영자가 늘면 그때 옮긴다.
 */
export default function AdminPage() {
  return (
    <AdminGate>
      <AdminConsole />
    </AdminGate>
  );
}

type Tab = 'queue' | 'photos';

function AdminConsole() {
  const { role } = useAdminAccess();
  const [tab, setTab] = useState<Tab>('queue');

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-slate-50 pb-16">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">관리자 콘솔</h1>
            <p className="text-xs font-bold text-slate-400">{role === 'admin' ? '운영자' : '편집자'}</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <TabButton active={tab === 'queue'} onClick={() => setTab('queue')} icon={ListTodo}>
            채울 곳
          </TabButton>
          <TabButton active={tab === 'photos'} onClick={() => setTab('photos')} icon={Inbox}>
            사진 승인
          </TabButton>
        </div>
      </header>

      {tab === 'queue' ? <QueueTab /> : <PhotoReviewTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ListTodo;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold ${
        active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

type QueueFilter = 'all' | 'photo' | 'description' | 'history';

function QueueTab() {
  const { data, isLoading, error } = useAdminQueue();
  const [filter, setFilter] = useState<QueueFilter>('photo');
  const [term, setTerm] = useState('');

  const counts = useMemo(() => {
    const sites = data ?? [];
    return {
      total: sites.length,
      photo: sites.filter((s) => !s.hasPhoto).length,
      description: sites.filter((s) => !s.hasDescription).length,
      history: sites.filter((s) => !s.hasHistory).length,
    };
  }, [data]);

  const visible = useMemo(() => {
    const keyword = term.trim();
    return (data ?? []).filter((site) => {
      if (filter === 'photo' && site.hasPhoto) return false;
      if (filter === 'description' && site.hasDescription) return false;
      if (filter === 'history' && site.hasHistory) return false;
      if (keyword && !site.name.includes(keyword) && !site.diocese.includes(keyword)) return false;
      return true;
    });
  }, [data, filter, term]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorNote message="성지 목록을 불러오지 못했습니다." />;

  return (
    <div className="px-5 py-5">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="사진 없음" value={counts.photo} total={counts.total} />
        <Stat label="소개글 없음" value={counts.description} total={counts.total} />
        <Stat label="역사 없음" value={counts.history} total={counts.total} />
      </div>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="성지 이름 또는 교구로 찾기"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={filter === 'photo'} onClick={() => setFilter('photo')}>
          사진 없음
        </Chip>
        <Chip active={filter === 'description'} onClick={() => setFilter('description')}>
          소개글 없음
        </Chip>
        <Chip active={filter === 'history'} onClick={() => setFilter('history')}>
          역사 없음
        </Chip>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          전체
        </Chip>
      </div>

      <p className="mb-2 px-1 text-xs font-bold text-slate-400">{visible.length}곳</p>

      <ul className="flex flex-col gap-2">
        {visible.map((site) => (
          <li key={site.id}>
            <Link
              to={paths.adminSite(site.id)}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-slate-900">{site.name}</p>
                <p className="mt-0.5 text-xs font-bold text-slate-400">{site.diocese || '교구 미상'}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {!site.hasPhoto && <MissingTag>사진</MissingTag>}
                  {!site.hasDescription && <MissingTag>소개글</MissingTag>}
                  {!site.hasHistory && <MissingTag>역사</MissingTag>}
                  {site.missingCount === 0 && (
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600">
                      다 채워짐
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={20} className="shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="py-16 text-center text-sm font-bold text-slate-400">
          해당하는 성지가 없습니다.
        </p>
      )}
    </div>
  );
}

function PhotoReviewTab() {
  const { data, isLoading, error } = usePendingPhotos();
  const { feature, hide } = usePhotoReview();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorNote message="승인함을 불러오지 못했습니다." />;

  const photos = data ?? [];

  if (photos.length === 0) {
    return (
      <div className="px-5 py-20 text-center">
        <ImageIcon size={32} className="mx-auto mb-4 text-slate-300" />
        <p className="text-sm font-bold text-slate-400">
          순례자가 올린 사진이 아직 없습니다.
          <br />
          스탬프에 사진을 붙이면 여기로 옵니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-5">
      <p className="mb-3 px-1 text-xs font-bold leading-relaxed text-slate-400">
        승인한 사진만 성지의 대표 사진으로 쓰입니다. 얼굴이 크게 나오거나 성지와 무관한
        사진은 「내리기」로 즉시 감출 수 있습니다.
      </p>

      <ul className="flex flex-col gap-4">
        {photos.map((photo) => (
          <li key={photo.stampId} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <img
              src={photo.photoUrl}
              alt={`${photo.siteName} 순례자 사진`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="px-4 py-3">
              <p className="text-base font-bold text-slate-900">{photo.siteName}</p>
              {photo.note && (
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
                  “{photo.note}”
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    feature.mutate({ stampId: photo.stampId, featured: !photo.featured })
                  }
                  disabled={feature.isPending}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold disabled:opacity-50 ${
                    photo.featured
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  <Star size={15} fill={photo.featured ? 'currentColor' : 'none'} />
                  {photo.featured ? '대표 사진 (해제)' : '대표로 승인'}
                </button>
                <button
                  onClick={() => hide.mutate({ stampId: photo.stampId, hidden: true })}
                  disabled={hide.isPending}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 disabled:opacity-50"
                >
                  내리기
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center shadow-sm">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-slate-400">
        {label} / {total}곳
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-sm font-bold ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

function MissingTag({ children }: { children: string }) {
  return (
    <span className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-500">
      {children} 없음
    </span>
  );
}

function ErrorNote({ message }: { message: string }) {
  return <p className="px-5 py-16 text-center text-sm font-bold text-red-500">{message}</p>;
}
