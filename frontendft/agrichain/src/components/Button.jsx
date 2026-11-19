import { Link } from 'react-router'
import { SpinnerIcon } from '@phosphor-icons/react'
import { buttonClasses } from '@/lib/ui'

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}) {
  const iconSize = size === 'sm' ? 14 : 16
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <SpinnerIcon size={iconSize} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={iconSize} weight="bold" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant = 'primary', size = 'md', icon: Icon, className, children }) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, className })}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} weight="bold" aria-hidden="true" />}
      {children}
    </Link>
  )
}
