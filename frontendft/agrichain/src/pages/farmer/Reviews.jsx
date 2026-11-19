import { useTranslation } from 'react-i18next'
import { StarIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useFarmerReviews } from '@/api/reviews'
import { errorMessage } from '@/lib/errors'
import { Card, PageHeader } from '@/components/Bits'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { RatingSummary } from '@/components/RatingSummary'
import { ReviewList } from '@/components/ReviewList'

/** Everything buyers have said about this farmer */
export default function FarmerReviews() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const reviews = useFarmerReviews(user?.id)

  return (
    <>
      <PageHeader title={t('reviews.pageTitle')} subtitle={t('reviews.pageSubtitle')} />

      {reviews.isPending ? (
        <Card>
          <SkeletonRows rows={3} />
        </Card>
      ) : reviews.isError ? (
        <Card>
          <ErrorState message={errorMessage(reviews.error, t)} onRetry={reviews.refetch} />
        </Card>
      ) : reviews.data.length === 0 ? (
        <Card>
          <EmptyState icon={StarIcon} title={t('reviews.farmerEmptyTitle')} body={t('reviews.farmerEmptyBody')} />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.6fr]">
          <Card className="p-6">
            <RatingSummary reviews={reviews.data} />
          </Card>
          <Card className="p-6">
            <ReviewList reviews={reviews.data} kind="farmer" />
          </Card>
        </div>
      )}
    </>
  )
}
