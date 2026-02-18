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
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  awaiting_validation: { label: 'Awaiting Validation', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  confirmed: { label: 'Confirmed', className: 'bg-violet-50 text-violet-700 ring-violet-600/20' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  shipped: { label: 'Shipped', className: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 ring-red-600/20' },
}

const CANCELLABLE: OrderStatus[] = ['submitted', 'awaiting_validation']

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading } = useOrder(Number(id ?? '0'))
  const cancelMutation = useCancelOrder()

  if (isLoading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/orders"><Button variant="link">Back to orders</Button></Link>
      </div>
    )
  }

  const config = STATUS_CONFIG[order.status]

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Order #{order.id}</h1>
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            config.className,
          )}>
            {config.label}
          </span>
        </div>
        {CANCELLABLE.includes(order.status) && (
          <ConfirmDialog
            trigger={<Button variant="destructive" className="rounded-lg">Cancel Order</Button>}
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
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{formatDate(order.orderDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-base">{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {order.street && (
          <Card>
            <CardHeader><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
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
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.units}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.unitPrice * item.units)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-3" />
          <div className="flex justify-end text-lg font-bold">
            Total: {formatCurrency(order.total)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
