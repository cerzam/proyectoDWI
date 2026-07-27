export default function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-gray-300 bg-white text-center ${
        compact ? 'px-5 py-8' : 'px-6 py-12 sm:py-14'
      } ${className}`}
    >
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-700">
          {icon}
        </div>
      )}
      <h2 className="font-serif text-xl font-semibold text-brand-900">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
