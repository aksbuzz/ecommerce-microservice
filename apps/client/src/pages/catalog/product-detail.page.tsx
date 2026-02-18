import { ChevronLeft, Minus, Package, Plus, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  if (!item) {
    return (
      <div className="text-center py-16">
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
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl bg-linear-to-br from-muted to-muted/40 flex items-center justify-center">
          <Package className="h-32 w-32 text-muted-foreground/20" />
        </div>

        <div className="flex flex-col justify-center space-y-5">
          {brand && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{brand.brand}</p>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
          {type && (
            <span className="inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{type.type}</span>
          )}
          {item.description && (
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          )}

          <Separator />

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(item.price)}</p>
            <span className={`text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-destructive'}`}>
              {inStock ? `${item.availableStock} in stock` : 'Out of stock'}
            </span>
          </div>

          {inStock && (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1 rounded-lg h-10"
                onClick={handleAddToBasket}
                disabled={addToBasket.isPending}
              >
                {addToBasket.isPending ? <LoadingSpinner size="sm" /> : <><ShoppingCart className="h-4 w-4" /> Add to Basket</>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
