import { ApiError, catalogApi } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useBrands() {
  return useQuery({
    queryKey: ['catalog', 'brands'],
    queryFn: catalogApi.getBrands,
    staleTime: 10 * 60_000,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.createBrand,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'brands'] })
      toast({ title: 'Brand created' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to create brand', variant: 'destructive' })
    },
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.deleteBrand,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'brands'] })
      toast({ title: 'Brand deleted' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to delete brand', variant: 'destructive' })
    },
  })
}
