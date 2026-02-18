import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useBasket, useRemoveFromBasket, useUpdateQuantity } from '@/hooks/use-basket'
import { formatCurrency } from '@/lib/utils'

export function BasketPage() {
  const navigate = useNavigate()
  const { data: basket, isLoading } = useBasket()
  const updateQty = useUpdateQuantity()
  const removeItem = useRemoveFromBasket()

  if (isLoading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  const items = basket?.items ?? []
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Your basket is empty</h2>
        <p className="mt-2 text-muted-foreground">Add some items to get started.</p>
        <Link to="/">
          <Button className="mt-6 rounded-lg">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Shopping Basket</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 rounded-xl border p-4">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.productName}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)} each</p>
              </div>
              <div className="flex items-center rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => updateQty.mutate({ productId: item.productId, quantity: item.quantity - 1 })}
                  disabled={item.quantity <= 1 || updateQty.isPending}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => updateQty.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                  disabled={updateQty.isPending}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="w-20 text-right font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem.mutate(item.productId)}
                disabled={removeItem.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Card className="h-fit sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({totalQty} items)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-lg" size="lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
