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
import { cn } from '@/lib/utils'

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/catalog/items', label: 'Items', icon: Package },
      { to: '/catalog/brands', label: 'Brands', icon: Tag },
      { to: '/catalog/types', label: 'Types', icon: Layers },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))]">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--chart-blue))]">
          <Store className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">eCommerce</span>
          <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-muted))]">Admin</span>
        </div>
      </div>

      <div className="mx-4 border-b border-[hsl(var(--sidebar-border))]" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-muted))]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                      isActive
                        ? 'bg-[hsl(var(--sidebar-accent))] text-white font-medium shadow-sm'
                        : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-4 border-t border-[hsl(var(--sidebar-border))]" />
      <div className="px-5 py-3">
        <p className="text-[10px] text-[hsl(var(--sidebar-muted))]">eCommerce Admin v1.0</p>
      </div>
    </aside>
  )
}
