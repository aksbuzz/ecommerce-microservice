import { Package, ShoppingCart, Tag, Webhook } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBrands } from '@/hooks/use-catalog-brands'
import { useItems } from '@/hooks/use-catalog-items'
import { useOrders } from '@/hooks/use-orders'
import { useWebhooks } from '@/hooks/use-webhooks'

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data: itemsData } = useItems({ pageSize: 1 })
  const { data: brands } = useBrands()
  const { data: ordersData } = useOrders({ pageSize: 1 })
  const { data: webhooks } = useWebhooks()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={itemsData?.totalItems ?? '—'}
          description="Products in catalog"
          icon={<Package className="h-4 w-4" />}
        />
        <StatsCard
          title="Brands"
          value={brands?.length ?? '—'}
          description="Active brands"
          icon={<Tag className="h-4 w-4" />}
        />
        <StatsCard
          title="Orders"
          value={ordersData?.totalItems ?? '—'}
          description="Total orders placed"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatsCard
          title="Webhooks"
          value={webhooks?.length ?? '—'}
          description="Active subscriptions"
          icon={<Webhook className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}
