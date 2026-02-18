import { Outlet } from 'react-router-dom'
import { Navbar } from './navbar'

export function PageLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <span>eCommerce Store</span>
          <span>Built with React & Fastify</span>
        </div>
      </footer>
    </div>
  )
}
