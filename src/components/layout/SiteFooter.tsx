import { Link } from 'react-router-dom'
import { Instagram, Mail, Package } from 'lucide-react'
import { ManasaraLogo } from '@/components/brand/ManasaraLogo'

const footerLinks = {
  shop: [
    { label: 'All Products', to: '/shop' },
    { label: 'Keychains', to: '/collections/keychains' },
    { label: 'Flower Stems', to: '/collections/flowers' },
    { label: 'Bouquets', to: '/collections/bouquets' },
    { label: 'Gift Sets', to: '/collections/gift-sets' },
  ],
  help: [
    { label: 'Track Your Order', to: '/track-order' },
    { label: 'Our Story', to: '/our-story' },
    { label: 'Contact Us', to: '/contact' },
  ],
  policies: [
    { label: 'Shipping Policy', to: '/policies/shipping' },
    { label: 'Cancellations', to: '/policies/cancellations' },
    { label: 'Privacy Policy', to: '/policies/privacy' },
  ],
}

export function SiteFooter() {
  return (
    <footer className="bg-plum text-ivory/80">
      {/* Main footer */}
      <div className="max-w-content mx-auto section-padding py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 md:col-span-1">
            <ManasaraLogo variant="light" className="h-8 w-auto mb-4" />
            <p className="text-sm leading-relaxed text-ivory/60 mb-6 max-w-xs">
              Handmade keepsakes for the people who make your days special. Made with care, from Andhra Pradesh.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MANASARA on Instagram"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-ivory"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@manasara.in"
                aria-label="Email MANASARA"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-ivory"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-dm-sans font-medium uppercase tracking-widest text-ivory/40 mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-ivory/60 hover:text-ivory active:text-ivory transition-colors py-0.5 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-dm-sans font-medium uppercase tracking-widest text-ivory/40 mb-4">Help</h3>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-ivory/60 hover:text-ivory active:text-ivory transition-colors py-0.5 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xs font-dm-sans font-medium uppercase tracking-widest text-ivory/40 mb-4">Policies</h3>
            <ul className="space-y-3">
              {footerLinks.policies.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-ivory/60 hover:text-ivory active:text-ivory transition-colors py-0.5 block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Handmade promise */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-sm bg-white/5">
            <Package className="h-5 w-5 text-dusty-pink shrink-0" />
            <p className="text-xs text-ivory/50 leading-relaxed">
              Every piece is handmade to order. Production begins after payment is confirmed.{' '}
              Please allow 2–5 business days for your order to be ready.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-content mx-auto section-padding py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <p className="text-xs text-ivory/40 font-dm-sans">
            © {new Date().getFullYear()} MANASARA. All rights reserved.
          </p>
          <p className="text-xs text-ivory/30 font-dm-sans">
            Made with care in Andhra Pradesh, India.
          </p>
        </div>
      </div>
    </footer>
  )
}
