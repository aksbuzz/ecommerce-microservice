import { type CatalogItemsQuery, catalogApi } from '@ecommerce/api-client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export function useItems(query: CatalogItemsQuery = {}) {
  return useQuery({
    queryKey: ['catalog', 'items', query],
    queryFn: () => catalogApi.getItems(query),
    placeholderData: keepPreviousData,
  })
}

export function useItem(id: number) {
  return useQuery({
    queryKey: ['catalog', 'item', id],
    queryFn: () => catalogApi.getItem(id),
    enabled: id > 0,
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['catalog', 'brands'],
    queryFn: catalogApi.getBrands,
    staleTime: 10 * 60_000,
  })
}

export function useTypes() {
  return useQuery({
    queryKey: ['catalog', 'types'],
    queryFn: catalogApi.getTypes,
    staleTime: 10 * 60_000,
  })
}
