function PreferenceToggle({ id, label, description, checked, onChange, disabled = false }) {
  const descId = description ? `${id}-desc` : undefined

  return (
    <div className="preference-item">
      <div className="preference-text">
        <label htmlFor={id} className="preference-label">
          {label}
        </label>
        {description ? (
          <p id={descId} className="preference-desc">
            {description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        className={`toggle-switch ${checked ? 'is-checked' : ''}`}
        onClick={onChange}
        disabled={disabled}
      >
        <span className="toggle-thumb" aria-hidden="true" />
        <span className="sr-only">{checked ? 'Enabled' : 'Disabled'}</span>
      </button>
    </div>
  )
}

export default PreferenceToggle
