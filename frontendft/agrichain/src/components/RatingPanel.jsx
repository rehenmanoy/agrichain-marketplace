import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/lib/errors'
import { Button } from './Button'
import { Panel } from './Dialogs'
import { FormError } from './Field'
import { StarInput } from './StarRating'
import { useToast } from './toast-context'

/**
 * Give a rating: 1 to 5 stars and an optional comment. The caller says what is being rated:
 * header (what to show at the top), question, the react-query mutation to run, and toArgs to build its argument.
 * Mounted only while open, so it starts fresh each time.
 */
export function RatingPanel({ title, header, question, mutation, toArgs, doneText, onClose }) {
  const { t } = useTranslation()
  const toast = useToast()
  const commentId = useId()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [missing, setMissing] = useState(false)

  const submit = () => {
    if (!rating) {
      setMissing(true)
      return
    }
    mutation.mutate(toArgs({ rating, comment: comment.trim() || undefined }), {
      onSuccess: () => {
        toast(doneText)
        onClose()
      },
    })
  }

  return (
    <Panel
      open
      onClose={onClose}
      title={title}
      footer={
        <div className="space-y-3">
          <FormError message={mutation.isError ? errorMessage(mutation.error, t) : null} />
          <Button className="w-full" onClick={submit} loading={mutation.isPending}>
            {mutation.isPending ? t('buyer.orders.sending') : t('buyer.orders.send')}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center gap-4 rounded-xl bg-paper p-4">{header}</div>

        <div>
          <p className="text-sm font-medium text-ink">{question}</p>
          <div className="mt-3">
            <StarInput
              value={rating}
              onChange={(n) => {
                setRating(n)
                setMissing(false)
              }}
              label={question}
            />
          </div>
          {missing && <p className="mt-2 text-[13px] font-medium text-danger">{t('buyer.orders.pickStars')}</p>}
        </div>

        <div>
          <label htmlFor={commentId} className="block text-sm font-medium text-ink">
            {t('buyer.orders.comment')}
          </label>
          <textarea
            id={commentId}
            rows={4}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('buyer.orders.commentPlaceholder')}
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-3 text-[15px] text-ink outline-none placeholder:text-muted/70 focus:border-leaf focus:ring-4 focus:ring-sage"
          />
        </div>
      </div>
    </Panel>
  )
}
