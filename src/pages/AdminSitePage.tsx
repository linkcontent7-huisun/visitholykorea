import { Camera, ChevronLeft, History, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { AdminGate } from '@/features/admin/components/AdminGate';
import {
  useRevertSite,
  useSiteDraft,
  useSiteRevisions,
  useUpdateSite,
  useUploadSitePhoto,
} from '@/features/admin/hooks/use-admin';
import type { AdminSitePatch } from '@/features/admin/api/admin.repository';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { shrinkPhoto } from '@/shared/lib/photo';

/** 직접 찍은 사진의 기본 출처 표기. CC 사진을 올릴 때는 손으로 고친다. */
const OWN_PHOTO = { source: '직접 촬영', license: '자체 보유' };

/**
 * 성지 1곳 편집 — 사진 교체와 글 수정.
 *
 * 휴대폰을 앞세운 화면이다. 성지에 가서 찍은 사진을 그 자리에서 바꾸는 것이
 * 이 화면의 존재 이유이므로, 사진이 맨 위에 있고 카메라가 바로 열린다.
 */
export default function AdminSitePage() {
  return (
    <AdminGate>
      <SiteEditor />
    </AdminGate>
  );
}

function SiteEditor() {
  const { siteId } = useParams<{ siteId: string }>();
  const { data: draft, isLoading, error } = useSiteDraft(siteId);
  const { data: revisions } = useSiteRevisions(siteId);

  const update = useUpdateSite(siteId ?? '');
  const upload = useUploadSitePhoto(siteId ?? '');
  const revert = useRevertSite(siteId ?? '');

  const [form, setForm] = useState<AdminSitePatch | null>(null);
  const [pickedPhoto, setPickedPhoto] = useState<{ blob: Blob; preview: string } | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // 서버에서 받은 값으로 입력칸을 채운다. 저장 후 다시 받아도 같은 값이라 덮어써도 안전하다.
  useEffect(() => {
    if (!draft) return;
    setForm({
      location: draft.location,
      description: draft.description,
      history: draft.history,
      image_source: draft.imageSource,
      image_license: draft.imageLicense,
      phone: draft.phone,
      homepage_url: draft.homepageUrl,
    });
  }, [draft]);

  // 미리보기용 임시 주소는 화면을 떠날 때 반드시 놓아준다(메모리 누수).
  useEffect(() => {
    return () => {
      if (pickedPhoto) URL.revokeObjectURL(pickedPhoto.preview);
    };
  }, [pickedPhoto]);

  if (isLoading || !form) return <LoadingSpinner />;
  if (error || !draft) {
    return <p className="px-6 py-20 text-center font-bold text-red-500">성지를 찾지 못했습니다.</p>;
  }

  const set = (key: keyof AdminSitePatch, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 change 가 나게 비워 둔다
    if (!file) return;
    const blob = await shrinkPhoto(file);
    if (pickedPhoto) URL.revokeObjectURL(pickedPhoto.preview);
    setPickedPhoto({ blob, preview: URL.createObjectURL(blob) });
    setMessage(null);
  };

  const handleUpload = () => {
    if (!pickedPhoto) return;
    upload.mutate(
      {
        photo: pickedPhoto.blob,
        source: form.image_source.trim() || OWN_PHOTO.source,
        license: form.image_license.trim() || OWN_PHOTO.license,
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setMessage({ kind: 'error', text: result.error ?? '사진을 바꾸지 못했습니다.' });
            return;
          }
          URL.revokeObjectURL(pickedPhoto.preview);
          setPickedPhoto(null);
          setMessage({ kind: 'ok', text: '대표 사진을 바꿨습니다.' });
        },
      },
    );
  };

  const handleSave = () => {
    update.mutate(form, {
      onSuccess: (result) => {
        setMessage(
          result.success
            ? { kind: 'ok', text: '저장했습니다.' }
            : { kind: 'error', text: result.error ?? '저장하지 못했습니다.' },
        );
      },
    });
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-slate-50 pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-3">
        <Link to={paths.admin} className="p-2 text-slate-700" aria-label="목록으로">
          <ChevronLeft size={24} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-black text-slate-900">{draft.name}</h1>
          <p className="text-xs font-bold text-slate-400">{draft.diocese || '교구 미상'}</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* 대표 사진 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black text-slate-900">대표 사진</h2>

          <div className="overflow-hidden rounded-xl bg-slate-100">
            {pickedPhoto ? (
              <img src={pickedPhoto.preview} alt="새 사진 미리보기" className="aspect-[4/3] w-full object-cover" />
            ) : draft.imageUrl ? (
              <img src={draft.imageUrl} alt={`${draft.name} 대표 사진`} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center text-sm font-bold text-slate-400">
                사진 없음
              </div>
            )}
          </div>

          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-700">
            <Camera size={18} />
            {pickedPhoto ? '다시 고르기' : '사진 찍기 · 고르기'}
            <input
              type="file"
              accept="image/*"
              // 휴대폰에서는 뒷면 카메라가 바로 열린다. PC 에서는 그냥 파일 선택이 뜬다.
              capture="environment"
              onChange={(e) => void handlePick(e)}
              className="hidden"
            />
          </label>

          {pickedPhoto && (
            <button
              onClick={handleUpload}
              disabled={upload.isPending}
              className="mt-2 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {upload.isPending ? '올리는 중…' : '이 사진으로 교체'}
            </button>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Field
              label="출처"
              value={form.image_source}
              onChange={(v) => set('image_source', v)}
              placeholder={OWN_PHOTO.source}
            />
            <Field
              label="이용 조건"
              value={form.image_license}
              onChange={(v) => set('image_license', v)}
              placeholder={OWN_PHOTO.license}
            />
          </div>
          <p className="mt-2 text-[11px] font-bold leading-relaxed text-slate-400">
            남의 사진(CC·공공누리)을 쓸 때는 출처와 이용 조건을 반드시 적습니다. 표기가 빠지면
            라이선스 위반입니다.
          </p>
        </section>

        {/* 안내 글 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black text-slate-900">안내 글</h2>
          <TextArea
            label="소개글"
            value={form.description}
            onChange={(v) => set('description', v)}
            rows={4}
          />
          <TextArea
            label="역사"
            value={form.history}
            onChange={(v) => set('history', v)}
            rows={8}
          />
          <p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-400">
            한국어를 고쳐도 영어·스페인어 등 다른 언어 번역은 그대로 남습니다. 번역은
            `npm run translate:status` 로 따로 확인합니다.
          </p>
        </section>

        {/* 기본 정보 */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black text-slate-900">기본 정보</h2>
          <Field label="주소" value={form.location} onChange={(v) => set('location', v)} />
          <Field label="전화" value={form.phone} onChange={(v) => set('phone', v)} />
          <Field
            label="홈페이지"
            value={form.homepage_url}
            onChange={(v) => set('homepage_url', v)}
          />
          <p className="mt-2 text-[11px] font-bold leading-relaxed text-slate-400">
            성지 이름·교구·좌표는 여기서 고칠 수 없습니다. 지도와 순례 여권이 그 값을 기준으로
            묶여 있어, 바꾸려면 확인할 것이 많습니다.
          </p>
        </section>

        {/* 수정 이력 */}
        {revisions && revisions.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-900">
              <History size={15} />
              수정 이력
            </h2>
            <ul className="flex flex-col gap-2">
              {revisions.map((rev) => (
                <li
                  key={rev.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {new Date(rev.changedAt).toLocaleString('ko-KR')}
                    </p>
                    <p className="truncate text-[11px] font-bold text-slate-400">
                      {rev.fields.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      revert.mutate(rev.before, {
                        onSuccess: (result) =>
                          setMessage(
                            result.success
                              ? { kind: 'ok', text: '이 시점으로 되돌렸습니다.' }
                              : { kind: 'error', text: result.error ?? '되돌리지 못했습니다.' },
                          ),
                      })
                    }
                    disabled={revert.isPending}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    이 값으로
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* 저장 — 현장에서 한 손으로 누르는 자리 */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-3xl border-t border-slate-200 bg-white px-5 py-3">
        {message && (
          <p
            role="status"
            className={`mb-2 text-center text-sm font-bold ${
              message.kind === 'ok' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-base font-bold text-white disabled:opacity-50"
        >
          <Save size={18} />
          {update.isPending ? '저장 중…' : '글 저장'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium leading-relaxed text-slate-900 focus:border-slate-900 focus:outline-none"
      />
    </label>
  );
}
