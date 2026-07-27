export default function FormField({
  id,
  label,
  help,
  error,
  required = false,
  children,
  className = '',
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="ui-label">
        {label}
        {required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {help && (
        <p id={helpId} className="ui-help">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="ui-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
