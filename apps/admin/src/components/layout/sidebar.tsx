import {
  Layers,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Tag,
  Webhook,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/catalog/items', label: 'Items', icon: Package },
  { to: '/catalog/brands', label: 'Brands', icon: Tag },
  { to: '/catalog/types', label: 'Types', icon: Layers },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 px-4 font-semibold">
        <Store className="h-5 w-5" />
        <span>eCommerce Admin</span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
