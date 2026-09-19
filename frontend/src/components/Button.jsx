import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

const Button = forwardRef(function Button(
  { children, variant = 'primary', type = 'button', className = '', to, ...props },
  ref,
) {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ')

  if (to) {
    return (
      <Link to={to} className={classes} ref={ref} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} ref={ref} {...props}>
      {children}
    </button>
  )
})

export default Button
