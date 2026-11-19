import { useTranslation } from 'react-i18next'
import { useWarehouseReviews } from '@/api/reviews'
import { ReviewsPanel } from './ReviewsPanel'

/** What farmers have said about one warehouse, in a side panel */
export function WarehouseReviews({ warehouse, onClose }) {
  const { t } = useTranslation()
  const query = useWarehouseReviews(warehouse.id)
  return (
    <ReviewsPanel
      title={t('reviews.warehouseTitle', { name: warehouse.name })}
      subtitle={warehouse.location}
      query={query}
      kind="warehouse"
      onClose={onClose}
    />
  )
}
