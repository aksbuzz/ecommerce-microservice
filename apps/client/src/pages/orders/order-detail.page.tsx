import type { OrderStatus } from '@ecommerce/api-client'
import { ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCancelOrder, useOrder } from '@/hooks/use-orders'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_STYLES: Record<OrderStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  awaiting_validation: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

const CANCELLABLE: OrderStatus[] = ['submitted', 'awaiting_validation']

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading } = useOrder(Number(id ?? '0'))
  const cancelMutation = useCancelOrder()

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/orders"><Button variant="link">Back to orders</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        {CANCELLABLE.includes(order.status) && (
          <ConfirmDialog
            trigger={<Button variant="destructive">Cancel Order</Button>}
            title="Cancel this order?"
            description="Are you sure you want to cancel this order?"
            confirmLabel="Cancel Order"
            onConfirm={() => cancelMutation.mutate(order.id)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(order.orderDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {order.street && (
          <Card>
            <CardHeader><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{order.street}</p>
              <p>{[order.city, order.state, order.zipCode].filter(Boolean).join(', ')}</p>
              <p>{order.country}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.units}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice * item.units)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-3" />
          <div className="flex justify-end font-semibold">
            Total: {formatCurrency(order.total)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
