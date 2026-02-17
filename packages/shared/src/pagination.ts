export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  totalItems: number
  totalPages: number
  page: number
  pageSize: number
}

export function paginate(params: PaginationParams): { limit: number; offset: number } {
  return {
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  }
}
