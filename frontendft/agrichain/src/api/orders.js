import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

/** Every order on the farmer's listings; refreshed so new orders appear without reloading */
export const useIncomingOrders = () =>
  useQuery({
    queryKey: ['orders', 'incoming'],
    queryFn: () => fetchJson('/orders/incoming'),
    refetchInterval: 30_000,
  })

function useOrderMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useAcceptOrder = () =>
  useOrderMutation((id) => api.patch(`/orders/${id}/confirm`).then((res) => res.data))

export const useRejectOrder = () =>
  useOrderMutation((id) => api.patch(`/orders/${id}/cancel`).then((res) => res.data))
