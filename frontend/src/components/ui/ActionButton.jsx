const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-900 disabled:bg-brand-600',
  secondary:
    'border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50',
  outline:
    'border border-brand-300 bg-white text-brand-700 shadow-sm hover:bg-brand-50',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
  danger:
    'border border-red-200 bg-white text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50',
  warning:
    'border border-amber-200 bg-white text-amber-800 shadow-sm hover:bg-amber-50',
  solidDanger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-600',
  solidWarning: 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 disabled:bg-amber-600',
};

const SIZES = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-12 px-5 py-3 text-base',
};

export default function ActionButton({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const unavailable = disabled || loading;
  const isNativeButton = Component === 'button';

  return (
    <Component
      {...props}
      {...(isNativeButton ? { disabled: unavailable, type: props.type || 'button' } : {})}
      aria-disabled={!isNativeButton && unavailable ? true : undefined}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${
        unavailable && !isNativeButton ? 'pointer-events-none opacity-55' : ''
      } ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </Component>
  );
}
