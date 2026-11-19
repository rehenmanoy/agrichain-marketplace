import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, fetchJson } from '@/lib/api'

export const useMyWarehouses = () =>
  useQuery({ queryKey: ['warehouses', 'mine'], queryFn: () => fetchJson('/warehouses/mine'), refetchInterval: 60_000 })

/** Bookings at the owner's warehouses: requests, approved, finished */
export const useIncomingBookings = () =>
  useQuery({
    queryKey: ['bookings', 'incoming'],
    queryFn: () => fetchJson('/warehouse-bookings/incoming'),
    refetchInterval: 30_000,
  })

function useOwnerMutation(mutationFn) {
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

/** A multipart form: the fields plus the photo files (the browser sets the boundary itself) */
export function warehouseForm({ name, location, total_capacity_kg, price_per_kg_per_day, is_cold_storage, photos }) {
  const form = new FormData()
  form.append('name', name)
  form.append('location', location)
  form.append('total_capacity_kg', String(total_capacity_kg))
  form.append('price_per_kg_per_day', String(price_per_kg_per_day))
  form.append('is_cold_storage', String(is_cold_storage))
  photos.forEach((file) => form.append('photos', file))
  return form
}

export const useCreateWarehouse = () =>
  useOwnerMutation((fields) => api.post('/warehouses', warehouseForm(fields)).then((res) => res.data))

/** { id, ...changes }; changes can be name, location, total_capacity_kg, price_per_kg_per_day, is_cold_storage, is_active */
export const useUpdateWarehouse = () =>
  useOwnerMutation(({ id, ...changes }) => api.patch(`/warehouses/${id}`, changes).then((res) => res.data))

export const useDeleteWarehouse = () => useOwnerMutation((id) => api.delete(`/warehouses/${id}`))

/** { id, files } */
export const useAddWarehousePhotos = () =>
  useOwnerMutation(({ id, files }) => {
    const form = new FormData()
    files.forEach((file) => form.append('photos', file))
    return api.post(`/warehouses/${id}/photos`, form).then((res) => res.data)
  })

/** { id, photoId } */
export const useRemoveWarehousePhoto = () =>
  useOwnerMutation(({ id, photoId }) => api.delete(`/warehouses/${id}/photos/${photoId}`).then((res) => res.data))

export const useApproveBooking = () =>
  useOwnerMutation((id) => api.patch(`/warehouse-bookings/${id}/approve`).then((res) => res.data))

/** { id, note? } */
export const useRejectBooking = () =>
  useOwnerMutation(({ id, note }) => api.patch(`/warehouse-bookings/${id}/reject`, { note }).then((res) => res.data))

export const useApproveExtension = () =>
  useOwnerMutation((id) => api.patch(`/warehouse-bookings/${id}/extension/approve`).then((res) => res.data))

export const useRejectExtension = () =>
  useOwnerMutation((id) => api.patch(`/warehouse-bookings/${id}/extension/reject`).then((res) => res.data))
