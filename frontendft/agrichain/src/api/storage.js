import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

export const useWarehouses = (regionId) =>
  useQuery({
    queryKey: ['warehouses', regionId],
    queryFn: () => fetchJson('/warehouses', { params: { region_id: regionId } }),
    enabled: Boolean(regionId),
  })

/** Kilograms free for the whole of a date range, for the booking form */
export const useAvailability = (warehouseId, from, to, enabled = true) =>
  useQuery({
    queryKey: ['warehouses', 'availability', warehouseId, from, to],
    queryFn: () => fetchJson(`/warehouses/${warehouseId}/availability`, { params: { from, to } }),
    enabled: Boolean(warehouseId && from && to && enabled),
    staleTime: 10_000,
  })

export const useMyBookings = () =>
  useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: () => fetchJson('/warehouse-bookings/mine'),
    refetchInterval: 30_000,
  })

function useStorageMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/** Asks for space. body: { warehouse_id, quantity_kg, produce_id?, start_date, end_date } */
export const useBookStorage = () =>
  useStorageMutation((body) => api.post('/warehouse-bookings', body).then((res) => res.data))

/** Withdraws a waiting request, or an approved booking that has not started */
export const useCancelBooking = () =>
  useStorageMutation((id) => api.patch(`/warehouse-bookings/${id}/cancel`).then((res) => res.data))

export const useReleaseStorage = () =>
  useStorageMutation((id) => api.patch(`/warehouse-bookings/${id}/release`).then((res) => res.data))

/** { id, new_end_date } */
export const useExtendBooking = () =>
  useStorageMutation(({ id, new_end_date }) =>
    api.post(`/warehouse-bookings/${id}/extend`, { new_end_date }).then((res) => res.data),
  )

export const useCancelExtension = () =>
  useStorageMutation((id) => api.patch(`/warehouse-bookings/${id}/extension/cancel`).then((res) => res.data))
