import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageIcon, SnowflakeIcon, SunIcon } from '@phosphor-icons/react'
import { assetUrl } from '@/lib/api'

/** The first photo of a warehouse as a small square, or a sun / snowflake when it has none yet */
export function WarehouseThumb({ warehouse, size = 'size-16' }) {
  const [photo] = warehouse.photos ?? []
  if (!photo) {
    const Icon = warehouse.is_cold_storage ? SnowflakeIcon : SunIcon
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-sage text-leaf`}>
        <Icon size={24} aria-hidden="true" />
      </span>
    )
  }
  return <img src={assetUrl(photo.url)} alt="" className={`${size} shrink-0 rounded-xl object-cover`} loading="lazy" />
}

/** A large photo with a row of small ones to switch between, so farmers can see the warehouse before booking */
export function PhotoGallery({ photos = [], name }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl bg-sage text-leaf">
        <ImageIcon size={32} aria-hidden="true" />
        <p className="text-sm font-medium">{t('storage.noPhotos')}</p>
      </div>
    )
  }

  const current = photos[Math.min(index, photos.length - 1)]
  return (
    <div>
      <img
        src={assetUrl(current.url)}
        alt={t('storage.photoOf', { name, number: Math.min(index, photos.length - 1) + 1 })}
        className="aspect-[16/9] w-full rounded-xl bg-sage object-cover"
      />
      {photos.length > 1 && (
        <ul className="mt-2 flex gap-2">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('storage.showPhoto', { number: i + 1 })}
                aria-current={i === index}
                className={`block overflow-hidden rounded-lg border-2 transition-colors ${
                  i === index ? 'border-forest' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={assetUrl(photo.url)} alt="" className="size-14 object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
