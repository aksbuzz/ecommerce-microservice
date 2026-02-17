import type { CatalogItem } from '@ecommerce/api-client'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Pagination } from '@/components/shared/pagination'
import { ProductCard } from '@/components/shared/product-card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddToBasket } from '@/hooks/use-basket'
import { useBrands, useItems, useTypes } from '@/hooks/use-catalog'

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? '1')
  const brandId = params.get('brandId') ? Number(params.get('brandId')) : undefined
  const typeId = params.get('typeId') ? Number(params.get('typeId')) : undefined
  const search = params.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(search)
  const addToBasket = useAddToBasket()

  const { data: brands } = useBrands()
  const { data: types } = useTypes()
  const { data, isLoading } = useItems({ page, pageSize: 12, brandId, typeId, search: search || undefined })

  useEffect(() => {
    const t = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (searchInput) next.set('search', searchInput)
        else next.delete('search')
        next.set('page', '1')
        return next
      })
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, setParams])

  function handleBrandChange(val: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (val === 'all') next.delete('brandId')
      else next.set('brandId', val)
      next.set('page', '1')
      return next
    })
  }

  function handleTypeChange(val: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (val === 'all') next.delete('typeId')
      else next.set('typeId', val)
      next.set('page', '1')
      return next
    })
  }

  function handlePageChange(p: number) {
    setParams((prev) => { const next = new URLSearchParams(prev); next.set('page', String(p)); return next })
  }

  function handleAddToBasket(item: CatalogItem) {
    addToBasket.mutate({ productId: item.id, productName: item.name, unitPrice: item.price, quantity: 1 })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Our Products</h1>
        <p className="text-muted-foreground mt-1">Browse our full catalog</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          onValueChange={handleBrandChange}
          value={brandId ? String(brandId) : 'all'}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands?.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.brand}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          onValueChange={handleTypeChange}
          value={typeId ? String(typeId) : 'all'}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.type}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : !data?.items.length ? (
        <EmptyState title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((item) => {
              const brand = brands?.find((b) => b.id === item.catalogBrandId)
              return (
                <Link key={item.id} to={`/products/${item.id}`} className="block">
                  <ProductCard
                    item={item}
                    brandName={brand?.brand}
                    onAddToBasket={(i) => { handleAddToBasket(i) }}
                    isAdding={addToBasket.isPending}
                  />
                </Link>
              )
            })}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={handlePageChange} />
        </>
      )}
    </div>
  )
}
