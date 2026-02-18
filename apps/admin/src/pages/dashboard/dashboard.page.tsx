import { Package, ShoppingCart, Tag, Webhook } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useBrands } from '@/hooks/use-catalog-brands'
import { useItems } from '@/hooks/use-catalog-items'
import { useOrders } from '@/hooks/use-orders'
import { useWebhooks } from '@/hooks/use-webhooks'

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  accent: string
  iconBg: string
}

function StatsCard({ title, value, description, icon, accent, iconBg }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your store at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={itemsData?.totalItems ?? '—'}
          description="Products in catalog"
          icon={<Package className="h-5 w-5 text-blue-400" />}
          accent="bg-blue-500"
          iconBg="bg-blue-500/10"
        />
        <StatsCard
          title="Brands"
          value={brands?.length ?? '—'}
          description="Active brands"
          icon={<Tag className="h-5 w-5 text-emerald-400" />}
          accent="bg-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <StatsCard
          title="Orders"
          value={ordersData?.totalItems ?? '—'}
          description="Total orders placed"
          icon={<ShoppingCart className="h-5 w-5 text-amber-400" />}
          accent="bg-amber-500"
          iconBg="bg-amber-500/10"
        />
        <StatsCard
          title="Webhooks"
          value={webhooks?.length ?? '—'}
          description="Active subscriptions"
          icon={<Webhook className="h-5 w-5 text-violet-400" />}
          accent="bg-violet-500"
          iconBg="bg-violet-500/10"
        />
      </div>
    </div>
  )
}
