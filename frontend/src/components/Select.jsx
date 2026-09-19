function Select({ id, label, error, required, children, ...props }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      {label ? (
        <label htmlFor={id}>
          {label}
          {required ? <span className="required-mark"> required</span> : null}
        </label>
      ) : null}
      <select
        id={id}
        className={`select${error ? ' is-invalid' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        required={required}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default Select
