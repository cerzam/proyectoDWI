export default function SectionCard({
  as: Component = 'section',
  title,
  description,
  action,
  children,
  className = '',
  contentClassName = '',
  ...props
}) {
  return (
    <Component
      className={`rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm sm:p-6 ${className}`}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="ui-section-title">{title}</h2>}
            {description && <p className="ui-secondary-text mt-1">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`${title || description || action ? 'mt-5' : ''} ${contentClassName}`}>
        {children}
      </div>
    </Component>
  );
}
