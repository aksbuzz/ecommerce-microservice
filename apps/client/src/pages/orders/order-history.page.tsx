import type { OrderStatus } from '@ecommerce/api-client'
import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useOrderSummaries } from '@/hooks/use-orders'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  awaiting_validation: { label: 'Awaiting Validation', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  confirmed: { label: 'Confirmed', className: 'bg-violet-50 text-violet-700 ring-violet-600/20' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  shipped: { label: 'Shipped', className: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 ring-red-600/20' },
}

export function OrderHistoryPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrderSummaries(page)

  if (isLoading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <p className="text-sm text-muted-foreground">Track and manage your orders</p>
        </div>
      </div>

      {!data?.items.length ? (
        <div className="flex flex-col items-center">
          <EmptyState title="No orders yet" description="Place your first order to see it here." />
          <Link to="/"><Button className="mt-4 rounded-lg">Browse Products</Button></Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => {
                  const config = STATUS_CONFIG[order.status]
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          config.className,
                        )}>
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <Link to={`/orders/${order.id}`}>
                          <Button size="sm" variant="outline" className="rounded-lg">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
