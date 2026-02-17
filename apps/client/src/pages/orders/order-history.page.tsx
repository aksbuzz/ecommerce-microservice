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
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_STYLES: Record<OrderStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  awaiting_validation: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function OrderHistoryPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrderSummaries(page)

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      {!data?.items.length ? (
        <div className="flex flex-col items-center">
          <EmptyState title="No orders yet" description="Place your first order to see it here." />
          <Link to="/"><Button className="mt-4">Browse Products</Button></Link>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
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
                {data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>
                      <Link to={`/orders/${order.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}
