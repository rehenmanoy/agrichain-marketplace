import { useTranslation } from 'react-i18next'
import { StarIcon } from '@phosphor-icons/react'
import { errorMessage } from '@/lib/errors'
import { Panel } from './Dialogs'
import { EmptyState, ErrorState, SkeletonRows } from './Loader'
import { RatingSummary } from './RatingSummary'
import { ReviewList } from './ReviewList'

/** A side panel with someone's (or something's) reviews. `query` is a useQuery result holding the list. */
export function ReviewsPanel({ title, subtitle, query, kind, onClose }) {
  const { t } = useTranslation()

  return (
    <Panel open onClose={onClose} title={title} subtitle={subtitle}>
      {query.isPending ? (
        <SkeletonRows rows={3} />
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error, t)} onRetry={query.refetch} />
      ) : query.data.length === 0 ? (
        <EmptyState icon={StarIcon} title={t('reviews.emptyTitle')} body={t('reviews.emptyBody')} />
      ) : (
        <div className="space-y-8">
          <RatingSummary reviews={query.data} />
          <ReviewList reviews={query.data} kind={kind} />
        </div>
      )}
    </Panel>
  )
}
