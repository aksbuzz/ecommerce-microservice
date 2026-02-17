import { api } from './client.ts'
import type { CatalogBrand, CatalogItem, CatalogType, PaginatedResult } from './types.ts'

export interface CatalogItemsQuery {
  page?: number
  pageSize?: number
  brandId?: number
  typeId?: number
  search?: string
}

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export type CreateCatalogItemInput = Omit<CatalogItem, 'id' | 'onReorder'>
export type UpdateCatalogItemInput = Partial<Omit<CatalogItem, 'id' | 'onReorder'>>

export const catalogApi = {
  getItems: (q: CatalogItemsQuery = {}) =>
    api.get<PaginatedResult<CatalogItem>>(
      `/catalog/items${qs(q as Record<string, string | number | undefined>)}`,
    ),
  getItem: (id: number) => api.get<CatalogItem>(`/catalog/items/${id}`),
  createItem: (body: CreateCatalogItemInput) =>
    api.post<CatalogItem>('/catalog/items', body),
  updateItem: (id: number, body: UpdateCatalogItemInput) =>
    api.patch<CatalogItem>(`/catalog/items/${id}`, body),
  deleteItem: (id: number) => api.delete<void>(`/catalog/items/${id}`),

  getBrands: () => api.get<CatalogBrand[]>('/catalog/brands'),
  createBrand: (body: { brand: string }) =>
    api.post<CatalogBrand>('/catalog/brands', body),
  deleteBrand: (id: number) => api.delete<void>(`/catalog/brands/${id}`),

  getTypes: () => api.get<CatalogType[]>('/catalog/types'),
  createType: (body: { type: string }) =>
    api.post<CatalogType>('/catalog/types', body),
  deleteType: (id: number) => api.delete<void>(`/catalog/types/${id}`),
}
