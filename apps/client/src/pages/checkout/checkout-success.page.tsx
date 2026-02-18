import { CheckCircle, Package, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function CheckoutSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Order Placed!</h1>
      <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
        Your order has been received and is being processed. Our system will confirm your order shortly — you can track the status in your order history.
      </p>
      <div className="flex gap-3 mt-8">
        <Link to="/orders">
          <Button className="rounded-lg">
            <Package className="h-4 w-4" />
            View Orders
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" className="rounded-lg">
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  )
}
