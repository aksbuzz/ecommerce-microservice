import type { OrderStatus } from '@ecommerce/api-client'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  },
  awaiting_validation: {
    label: 'Awaiting Validation',
    className: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-violet-500/15 text-violet-400 ring-violet-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/15 text-red-400 ring-red-500/20',
  },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
