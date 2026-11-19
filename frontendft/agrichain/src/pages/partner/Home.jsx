import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CurrencyInrIcon,
  HandCoinsIcon,
  LeafIcon,
  PackageIcon,
  StarIcon,
  TruckIcon,
} from '@phosphor-icons/react'
import { useAuth } from '@/auth/AuthContext'
import { useDashboard } from '@/api/dashboard'
import { useMyDeliveries } from '@/api/partner'
import { usePartnerReviews } from '@/api/reviews'
import { formatLongDate, number, rupees } from '@/lib/format'
import { greetingKey } from '@/lib/greeting'
import { orderTitle } from '@/lib/orders'
import { Card, Eyebrow, IconCircle, Pill } from '@/components/Bits'
import { ButtonLink } from '@/components/Button'
import { DelayNotice } from '@/components/DelayNotice'
import { DeliveryRoute } from '@/components/DeliveryRoute'
import { OrderItemLines, OrderMark } from '@/components/OrderItems'
import { ReviewList } from '@/components/ReviewList'
import { Stars } from '@/components/StarRating'
import { WeekBars } from '@/components/WeekBars'

export default function PartnerHome() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const dashboard = useDashboard()
  const mine = useMyDeliveries()
  const ratings = usePartnerReviews(user?.id)
  const data = dashboard.data

  const current = mine.data?.filter((o) => o.status === 'OUT_FOR_DELIVERY') ?? []
  const active = data?.active_deliveries ?? 0
  const waiting = data?.available_now ?? 0
  const days = data?.earnings_last_7_days ?? []

  let statusLine = t('partner.home.statusNone')
  if (active > 0) statusLine = t('partner.home.statusActive', { count: active })
  else if (waiting > 0) statusLine = t('partner.home.statusWaiting', { count: waiting })

  const stats = [
    { icon: CurrencyInrIcon, label: t('partner.home.earned'), value: rupees(data?.total_earned) },
    { icon: CheckCircleIcon, label: t('partner.home.completed'), value: number(data?.completed_deliveries) },
    { icon: TruckIcon, label: t('partner.home.onTheWay'), value: number(active) },
    { icon: PackageIcon, label: t('partner.home.waiting'), value: number(waiting) },
  ]

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <Pill icon={LeafIcon}>{formatLongDate(new Date(), i18n.language)}</Pill>
          <h1 className="mt-5 text-[42px] leading-[1.15]">
            <span className="block text-ink">{t(greetingKey(), { name: user?.name ?? '' })}</span>
            <span className="block text-leaf">{statusLine}</span>
          </h1>
        </div>
        <ButtonLink to="/partner/available" icon={PackageIcon}>
          {t('partner.home.seeAvailable')}
        </ButtonLink>
      </section>

      <ul className="mt-10 grid grid-cols-4 gap-5">
        {stats.map(({ icon, label, value }) => (
          <Card as="li" key={label} className="p-5">
            <div className="flex items-center gap-3">
              <IconCircle icon={icon} size="sm" />
              <p className="text-sm text-muted">{label}</p>
            </div>
            {dashboard.isPending ? (
              <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-line-soft" />
            ) : (
              <p className="mt-3 font-serif text-[34px] leading-none text-ink">{value}</p>
            )}
          </Card>
        ))}
      </ul>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <Eyebrow icon={TruckIcon}>{t('partner.home.nowEyebrow')}</Eyebrow>
              <h2 className="mt-1.5 text-[22px] text-ink">{t('partner.home.nowTitle')}</h2>
            </div>
            {current.length > 0 && (
              <Link to="/partner/deliveries" className="flex items-center gap-1.5 text-sm font-medium text-leaf hover:text-forest">
                {t('partner.home.manage')}
                <ArrowRightIcon size={14} aria-hidden="true" />
              </Link>
            )}
          </div>

          {current.length === 0 ? (
            <p className="mt-6 rounded-xl bg-paper px-5 py-6 text-sm text-muted">
              {waiting > 0 ? t('partner.home.nothingNowWaiting', { count: waiting }) : t('partner.home.nothingNow')}
            </p>
          ) : (
            <ul className="mt-6 space-y-5">
              {current.map((order) => (
                <li key={order.id} className="grid grid-cols-[1fr_1.5fr] gap-8 rounded-xl bg-paper p-5">
                  <div className="flex gap-3">
                    <OrderMark order={order} />
                    <div>
                      <p className="font-serif text-lg text-ink">{orderTitle(order, i18n.language, t)}</p>
                      <OrderItemLines order={order} />
                      <p className="text-sm text-muted">{t('partner.youEarnAmount', { amount: rupees(order.delivery_fee) })}</p>
                      <div className="mt-2">
                        <DelayNotice order={order} />
                      </div>
                    </div>
                  </div>
                  <DeliveryRoute order={order} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconCircle icon={CurrencyInrIcon} size="sm" />
              <p className="text-sm text-muted">{t('partner.home.week')}</p>
            </div>
            {dashboard.isPending ? (
              <div className="mt-4 h-24 animate-pulse rounded-lg bg-line-soft" />
            ) : (
              <>
                <p className="mt-3 font-serif text-[38px] leading-none text-ink">
                  {rupees(days.reduce((sum, d) => sum + d.earned, 0))}
                </p>
                <WeekBars days={days} valueKey="earned" />
                <p className="mt-5 border-t border-line-soft pt-4 text-[13px] text-muted">
                  {t('partner.home.today', { amount: rupees(data?.earned_today) })}
                </p>
              </>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconCircle icon={HandCoinsIcon} size="sm" />
              <p className="font-semibold text-ink">{t('partner.home.howTitle')}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t('partner.home.howBody')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <IconCircle icon={StarIcon} size="sm" />
              <p className="font-semibold text-ink">{t('reviews.partnerCardTitle')}</p>
            </div>
            {data?.review_count > 0 ? (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <p className="font-serif text-[34px] leading-none text-ink">{data.rating}</p>
                  <div>
                    <Stars value={data.rating} size={16} />
                    <p className="text-[13px] text-muted">{t('reviews.count', { count: data.review_count })}</p>
                  </div>
                </div>
                {ratings.data && (
                  <div className="mt-5 border-t border-line-soft pt-4">
                    <ReviewList reviews={ratings.data.slice(0, 3)} kind="partner" />
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted">{t('reviews.partnerEmpty')}</p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
