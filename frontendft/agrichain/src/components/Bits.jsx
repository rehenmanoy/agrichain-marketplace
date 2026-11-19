import { produceIcon } from '@/lib/produce'
import { cardClasses } from '@/lib/ui'

/** Small uppercase label above a section heading, as in the AgriChain style */
export function Eyebrow({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-leaf uppercase">
      {Icon && <Icon size={14} weight="bold" aria-hidden="true" />}
      {children}
    </p>
  )
}

export function IconCircle({ icon: Icon, size = 'md', className = '' }) {
  const box = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10'
  const glyph = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-sage text-leaf ${className}`}>
      <Icon size={glyph} aria-hidden="true" />
    </span>
  )
}

export function ProduceMark({ name, category, size = 'md' }) {
  return <IconCircle icon={produceIcon(name, category)} size={size} />
}

export function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag className={`${cardClasses} ${className}`} {...props}>
      {children}
    </Tag>
  )
}

/** Small rounded label, e.g. "Cold storage" or "Selling" */
export function Pill({ tone = 'sage', icon: Icon, children }) {
  const tones = {
    sage: 'bg-sage text-forest',
    amber: 'bg-amber-soft text-amber',
    sky: 'bg-sky-soft text-sky',
    forest: 'bg-forest text-white',
    muted: 'bg-line-soft text-muted',
    danger: 'bg-danger-soft text-danger',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {Icon && <Icon size={12} weight="bold" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function PageHeader({ eyebrow, eyebrowIcon, title, subtitle, action }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 pb-8">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>}
        <h1 className="mt-2 text-[32px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
