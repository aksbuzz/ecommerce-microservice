import type { CatalogItem } from '@ecommerce/api-client'
import { Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  item: CatalogItem
  brandName?: string
  onAddToBasket: (item: CatalogItem) => void
  isAdding?: boolean
}

export function ProductCard({ item, brandName, onAddToBasket, isAdding }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex-1 p-4 flex flex-col">
        <div className="h-32 bg-muted rounded-md flex items-center justify-center mb-3">
          <Package className="h-16 w-16 text-muted-foreground/40" />
        </div>
        <div className="space-y-1 flex-1">
          {brandName && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{brandName}</p>
          )}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{formatCurrency(item.price)}</span>
          <span className={`text-xs ${item.availableStock === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {item.availableStock === 0 ? 'Out of stock' : `${item.availableStock} left`}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="sm"
          onClick={() => onAddToBasket(item)}
          disabled={item.availableStock === 0 || isAdding}
        >
          <ShoppingCart className="h-4 w-4" />
          {item.availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  )
}
