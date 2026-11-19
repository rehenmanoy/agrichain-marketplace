import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

/** The bell: the newest notifications and how many are unread, refreshed every 30 seconds */
export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchJson('/notifications', { params: { limit: 30 } }),
    refetchInterval: 30_000,
  })

/** Both calls answer with the refreshed list, which goes straight into the cache */
function useNotificationMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (data) => queryClient.setQueryData(['notifications'], data),
  })
}

export const useMarkNotificationRead = () =>
  useNotificationMutation((id) => api.patch(`/notifications/${id}/read`).then((res) => res.data))

export const useMarkAllNotificationsRead = () =>
  useNotificationMutation(() => api.post('/notifications/read-all').then((res) => res.data))
