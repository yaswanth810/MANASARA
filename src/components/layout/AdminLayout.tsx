import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  CreditCard,
  Users,
  Scissors,
  BookOpen,
  Layers,
  Calculator,
  Receipt,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ManasaraLogo } from '@/components/brand/ManasaraLogo'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: Tag },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { separator: true, label: 'Production' },
  { label: 'Materials', to: '/admin/materials', icon: Scissors },
  { label: 'Recipes', to: '/admin/recipes', icon: BookOpen },
  { label: 'Inventory', to: '/admin/inventory', icon: Layers },
  { label: 'Costing', to: '/admin/costing', icon: Calculator },
  { separator: true, label: 'Finance' },
  { label: 'Expenses', to: '/admin/expenses', icon: Receipt },
  { label: 'Reports', to: '/admin/reports', icon: BarChart2 },
  { separator: true, label: 'System' },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const { adminProfile } = useAdminAuth()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-plum text-ivory shrink-0 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="flex items-center px-4 h-14 border-b border-white/10 shrink-0">
          <Link to="/admin/dashboard">
            <ManasaraLogo variant="light" className="h-6 w-auto" />
          </Link>
          <span className="ml-2 text-xs font-dm-sans text-ivory/40 font-medium uppercase tracking-wider">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Admin navigation">
          {navItems.map((item, i) => {
            if ('separator' in item && item.separator) {
              return (
                <div key={i} className="px-2 pt-5 pb-1">
                  <p className="text-[10px] font-dm-sans font-medium uppercase tracking-widest text-ivory/30">
                    {item.label}
                  </p>
                </div>
              )
            }

            if (!item.to || !item.icon) return null
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-dm-sans font-medium',
                    'transition-colors duration-150 mb-0.5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush',
                    isActive
                      ? 'bg-white/15 text-ivory'
                      : 'text-ivory/60 hover:text-ivory hover:bg-white/8',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User / Sign out */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {adminProfile && (
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <div className="h-7 w-7 rounded-full bg-dusty-pink/30 flex items-center justify-center text-xs font-medium text-ivory shrink-0">
                {adminProfile.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ivory truncate">{adminProfile.display_name}</p>
                <p className="text-[10px] text-ivory/40 capitalize">{adminProfile.role.toLowerCase()}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-sm text-sm text-ivory/60 hover:text-ivory hover:bg-white/8 transition-colors font-dm-sans"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden bg-plum text-ivory flex items-center justify-between px-4 h-14 sticky top-0 z-30">
          <Link to="/admin/dashboard">
            <ManasaraLogo variant="light" className="h-6 w-auto" />
          </Link>
          <button
            onClick={handleSignOut}
            className="text-ivory/60 hover:text-ivory p-2"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
