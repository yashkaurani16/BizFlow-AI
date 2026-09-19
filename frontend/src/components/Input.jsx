function Input({ id, label, type = 'text', error, required, hint, ...props }) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="field">
      {label ? (
        <label htmlFor={id}>
          {label}
          {required ? <span className="required-mark"> required</span> : null}
        </label>
      ) : null}
      <input
        id={id}
        className={`input${error ? ' is-invalid' : ''}`}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        required={required}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default Input
