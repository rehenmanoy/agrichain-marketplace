import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { MagnifyingGlassIcon, MapPinIcon, ShoppingCartSimpleIcon, StorefrontIcon, XIcon } from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useRegionListings } from '@/api/buyer'
import { useFarmerReviews } from '@/api/reviews'
import { errorMessage } from '@/lib/errors'
import { number, rupees } from '@/lib/format'
import { round2 } from '@/lib/pricing'
import { matchesProduce, produceAltName, produceName } from '@/lib/produce'
import { Card, PageHeader, ProduceMark } from '@/components/Bits'
import { Button } from '@/components/Button'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/Loader'
import { ReviewsPanel } from '@/components/ReviewsPanel'
import { Stars } from '@/components/StarRating'
import { AddToCartPanel } from './AddToCartPanel'

const FILTERS = [
  { value: 'ALL', label: 'buyer.shop.all' },
  { value: 'VEGETABLE', label: 'produce.vegetables' },
  { value: 'FRUIT', label: 'produce.fruits' },
]

export default function Shop() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const listings = useRegionListings(user?.region_id)
  const [params, setParams] = useSearchParams()
  const [ordering, setOrdering] = useState(null)
  const [reviewsOf, setReviewsOf] = useState(null) // a listing whose farmer's reviews are open

  // The filters live in the address (?q=, ?type=, ?farmer=), so links from the dashboard can use them
  const query = params.get('q') ?? ''
  const type = FILTERS.some((f) => f.value === params.get('type')) ? params.get('type') : 'ALL'
  const farmerId = Number(params.get('farmer')) || null
  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const all = listings.data ?? []
  const shown = all.filter(
    (l) =>
      (type === 'ALL' || l.produce_category === type) &&
      (!farmerId || l.farmer_id === farmerId) &&
      matchesProduce({ name: l.produce_name }, query),
  )
  const farmerName = farmerId ? all.find((l) => l.farmer_id === farmerId)?.farmer_name : null

  return (
    <>
      <PageHeader
        title={t('buyer.shop.title')}
        subtitle={t('buyer.shop.subtitle', { region: user?.region_name })}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-72 flex-1">
          <label htmlFor="produce-search" className="sr-only">
            {t('buyer.shop.searchLabel')}
          </label>
          <MagnifyingGlassIcon
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="produce-search"
            type="search"
            autoComplete="off"
            placeholder={t('buyer.shop.searchPlaceholder')}
            value={query}
            onChange={(e) => setParam('q', e.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-white pr-12 pl-12 text-[15px] text-ink outline-none placeholder:text-muted/70 focus:border-leaf focus:ring-4 focus:ring-sage [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setParam('q', '')}
              className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-sage hover:text-forest"
              aria-label={t('buyer.shop.clear')}
            >
              <XIcon size={16} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>

        <div role="radiogroup" aria-label={t('produce.categoryLabel')} className="inline-flex rounded-xl bg-line-soft p-1">
          {FILTERS.map(({ value, label }) => {
            const checked = value === type
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setParam('type', value === 'ALL' ? '' : value)}
                className={`h-10 rounded-lg px-5 text-sm transition-colors ${
                  checked ? 'bg-forest font-semibold text-white shadow-sm' : 'text-ink hover:text-forest'
                }`}
              >
                {t(label)}
              </button>
            )
          })}
        </div>
      </div>

      {farmerId && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-sage px-5 py-3 text-sm text-forest">
          <span>{t('buyer.shop.showingFarmer', { farmer: farmerName ?? '' })}</span>
          <button type="button" onClick={() => setParam('farmer', '')} className="font-semibold underline-offset-4 hover:underline">
            {t('buyer.shop.showAll')}
          </button>
        </div>
      )}

      <div className="mt-8">
        {listings.isPending ? (
          <Card>
            <SkeletonRows rows={4} />
          </Card>
        ) : listings.isError ? (
          <Card>
            <ErrorState message={errorMessage(listings.error, t)} onRetry={listings.refetch} />
          </Card>
        ) : all.length === 0 ? (
          <Card>
            <EmptyState icon={StorefrontIcon} title={t('buyer.shop.emptyNone')} body={t('buyer.shop.emptyNoneBody')} />
          </Card>
        ) : shown.length === 0 ? (
          <Card>
            <EmptyState
              icon={MagnifyingGlassIcon}
              title={t('buyer.shop.emptyTitle')}
              body={query ? t('buyer.shop.emptyQuery', { query }) : t('buyer.shop.emptyBody')}
              action={
                query ? (
                  <Button variant="secondary" onClick={() => setParam('q', '')}>
                    {t('buyer.shop.clear')}
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {t('buyer.shop.resultCount', { count: shown.length })}
            </p>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  lang={i18n.language}
                  onOrder={() => setOrdering(listing)}
                  onReviews={() => setReviewsOf(listing)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {ordering && <AddToCartPanel key={ordering.id} listing={ordering} onClose={() => setOrdering(null)} />}
      {reviewsOf && <FarmerReviews key={reviewsOf.farmer_id} listing={reviewsOf} onClose={() => setReviewsOf(null)} />}
    </>
  )
}

/** The farmer's reviews, opened from the rating on a card */
function FarmerReviews({ listing, onClose }) {
  const { t } = useTranslation()
  const query = useFarmerReviews(listing.farmer_id)
  return (
    <ReviewsPanel
      title={t('reviews.farmerTitle', { name: listing.farmer_name })}
      subtitle={listing.farmer_location}
      query={query}
      kind="farmer"
      onClose={onClose}
    />
  )
}

function ListingCard({ listing, lang, onOrder, onReviews }) {
  const { t } = useTranslation()
  // Produce a farmer added has no market price to compare with
  const hasMarketPrice = listing.market_price != null
  const diff = hasMarketPrice ? round2(listing.listing_price - listing.market_price) : 0

  return (
    <Card as="li" className="flex flex-col p-5">
      <div className="flex items-start gap-3.5">
        <ProduceMark name={listing.produce_name} category={listing.produce_category} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl text-ink">{produceName(listing.produce_name, lang)}</h3>
          <p className="truncate text-sm text-muted">{produceAltName(listing.produce_name, lang)}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="font-serif text-[28px] leading-none whitespace-nowrap text-ink">
          {t('common.perKg', { price: rupees(listing.listing_price) })}
        </p>
        <p className="mt-1.5 text-[13px] text-muted">
          {!hasMarketPrice
            ? t('produce.farmerPrice')
            : diff > 0
              ? t('produce.aboveMarket', { amount: rupees(diff) })
              : diff < 0
                ? t('produce.belowMarket', { amount: rupees(-diff) })
                : t('produce.atMarket')}
        </p>
        <p className="mt-1 text-sm font-medium text-leaf">{t('buyer.shop.available', { qty: number(listing.available_qty) })}</p>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-line-soft pt-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage font-serif text-forest"
          aria-hidden="true"
        >
          {listing.farmer_name?.[0]}
        </span>
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold text-ink">{listing.farmer_name}</p>
          <p className="flex items-center gap-1 truncate text-[13px] text-muted">
            <MapPinIcon size={13} className="shrink-0" aria-hidden="true" />
            {listing.farmer_location}
          </p>
        </div>
        {listing.farmer_review_count > 0 ? (
          <button
            type="button"
            onClick={onReviews}
            aria-label={t('reviews.readReviews', { name: listing.farmer_name })}
            className="ml-auto flex shrink-0 flex-col items-end gap-0.5 rounded-lg px-2 py-1 text-[12px] text-muted transition-colors hover:bg-sage hover:text-forest"
          >
            <Stars value={listing.farmer_rating} size={13} />
            {t('buyer.shop.rating', { rating: listing.farmer_rating, count: listing.farmer_review_count })}
          </button>
        ) : (
          <div className="ml-auto shrink-0 text-[12px] text-muted">{t('buyer.shop.noRatings')}</div>
        )}
      </div>

      <Button className="mt-5 w-full" icon={ShoppingCartSimpleIcon} onClick={onOrder}>
        {t('cart.add')}
      </Button>
    </Card>
  )
}
