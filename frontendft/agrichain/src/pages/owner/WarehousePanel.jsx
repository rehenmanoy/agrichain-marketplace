import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagesIcon, SnowflakeIcon, SunIcon, XIcon } from '@phosphor-icons/react'
import {
  useAddWarehousePhotos,
  useCreateWarehouse,
  useRemoveWarehousePhoto,
  useUpdateWarehouse,
} from '@/api/owner'
import { assetUrl } from '@/lib/api'
import { errorMessage } from '@/lib/errors'
import { rupees } from '@/lib/format'
import { PHOTOS, perQuintalPerMonth } from '@/lib/storage'
import { Button } from '@/components/Button'
import { Panel } from '@/components/Dialogs'
import { Field, FormError } from '@/components/Field'
import { Stepper } from '@/components/Stepper'
import { useToast } from '@/components/toast-context'

/**
 * Add a warehouse (mode "create") or change one ("edit"). Photos are required: at least 2, at most 5,
 * counting the ones already saved. Mounted only while open, so its state starts fresh each time.
 */
export function WarehousePanel({ mode, warehouse, onClose }) {
  const { t } = useTranslation()
  const toast = useToast()
  const create = useCreateWarehouse()
  const update = useUpdateWarehouse()
  const addPhotos = useAddWarehousePhotos()
  const removePhoto = useRemoveWarehousePhoto()

  const [name, setName] = useState(warehouse?.name ?? '')
  const [location, setLocation] = useState(warehouse?.location ?? '')
  const [kg, setKg] = useState(warehouse?.total_capacity_kg ?? 1000)
  const [price, setPrice] = useState(warehouse ? String(warehouse.price_per_kg_per_day) : '')
  const [cold, setCold] = useState(warehouse?.is_cold_storage ?? false)
  const saved = warehouse?.photos ?? [] // photos already on the server
  const [removedIds, setRemovedIds] = useState([])
  const [added, setAdded] = useState([]) // new files: { file, url }
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef(null)

  // Free the preview images when the panel closes
  const urls = useRef([])
  useEffect(() => {
    const list = urls.current
    return () => list.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  // Typing in a field clears its error message
  const edit = (setter, key) => (event) => {
    setter(event.target.value)
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const keptSaved = saved.filter((photo) => !removedIds.includes(photo.id))
  const photoCount = keptSaved.length + added.length
  const monthly = perQuintalPerMonth(Number(price))

  const pickFiles = (event) => {
    const chosen = [...event.target.files]
    event.target.value = ''
    const problems = []
    const accepted = []

    for (const file of chosen) {
      if (!PHOTOS.TYPES.includes(file.type)) problems.push(t('owner.form.photoType', { name: file.name }))
      else if (file.size > PHOTOS.MAX_BYTES) problems.push(t('owner.form.photoSize', { name: file.name }))
      else if (photoCount + accepted.length >= PHOTOS.MAX) problems.push(t('owner.form.photoMax', { max: PHOTOS.MAX }))
      else {
        const url = URL.createObjectURL(file)
        urls.current.push(url)
        accepted.push({ file, url })
      }
    }
    setAdded((current) => [...current, ...accepted])
    setErrors((e) => ({ ...e, photos: problems.length ? [...new Set(problems)].join(' ') : undefined }))
  }

  const validate = () => {
    const next = {}
    if (name.trim().length < 2) next.name = t('owner.form.nameRequired')
    if (location.trim().length < 2) next.location = t('owner.form.placeRequired')
    if (price.trim() === '' || !(Number(price) >= 0)) next.price = t('owner.form.priceRequired')
    if (photoCount < PHOTOS.MIN) next.photos = t('owner.form.photosNeeded', { min: PHOTOS.MIN })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    setFormError(null)
    if (!validate()) return
    setBusy(true)
    try {
      const fields = {
        name: name.trim(),
        location: location.trim(),
        total_capacity_kg: kg,
        price_per_kg_per_day: Number(price),
        is_cold_storage: cold,
      }

      if (mode === 'create') {
        await create.mutateAsync({ ...fields, photos: added.map((item) => item.file) })
        toast(t('owner.form.addedToast', { name: fields.name }))
      } else {
        const changes = Object.fromEntries(Object.entries(fields).filter(([key, value]) => value !== warehouse[key]))
        if (Object.keys(changes).length > 0) await update.mutateAsync({ id: warehouse.id, ...changes })
        // New photos first, so the warehouse never drops below the minimum on the way
        if (added.length > 0) await addPhotos.mutateAsync({ id: warehouse.id, files: added.map((item) => item.file) })
        for (const photoId of removedIds) await removePhoto.mutateAsync({ id: warehouse.id, photoId })
        toast(t('owner.form.savedToast', { name: fields.name }))
      }
      onClose()
    } catch (error) {
      setFormError(errorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  const segment = (selected) =>
    `flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm transition-colors ${
      selected ? 'bg-forest font-semibold text-white shadow-sm' : 'text-ink hover:text-forest'
    }`

  return (
    <Panel
      open
      onClose={onClose}
      title={mode === 'create' ? t('owner.form.addTitle') : t('owner.form.editTitle', { name: warehouse.name })}
      subtitle={mode === 'create' ? t('owner.form.addSubtitle') : undefined}
      footer={
        <div className="space-y-4">
          <FormError message={formError} />
          <Button className="w-full" onClick={submit} loading={busy}>
            {busy ? t('owner.form.saving') : mode === 'create' ? t('owner.form.add') : t('owner.form.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        <Field
          label={t('owner.form.name')}
          value={name}
          onChange={edit(setName, 'name')}
          error={errors.name}
          maxLength={100}
        />
        <Field
          label={t('owner.form.place')}
          hint={t('owner.form.placeHint')}
          value={location}
          onChange={edit(setLocation, 'location')}
          error={errors.location}
          maxLength={200}
        />

        <div>
          <p className="text-sm font-medium text-ink" id="warehouse-kind">
            {t('owner.form.kind')}
          </p>
          <div role="radiogroup" aria-labelledby="warehouse-kind" className="mt-2 flex rounded-xl bg-line-soft p-1">
            <button type="button" role="radio" aria-checked={!cold} onClick={() => setCold(false)} className={segment(!cold)}>
              <SunIcon size={16} aria-hidden="true" />
              {t('storage.dry')}
            </button>
            <button type="button" role="radio" aria-checked={cold} onClick={() => setCold(true)} className={segment(cold)}>
              <SnowflakeIcon size={16} aria-hidden="true" />
              {t('storage.cold')}
            </button>
          </div>
          {/* Cold rooms cost more to run (electricity), so say so before the owner sets a price */}
          <p className="mt-2 text-[13px] text-muted">{cold ? t('owner.form.coldHint') : t('owner.form.dryHint')}</p>
        </div>

        <Stepper
          label={t('owner.form.space')}
          srLabel={t('storage.kgLabel')}
          suffix="kg"
          value={kg}
          onChange={(v) => setKg(Math.round(v))}
          min={1}
          max={1000000}
          step={100}
          hint={mode === 'edit' ? t('owner.form.spaceEditHint') : t('owner.form.spaceHint')}
        />

        <Field
          label={t('owner.form.price')}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={edit(setPrice, 'price')}
          error={errors.price}
          hint={
            price !== '' && Number(price) >= 0
              ? t('owner.form.priceMonthly', { amount: rupees(monthly) })
              : t('owner.form.priceHint')
          }
        />

        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-ink">{t('owner.form.photos')}</p>
            <p className="text-[13px] text-muted">{t('owner.form.photoCount', { have: photoCount, max: PHOTOS.MAX })}</p>
          </div>
          <p className="mt-1 text-[13px] text-muted">{t('owner.form.photosHelp', { min: PHOTOS.MIN, max: PHOTOS.MAX })}</p>

          {(keptSaved.length > 0 || added.length > 0) && (
            <ul className="mt-3 grid grid-cols-3 gap-3">
              {keptSaved.map((photo) => (
                <PhotoTile
                  key={`saved-${photo.id}`}
                  src={assetUrl(photo.url)}
                  label={t('owner.form.removePhoto')}
                  onRemove={() => setRemovedIds((ids) => [...ids, photo.id])}
                />
              ))}
              {added.map((item) => (
                <PhotoTile
                  key={item.url}
                  src={item.url}
                  label={t('owner.form.removePhoto')}
                  onRemove={() => setAdded((current) => current.filter((c) => c.url !== item.url))}
                />
              ))}
            </ul>
          )}

          <input
            ref={fileInput}
            type="file"
            accept={PHOTOS.TYPES.join(',')}
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={pickFiles}
            aria-label={t('owner.form.choosePhotos')}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={ImagesIcon}
            className="mt-3"
            onClick={() => fileInput.current?.click()}
            disabled={photoCount >= PHOTOS.MAX}
          >
            {t('owner.form.choosePhotos')}
          </Button>
          {errors.photos && (
            <p role="alert" className="mt-2 text-[13px] font-medium text-danger">
              {errors.photos}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}

function PhotoTile({ src, label, onRemove }) {
  return (
    <li className="relative">
      <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        title={label}
        className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-white/95 text-ink shadow hover:text-danger"
      >
        <XIcon size={14} weight="bold" aria-hidden="true" />
      </button>
    </li>
  )
}
