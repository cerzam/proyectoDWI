const TONES = {
  success: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-900 ring-amber-200',
  danger: 'bg-red-100 text-red-800 ring-red-200',
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  brand: 'bg-brand-50 text-brand-900 ring-brand-100',
  purple: 'bg-purple-100 text-purple-800 ring-purple-200',
};

export default function StatusBadge({
  tone = 'neutral',
  children,
  showDot = true,
  className = '',
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {showDot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
