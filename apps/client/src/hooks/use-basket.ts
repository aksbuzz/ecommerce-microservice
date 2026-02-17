import { ApiError, basketApi } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useBasket() {
  return useQuery({
    queryKey: ['basket'],
    queryFn: basketApi.getBasket,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false
      return failureCount < 2
    },
  })
}

export function useAddToBasket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: basketApi.addItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['basket'] })
      toast({ title: 'Added to basket' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Could not add item', variant: 'destructive' })
    },
  })
}

export function useUpdateQuantity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      basketApi.updateQuantity(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['basket'] }),
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Could not update quantity', variant: 'destructive' })
    },
  })
}

export function useRemoveFromBasket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: basketApi.removeItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['basket'] }),
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Could not remove item', variant: 'destructive' })
    },
  })
}

export function useCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data?: { street?: string; city?: string; state?: string; country?: string; zipCode?: string }) =>
      basketApi.checkout(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['basket'] }),
  })
}
