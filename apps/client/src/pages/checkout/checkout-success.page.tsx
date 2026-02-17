import { CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function CheckoutSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-bold">Order Placed!</h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        Your order has been received and is being processed. Our system will confirm your order shortly — you can track the status in your order history.
      </p>
      <div className="flex gap-3 mt-8">
        <Link to="/orders">
          <Button>View Orders</Button>
        </Link>
        <Link to="/">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}
