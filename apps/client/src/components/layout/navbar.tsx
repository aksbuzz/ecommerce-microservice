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
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <Store className="h-5 w-5" />
          eCommerce
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/basket" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {basketCount > 0 && (
                    <span className={cn(
                      'absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground',
                      'flex items-center justify-center text-[10px] font-bold',
                    )}>
                      {basketCount > 99 ? '99+' : basketCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="ghost" size="sm">Orders</Button>
              </Link>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.name} {user.lastName}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/register"><Button size="sm">Register</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
