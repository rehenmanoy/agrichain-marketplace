import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

/** Confirmed orders in the partner's region that nobody has taken yet; polled so new ones appear */
export const useAvailableDeliveries = () =>
  useQuery({
    queryKey: ['deliveries', 'available'],
    queryFn: () => fetchJson('/deliveries/available'),
    refetchInterval: 20_000,
  })

/** Every delivery this partner took (on the way and delivered) */
export const useMyDeliveries = () =>
  useQuery({
    queryKey: ['deliveries', 'mine'],
    queryFn: () => fetchJson('/deliveries/mine'),
    refetchInterval: 30_000,
  })

function usePartnerMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    // Success or not (someone else may have won the race), reload the lists
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useTakeDelivery = () => usePartnerMutation((id) => api.patch(`/deliveries/${id}/accept`).then((r) => r.data))
export const useCompleteDelivery = () =>
  usePartnerMutation((id) => api.patch(`/deliveries/${id}/complete`).then((r) => r.data))
export const useGiveBackDelivery = () =>
  usePartnerMutation((id) => api.patch(`/deliveries/${id}/release`).then((r) => r.data))

/** { id, reason, minutes } */
export const useReportDelay = () =>
  usePartnerMutation(({ id, ...body }) => api.patch(`/deliveries/${id}/delay`, body).then((r) => r.data))
