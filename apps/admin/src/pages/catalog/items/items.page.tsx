import type { CatalogItem } from '@ecommerce/api-client'
import { Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBrands } from '@/hooks/use-catalog-brands'
import { useDeleteItem, useItems } from '@/hooks/use-catalog-items'
import { useTypes } from '@/hooks/use-catalog-types'
import { formatCurrency } from '@/lib/utils'
import { ItemFormDialog } from './item-form'

export function ItemsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [brandId, setBrandId] = useState<number | undefined>()
  const [typeId, setTypeId] = useState<number | undefined>()
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: brands } = useBrands()
  const { data: types } = useTypes()
  const { data, isLoading } = useItems({ page, pageSize: 10, search: debouncedSearch || undefined, brandId, typeId })
  const deleteMutation = useDeleteItem()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleFilterChange = useCallback(() => setPage(1), [])

  function handleBrandChange(val: string) {
    setBrandId(val === 'all' ? undefined : Number(val))
    handleFilterChange()
  }

  function handleTypeChange(val: string) {
    setTypeId(val === 'all' ? undefined : Number(val))
    handleFilterChange()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catalog Items</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select onValueChange={handleBrandChange} defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands?.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.brand}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={handleTypeChange} defaultValue="all">
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
        <EmptyState title="No items found" description="Try adjusting filters or create a new item." />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const brand = brands?.find((b) => b.id === item.catalogBrandId)
                  const type = types?.find((t) => t.id === item.catalogTypeId)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{brand?.brand ?? '—'}</TableCell>
                      <TableCell>{type?.type ?? '—'}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>
                        <span className={item.availableStock === 0 ? 'text-destructive' : ''}>
                          {item.availableStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                            Edit
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button size="sm" variant="destructive" disabled={deleteMutation.isPending}>
                                Del
                              </Button>
                            }
                            title="Delete item?"
                            description={`Delete "${item.name}"? This cannot be undone.`}
                            onConfirm={() => deleteMutation.mutate(item.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ItemFormDialog
        open={isCreateOpen || editingItem !== null}
        item={editingItem}
        onClose={() => { setIsCreateOpen(false); setEditingItem(null) }}
      />
    </div>
  )
}
