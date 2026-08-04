import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-10 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-app-bg">
        <Compass size={36} className="text-gray-300" />
      </div>
      <div>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-app-text">
          길을 찾을 수 없습니다
        </h1>
        <p className="text-sm font-medium text-app-text-muted">
          요청하신 페이지가 없거나 주소가 바뀌었어요.
        </p>
      </div>
      <Link
        to={paths.home}
        className="rounded-2xl bg-brand-blue px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-blue/20"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
