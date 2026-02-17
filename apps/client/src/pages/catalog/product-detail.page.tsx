import { ChevronLeft, Minus, Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAddToBasket } from '@/hooks/use-basket'
import { useBrands, useItem, useTypes } from '@/hooks/use-catalog'
import { formatCurrency } from '@/lib/utils'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [quantity, setQuantity] = useState(1)
  const { data: item, isLoading } = useItem(Number(id ?? '0'))
  const { data: brands } = useBrands()
  const { data: types } = useTypes()
  const addToBasket = useAddToBasket()

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm">Back to catalog</Link>
      </div>
    )
  }

  const brand = brands?.find((b) => b.id === item.catalogBrandId)
  const type = types?.find((t) => t.id === item.catalogTypeId)
  const inStock = item.availableStock > 0

  function handleAddToBasket() {
    addToBasket.mutate({
      productId: item!.id,
      productName: item!.name,
      unitPrice: item!.price,
      quantity,
    })
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex items-center justify-center p-8 min-h-75">
          <Package className="h-32 w-32 text-muted-foreground/30" />
        </Card>

        <div className="space-y-4">
          {brand && (
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{brand.brand}</p>
          )}
          <h1 className="text-3xl font-bold">{item.name}</h1>
          {type && (
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-sm">{type.type}</span>
          )}
          {item.description && (
            <p className="text-muted-foreground">{item.description}</p>
          )}
          <p className="text-3xl font-bold">{formatCurrency(item.price)}</p>
          <p className={`text-sm ${inStock ? 'text-green-600' : 'text-destructive'}`}>
            {inStock ? `${item.availableStock} in stock` : 'Out of stock'}
          </p>

          {inStock && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1"
                onClick={handleAddToBasket}
                disabled={addToBasket.isPending}
              >
                {addToBasket.isPending ? <LoadingSpinner size="sm" /> : 'Add to Basket'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
