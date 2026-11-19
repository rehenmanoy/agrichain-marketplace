import { useState } from 'react'

const SLIDERS = [
  { key: 'x', label: 'Left / right', unit: 'vw', min: 0, max: 45, step: 0.5 },
  { key: 'y', label: 'Up / down', unit: 'vh', min: -30, max: 30, step: 0.5 },
  { key: 'width', label: 'Width', unit: 'px', min: 360, max: 680, step: 4 },
]

/**
 * Development-only panel with sliders for placing the landing page card.
 * Not included in production builds (Landing only renders it when import.meta.env.DEV).
 */
export default function CardTuner({ value, onChange, onReset }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(value))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink shadow-lg"
      >
        Card position
      </button>
    )
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-72 rounded-2xl bg-white p-5 text-sm text-ink shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Card position (dev only)</p>
        <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink" aria-label="Hide">
          ✕
        </button>
      </div>

      {SLIDERS.map(({ key, label, unit, min, max, step }) => (
        <label key={key} className="mt-4 block">
          <span className="flex justify-between text-[13px]">
            <span>{label}</span>
            <span className="text-muted tabular-nums">
              {value[key]}
              {unit}
            </span>
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
            className="mt-1.5 w-full accent-forest"
          />
        </label>
      ))}

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={copy} className="flex-1 rounded-lg bg-forest px-3 py-2 font-medium text-white">
          {copied ? 'Copied' : 'Copy values'}
        </button>
        <button type="button" onClick={onReset} className="rounded-lg border border-line px-3 py-2">
          Reset
        </button>
      </div>
    </div>
  )
}
