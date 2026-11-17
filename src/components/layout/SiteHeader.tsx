import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, Search, Heart, UserCircle2, LogIn } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { cn } from '@/lib/utils'
import { ManasaraLogo } from '@/components/brand/ManasaraLogo'
import { useAuth } from '@/hooks/useAuth'

const navLinks = [
  { label: 'Shop',         to: '/shop' },
  { label: 'Bestsellers',  to: '/shop?sort=popular' },
  { label: 'Custom Gifts', to: '/shop?category=custom' },
  { label: 'Our Story',    to: '/our-story' },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate   = useNavigate()
  const itemCount  = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const { user }   = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [navigate])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
    if (q) { navigate(`/shop?q=${encodeURIComponent(q)}`); setSearchOpen(false) }
  }

  const iconCls = cn(
    'h-10 w-10 flex items-center justify-center rounded-full transition-colors duration-150',
    'text-plum/60 hover:text-plum hover:bg-black/5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-pink',
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white',
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-content mx-auto px-6 lg:px-10">
        <div className="flex h-[68px] items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link
            to="/"
            aria-label="MANASARA — Home"
            className="shrink-0 focus-visible:ring-2 focus-visible:ring-dusty-pink focus-visible:ring-offset-2 rounded-sm"
          >
            <ManasaraLogo variant="dark" className="h-9 w-auto" />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-dm-sans font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-pink rounded-sm',
                    isActive ? 'text-dusty-pink' : 'text-plum/75 hover:text-plum',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Actions ── */}
          <div className="flex items-center gap-0.5">
            {/* Search */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((o) => !o)}
              className={iconCls}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link to="/shop" aria-label="Wishlist" className={iconCls}>
              <Heart className="h-5 w-5" />
            </Link>

            {/* Account */}
            {user ? (
              <Link
                to="/account"
                aria-label="My Account"
                className={iconCls}
              >
                <UserCircle2 className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label="Sign in"
                className={iconCls}
              >
                <LogIn className="h-5 w-5" />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              aria-label={`Shopping cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              className={cn(iconCls, 'relative')}
            >
              <ShoppingBag className="h-5 w-5" />
              {/* Badge — always show, 0 when empty (matches mockup) */}
              <span
                aria-label={`${itemCount} items`}
                className="absolute -top-0 -right-0 flex h-4 w-4 items-center justify-center rounded-full bg-dusty-pink text-white text-[9px] font-semibold font-dm-sans leading-none"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              className={cn(iconCls, 'md:hidden')}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Inline search bar ── */}
        {searchOpen && (
          <div className="border-t border-black/6 py-3">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
              <input
                name="q"
                type="search"
                autoFocus
                placeholder="Search for dolls, couples, keychains…"
                className="flex-1 bg-black/4 text-plum placeholder-plum/35 text-sm font-dm-sans rounded-full px-4 py-2.5 outline-none border border-transparent focus:border-dusty-pink/50 transition-colors"
              />
              <button
                type="submit"
                className="bg-plum text-ivory text-sm font-dm-sans font-medium px-5 py-2.5 rounded-full hover:bg-plum/90 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* ── Mobile nav ── */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-black/6 py-4" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        'block px-3 py-3 text-sm font-dm-sans font-medium rounded-xl transition-colors',
                        isActive ? 'text-dusty-pink bg-blush/50' : 'text-plum/75 hover:text-plum hover:bg-black/4',
                      )
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="mt-2 pt-2 border-t border-black/6">
                <Link
                  to="/cart"
                  className="flex items-center gap-2 px-3 py-3 text-sm font-dm-sans text-plum/70 hover:text-plum rounded-xl"
                  onClick={() => setMobileOpen(false)}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Cart {itemCount > 0 && `(${itemCount})`}
                </Link>
              </li>
              <li>
                {user ? (
                  <Link
                    to="/account"
                    className="flex items-center gap-2 px-3 py-3 text-sm font-dm-sans text-plum/70 hover:text-plum rounded-xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserCircle2 className="h-4 w-4" />
                    My Account
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-3 text-sm font-dm-sans text-plum/70 hover:text-plum rounded-xl"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
