import { Outlet } from 'react-router-dom'
import { Navbar } from './navbar'

export function PageLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        © 2025 eCommerce Store
      </footer>
    </div>
  )
}
