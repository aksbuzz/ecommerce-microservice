import type { CatalogItem } from '@ecommerce/api-client'
import { Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  item: CatalogItem
  brandName?: string
  onAddToBasket: (item: CatalogItem) => void
  isAdding?: boolean
}

export function ProductCard({ item, brandName, onAddToBasket, isAdding }: ProductCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative aspect-square bg-linear-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
        <Package className="h-16 w-16 text-muted-foreground/25 transition-transform duration-300 group-hover:scale-110" />
        {item.availableStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">Out of stock</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1 space-y-1.5">
          {brandName && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">{brandName}</p>
          )}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-lg font-bold tracking-tight">{formatCurrency(item.price)}</span>
          {item.availableStock > 0 && (
            <span className="text-[11px] text-muted-foreground">{item.availableStock} left</span>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button
          className="w-full rounded-lg"
          size="sm"
          onClick={(e) => { e.preventDefault(); onAddToBasket(item) }}
          disabled={item.availableStock === 0 || isAdding}
        >
          <ShoppingCart className="h-4 w-4" />
          {item.availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  )
}
