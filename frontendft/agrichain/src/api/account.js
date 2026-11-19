import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** { name?, base_location? }: the name and place shown around the app */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.patch('/auth/me', body).then((res) => res.data),
    // The current user is cached under ['me', token]; refresh it so the new name shows everywhere
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })
}

/** { current_password, new_password }; answers with a fresh { token, user } to sign in with */
export const useChangePassword = () =>
  useMutation({ mutationFn: (body) => api.post('/auth/change-password', body).then((res) => res.data) })

/** { phone }; answers { message, dev_code? } (the code is only in the answer while no SMS is connected) */
export const useForgotPassword = () =>
  useMutation({ mutationFn: (body) => api.post('/auth/forgot-password', body).then((res) => res.data) })

/** { phone, code, new_password } */
export const useResetPassword = () =>
  useMutation({ mutationFn: (body) => api.post('/auth/reset-password', body).then((res) => res.data) })
