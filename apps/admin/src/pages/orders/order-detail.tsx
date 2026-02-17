import type { Order, OrderStatus } from '@ecommerce/api-client'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCancelOrder, useUpdateOrderStatus } from '@/hooks/use-orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderStatusBadge } from './order-status-badge'

const ALL_STATUSES: OrderStatus[] = [
  'submitted', 'awaiting_validation', 'confirmed', 'paid', 'shipped', 'cancelled',
]

const CANCELLABLE_STATUSES: OrderStatus[] = ['submitted', 'awaiting_validation']

interface OrderDetailProps {
  order: Order | null
  onClose: () => void
}

export function OrderDetail({ order, onClose }: OrderDetailProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const updateMutation = useUpdateOrderStatus()
  const cancelMutation = useCancelOrder()

  if (!order) return null

  function handleUpdateStatus() {
    if (!newStatus || !order) return
    updateMutation.mutate({ id: order.id, status: newStatus as OrderStatus }, {
      onSuccess: () => setNewStatus(''),
    })
  }

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-muted-foreground">Buyer ID</p>
              <p className="font-medium">{order.buyerId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(order.total)}</p>
            </div>
            {order.street && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">
                  {[order.street, order.city, order.state, order.zipCode, order.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Items</h3>
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
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Update status..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleUpdateStatus}
                disabled={!newStatus || updateMutation.isPending}
              >
                {updateMutation.isPending ? <LoadingSpinner size="sm" /> : 'Update Status'}
              </Button>
            </div>
            {CANCELLABLE_STATUSES.includes(order.status) && (
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm" disabled={cancelMutation.isPending}>
                    Cancel Order
                  </Button>
                }
                title="Cancel this order?"
                description="This will cancel the order. This action may not be reversible."
                confirmLabel="Cancel Order"
                onConfirm={() => cancelMutation.mutate(order.id, { onSuccess: onClose })}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
