import { ApiError, type CatalogItemsQuery, type CreateCatalogItemInput, catalogApi, type UpdateCatalogItemInput } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useItems(query: CatalogItemsQuery = {}) {
  return useQuery({
    queryKey: ['catalog', 'items', query],
    queryFn: () => catalogApi.getItems(query),
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCatalogItemInput) => catalogApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'items'] })
      toast({ title: 'Item created' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to create item', variant: 'destructive' })
    },
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCatalogItemInput }) =>
      catalogApi.updateItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'items'] })
      toast({ title: 'Item updated' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to update item', variant: 'destructive' })
    },
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: catalogApi.deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog', 'items'] })
      toast({ title: 'Item deleted' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to delete item', variant: 'destructive' })
    },
  })
}
