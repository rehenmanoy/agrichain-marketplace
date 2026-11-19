// Shared class recipes, so links that look like buttons match real buttons

const VARIANTS = {
  primary: 'bg-forest text-white hover:bg-forest-hover',
  secondary: 'border border-line bg-white text-ink hover:border-leaf hover:text-forest',
  danger: 'border border-line bg-white text-danger hover:border-danger hover:bg-danger-soft',
  destructive: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-forest hover:bg-sage',
}

const SIZES = {
  md: 'h-10 gap-2 px-4 text-sm',
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
}

export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return [
    'inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap',
    'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ')
}

export const cardClasses = 'rounded-2xl border border-line bg-white'

/** Light frosted glass over the farm photo: the field shows through, a fine top highlight instead of a heavy shadow */
export const glassCardClasses =
  'rounded-[28px] border border-white/20 bg-gradient-to-br from-white/[0.16] via-white/[0.07] to-white/[0.03] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_24px_60px_-28px_rgb(0_0_0/0.45)] backdrop-blur-md backdrop-saturate-150'

/**
 * The farm photo as a full-screen background, under a shade (any CSS gradient).
 * While the photo loads, the deep green and field lines show instead.
 */
export function farmPhotoBackground(shade) {
  return {
    backgroundImage: `${shade}, url('/hero-farm.webp'), url('/field-lines.svg')`,
    backgroundSize: 'cover, cover, auto',
    backgroundPosition: 'center, center, center',
    backgroundRepeat: 'no-repeat, no-repeat, repeat',
  }
}
