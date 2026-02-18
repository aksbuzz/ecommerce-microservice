import { LogOut, ShoppingCart, Store, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useBasket } from '@/hooks/use-basket'
import { cn } from '@/lib/utils'

export function Navbar() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data: basket } = useBasket()
  const logoutMutation = useLogout()

  const basketCount = basket?.items.reduce((s, i) => s + i.quantity, 0) ?? 0

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">eCommerce</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link to="/basket" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ShoppingCart className="h-5 w-5" />
                  {basketCount > 0 && (
                    <span className={cn(
                      'absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground',
                      'flex items-center justify-center text-[10px] font-bold',
                    )}>
                      {basketCount > 99 ? '99+' : basketCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">Orders</Button>
              </Link>
              <div className="ml-1 h-6 w-px bg-border" />
              <div className="ml-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {user.name}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm" className="rounded-full">Login</Button></Link>
              <Link to="/register"><Button size="sm" className="rounded-full">Register</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
