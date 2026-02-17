import type { OrderStatus } from '@ecommerce/api-client'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<OrderStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  awaiting_validation: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  submitted: 'Submitted',
  awaiting_validation: 'Awaiting Validation',
  confirmed: 'Confirmed',
  paid: 'Paid',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
