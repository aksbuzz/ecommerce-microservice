import { ApiError, catalogApi } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useTypes() {
  return useQuery({
    queryKey: ['catalog', 'types'],
    queryFn: catalogApi.getTypes,
    staleTime: 10 * 60_000,
  })
}

export function useCreateType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.createType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'types'] })
      toast({ title: 'Type created' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to create type', variant: 'destructive' })
    },
  })
}

export function useDeleteType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.deleteType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'types'] })
      toast({ title: 'Type deleted' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to delete type', variant: 'destructive' })
    },
  })
}
