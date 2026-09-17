export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
      {label && <p className="text-base font-bold text-app-text-muted">{label}</p>}
    </div>
  );
}
