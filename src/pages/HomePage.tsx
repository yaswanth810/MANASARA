import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Package, Heart, Gift } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'

// ─────────────────────────────────────────────────────────────────────────────
// Hero image — run copy-hero.bat once to place it in /public
// Falls back to Supabase CDN, then to soft gradient if neither is available
// ─────────────────────────────────────────────────────────────────────────────
const HERO_LOCAL    = '/hero-main.jpg'
const HERO_SUPABASE = 'https://mcnrarmkuyzyycpuvtec.supabase.co/storage/v1/object/public/store-assets/hero/hero-main.jpg'

// ─────────────────────────────────────────────────────────────────────────────
// Collection SVG illustrations
// ─────────────────────────────────────────────────────────────────────────────

function FriendshipDollsIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="108" rx="38" ry="7" fill="#C4A882" opacity="0.5"/>
      <rect x="30" y="80" width="8" height="22" rx="4" fill="#F0EDE8"/>
      <rect x="40" y="80" width="8" height="22" rx="4" fill="#F0EDE8"/>
      <ellipse cx="34" cy="102" rx="5" ry="3" fill="#9B7EC8"/>
      <ellipse cx="44" cy="102" rx="5" ry="3" fill="#9B7EC8"/>
      <rect x="27" y="58" width="24" height="24" rx="6" fill="#B89AD4"/>
      <path d="M27 65 Q18 70 20 76" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <path d="M51 65 Q58 68 56 74" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="39" cy="48" rx="12" ry="11" fill="#F5CBA7"/>
      <ellipse cx="39" cy="38" rx="13" ry="8" fill="#6B3A2A"/>
      <circle cx="29" cy="40" r="5" fill="#6B3A2A"/>
      <circle cx="49" cy="40" r="5" fill="#6B3A2A"/>
      <path d="M42 36 C45 32 50 33 48 37 C46 41 42 40 42 36Z" fill="#B89AD4"/>
      <path d="M42 36 C39 32 34 33 36 37 C38 41 42 40 42 36Z" fill="#B89AD4"/>
      <circle cx="42" cy="37" r="2" fill="#9B7EC8"/>
      <circle cx="35" cy="49" r="1.5" fill="#2D1B0E"/>
      <circle cx="43" cy="49" r="1.5" fill="#2D1B0E"/>
      <path d="M36 53 Q39 55.5 42 53" stroke="#C47A6E" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <ellipse cx="33" cy="51" rx="2.5" ry="1.5" fill="#E8A598" opacity="0.6"/>
      <ellipse cx="45" cy="51" rx="2.5" ry="1.5" fill="#E8A598" opacity="0.6"/>
      <rect x="72" y="80" width="8" height="22" rx="4" fill="#A8C5DA"/>
      <rect x="82" y="80" width="8" height="22" rx="4" fill="#A8C5DA"/>
      <ellipse cx="76" cy="102" rx="5" ry="3" fill="#E8A5B0"/>
      <ellipse cx="86" cy="102" rx="5" ry="3" fill="#E8A5B0"/>
      <rect x="69" y="58" width="24" height="24" rx="6" fill="#E8A5B0"/>
      <path d="M69 65 Q62 68 64 74" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <path d="M93 65 Q100 70 98 76" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="81" cy="48" rx="12" ry="11" fill="#F5CBA7"/>
      <ellipse cx="81" cy="38" rx="13" ry="8" fill="#1A1A2E"/>
      <circle cx="71" cy="40" r="5" fill="#1A1A2E"/>
      <circle cx="91" cy="40" r="5" fill="#1A1A2E"/>
      <path d="M68 48 C65 55 68 65 70 72" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="88" cy="37" r="5" fill="white" opacity="0.9"/>
      <circle cx="88" cy="37" r="2.5" fill="#E8C77B"/>
      <circle cx="77" cy="49" r="1.5" fill="#2D1B0E"/>
      <circle cx="85" cy="49" r="1.5" fill="#2D1B0E"/>
      <path d="M78 53 Q81 55.5 84 53" stroke="#C47A6E" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M60 70 C60 70 56 66.5 56 64 C56 61.5 58 60.5 60 63 C62 60.5 64 61.5 64 64 C64 66.5 60 70 60 70Z" fill="#E8A5B0" opacity="0.9"/>
    </svg>
  )
}

function WeddingCoupleIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="112" rx="42" ry="6" fill="#C4A882" opacity="0.5"/>
      <path d="M25 55 L18 108 L44 108 L50 55 Z" fill="#C0392B" opacity="0.85"/>
      <path d="M25 55 C20 70 18 85 18 108" stroke="#E8C77B" strokeWidth="1.5" fill="none"/>
      <path d="M50 55 C45 70 44 90 44 108" stroke="#E8C77B" strokeWidth="1.5" fill="none"/>
      <rect x="18" y="104" width="26" height="4" rx="1" fill="#E8C77B" opacity="0.8"/>
      <rect x="27" y="42" width="20" height="16" rx="4" fill="#C0392B" opacity="0.9"/>
      <ellipse cx="37" cy="32" rx="11" ry="10" fill="#C8956C"/>
      <ellipse cx="37" cy="23" rx="11" ry="7" fill="#1A1A2E"/>
      <ellipse cx="37" cy="20" rx="7" ry="5" fill="#1A1A2E"/>
      <line x1="37" y1="22" x2="37" y2="27" stroke="#E8C77B" strokeWidth="1"/>
      <circle cx="37" cy="27" r="2" fill="#E8C77B"/>
      <circle cx="30" cy="22" r="2.5" fill="white" opacity="0.9"/>
      <path d="M28 42 C30 36 44 36 46 42" stroke="#71836A" strokeWidth="2" fill="none"/>
      <circle cx="30" cy="38" r="3" fill="#E8A5B0"/>
      <circle cx="37" cy="36" r="3" fill="white" opacity="0.9"/>
      <circle cx="44" cy="38" r="3" fill="#E8A5B0"/>
      <circle cx="33" cy="33" r="1.5" fill="#2D1B0E"/>
      <circle cx="41" cy="33" r="1.5" fill="#2D1B0E"/>
      <path d="M34 37 Q37 39 40 37" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M72 55 L70 108 L92 108 L92 55 Z" fill="#F5F0DC" opacity="0.9"/>
      <line x1="81" y1="55" x2="81" y2="108" stroke="#E8C77B" strokeWidth="1.5"/>
      <rect x="70" y="104" width="22" height="4" rx="1" fill="#E8C77B" opacity="0.8"/>
      <rect x="70" y="40" width="22" height="18" rx="4" fill="#F5F0DC" opacity="0.95"/>
      <ellipse cx="81" cy="30" rx="11" ry="10" fill="#C8956C"/>
      <ellipse cx="81" cy="21" rx="11" ry="7" fill="#5C3317"/>
      <circle cx="74" cy="22" r="4" fill="#5C3317"/>
      <circle cx="88" cy="22" r="4" fill="#5C3317"/>
      <circle cx="81" cy="19" r="4" fill="#5C3317"/>
      <path d="M72 40 C74 34 90 34 92 40" stroke="#71836A" strokeWidth="2" fill="none"/>
      <circle cx="74" cy="36" r="3" fill="#E8A5B0"/>
      <circle cx="81" cy="34" r="3" fill="white" opacity="0.9"/>
      <circle cx="88" cy="36" r="3" fill="#E8A5B0"/>
      <circle cx="77" cy="31" r="1.5" fill="#2D1B0E"/>
      <circle cx="85" cy="31" r="1.5" fill="#2D1B0E"/>
      <path d="M50 68 C57 65 65 65 72 68" stroke="#C8956C" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}

function RomanticCoupleIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="108" rx="42" ry="8" fill="#F0EDE8" opacity="0.9"/>
      <path d="M60 110 C55 105 48 106 50 110 C52 114 58 112 60 110Z" fill="#E8A5B0"/>
      <path d="M60 110 C65 105 72 106 70 110 C68 114 62 112 60 110Z" fill="#E8A5B0"/>
      <circle cx="60" cy="110" r="2.5" fill="#D98C9E"/>
      <path d="M22 80 C18 90 16 100 20 108 L48 108 C48 100 46 90 44 80 Z" fill="#F0B8C0" opacity="0.9"/>
      <rect x="25" y="58" width="22" height="24" rx="6" fill="#E8A5B0"/>
      <path d="M25 65 Q17 68 18 75" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <path d="M47 65 Q52 62 54 68" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="36" cy="46" rx="12" ry="11" fill="#F5CBA7"/>
      <ellipse cx="36" cy="37" rx="13" ry="8" fill="#5C3317"/>
      <circle cx="24" cy="40" r="6" fill="#5C3317"/>
      <circle cx="48" cy="40" r="5" fill="#5C3317"/>
      <path d="M23 46 C20 55 22 68 24 76" stroke="#5C3317" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="45" cy="36" r="5" fill="#E8A5B0"/>
      <circle cx="45" cy="36" r="2.5" fill="#FBF7F2"/>
      <circle cx="45" cy="36" r="1.5" fill="#E8C77B"/>
      <circle cx="32" cy="47" r="1.5" fill="#2D1B0E"/>
      <circle cx="40" cy="47" r="1.5" fill="#2D1B0E"/>
      <path d="M33 51 Q36 53.5 39 51" stroke="#C47A6E" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M72 80 C70 90 68 100 70 108 L96 108 C96 100 94 90 92 80 Z" fill="#2D2D2D" opacity="0.85"/>
      <rect x="69" y="58" width="22" height="24" rx="6" fill="#F5F5F0"/>
      <path d="M69 64 Q62 60 50 65" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <path d="M91 65 Q98 70 96 76" stroke="#F5CBA7" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="80" cy="46" rx="12" ry="11" fill="#F5CBA7"/>
      <ellipse cx="80" cy="36" rx="13" ry="9" fill="#5C3317"/>
      <circle cx="68" cy="40" r="6" fill="#5C3317"/>
      <circle cx="92" cy="40" r="6" fill="#5C3317"/>
      <circle cx="74" cy="35" r="5" fill="#5C3317"/>
      <circle cx="86" cy="34" r="5" fill="#5C3317"/>
      <circle cx="80" cy="32" r="5" fill="#5C3317"/>
      <circle cx="76" cy="47" r="1.5" fill="#2D1B0E"/>
      <circle cx="84" cy="47" r="1.5" fill="#2D1B0E"/>
      <path d="M77 51 Q80 53.5 83 51" stroke="#C47A6E" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M60 76 C60 76 53 70 53 65 C53 61 56 59 60 64 C64 59 67 61 67 65 C67 70 60 76 60 76Z" fill="#C0392B" opacity="0.9"/>
    </svg>
  )
}

function CustomDollIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="110" rx="36" ry="6" fill="#C4A882" opacity="0.5"/>
      <rect x="43" y="58" width="34" height="30" rx="8" fill="#F5F5F0"/>
      <path d="M40 85 L35 110 L85 110 L80 85 Z" fill="#B89AD4" opacity="0.4"/>
      <path d="M42 85 L38 110 L82 110 L78 85 Z" fill="#D98C9E" opacity="0.5"/>
      <path d="M44 85 L41 110 L79 110 L76 85 Z" fill="#E8C77B" opacity="0.5"/>
      <path d="M43 68 Q30 65 28 72" stroke="#F5CBA7" strokeWidth="5" strokeLinecap="round"/>
      <path d="M77 68 Q90 65 92 72" stroke="#F5CBA7" strokeWidth="5" strokeLinecap="round"/>
      <ellipse cx="60" cy="44" rx="16" ry="15" fill="#F5CBA7"/>
      <ellipse cx="60" cy="32" rx="17" ry="10" fill="#5C3317"/>
      <circle cx="45" cy="36" r="8" fill="#5C3317"/>
      <circle cx="75" cy="36" r="8" fill="#5C3317"/>
      <circle cx="74" cy="30" r="4" fill="#E8C77B" opacity="0.9"/>
      <circle cx="74" cy="30" r="2" fill="#E8C77B"/>
      <circle cx="46" cy="30" r="3" fill="#D98C9E" opacity="0.9"/>
      <circle cx="55" cy="46" r="2" fill="#2D1B0E"/>
      <circle cx="65" cy="46" r="2" fill="#2D1B0E"/>
      <path d="M56 51 Q60 54 64 51" stroke="#C47A6E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <ellipse cx="52" cy="49" rx="3" ry="2" fill="#E8A598" opacity="0.6"/>
      <ellipse cx="68" cy="49" rx="3" ry="2" fill="#E8A598" opacity="0.6"/>
      <ellipse cx="28" cy="74" rx="8" ry="6" fill="#FBF7F2" stroke="#E8D8C8" strokeWidth="1"/>
      <circle cx="25" cy="72" r="2" fill="#D98C9E"/>
      <circle cx="30" cy="71" r="2" fill="#E8C77B"/>
      <circle cx="30" cy="76" r="2" fill="#71836A" opacity="0.7"/>
      <circle cx="25" cy="76" r="2" fill="#B89AD4"/>
      <line x1="92" y1="66" x2="85" y2="78" stroke="#C4A882" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="85" cy="79" r="3" fill="#D98C9E"/>
      <text x="38" y="102" fontSize="5.5" fill="#403238" fontFamily="serif" opacity="0.6">Your design</text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Collections data
// ─────────────────────────────────────────────────────────────────────────────
const collections = [
  { name: 'Friendship Dolls', slug: 'friendship-dolls', description: 'BFF pairs & cute characters', color: 'bg-[#F6E8EC]',       Illustration: FriendshipDollsIllustration },
  { name: 'Wedding Couples',  slug: 'wedding-couples',  description: 'Bride & groom keepsakes',    color: 'bg-[#EAF0E8]',       Illustration: WeddingCoupleIllustration },
  { name: 'Romantic Pairs',   slug: 'romantic-pairs',   description: 'Love gifting, made by hand', color: 'bg-[#FDF5E0]',       Illustration: RomanticCoupleIllustration },
  { name: 'Custom Orders',    slug: 'custom-orders',    description: 'Your design, our craft',     color: 'bg-[#EEE8F4]',       Illustration: CustomDollIllustration },
]

const occasions = [
  { label: 'Birthdays',     emoji: '🎂', slug: 'birthday' },
  { label: 'Friendships',   emoji: '💛', slug: 'friendship' },
  { label: 'Anniversaries', emoji: '🌸', slug: 'anniversary' },
  { label: 'Weddings',      emoji: '💍', slug: 'wedding' },
  { label: 'Just Because',  emoji: '✨', slug: 'just-because' },
  { label: 'Custom Order',  emoji: '🎨', slug: 'custom' },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: products, isLoading: productsLoading } = useProducts({ limit: 4 })

  // Cascade: local → Supabase → no image (pure CSS bg)
  const [src, setSrc]               = useState(HERO_LOCAL)
  const [imgFailed, setImgFailed]   = useState(false)

  function handleImgError() {
    if (src === HERO_LOCAL)    { setSrc(HERO_SUPABASE); return }
    if (src === HERO_SUPABASE) { setImgFailed(true) }
  }

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — matches the reference image exactly
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: '#FEF0F4' }}
      >
        {/* ── MOBILE: stacked image on top ───────────────────────────────── */}
        <div className="lg:hidden relative w-full" style={{ height: '60vw', maxHeight: '360px', minHeight: '220px' }}>
          {!imgFailed ? (
            <img
              key={src}
              src={src}
              alt="MANASARA handmade wedding couple chenille dolls with flowers"
              onError={handleImgError}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
              loading="eager"
              decoding="async"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'radial-gradient(ellipse at 60% 50%, #F5B8CE 0%, #FCDDE8 50%, #FEF0F4 100%)' }}
            />
          )}
          {/* Bottom fade to blend into text section */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #FEF0F4, transparent)' }}
          />
        </div>

        {/* ── DESKTOP: absolute right-side image ─────────────────────────── */}
        <div className="hidden lg:block absolute inset-0 left-[36%]">
          {!imgFailed ? (
            <img
              key={src}
              src={src}
              alt="MANASARA handmade wedding couple chenille dolls with flowers"
              onError={handleImgError}
              className="w-full h-full object-cover object-center"
              style={{ objectPosition: 'center top' }}
              loading="eager"
              decoding="async"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'radial-gradient(ellipse at 70% 50%, #F5B8CE 0%, #FCDDE8 35%, #FEF0F4 70%)' }}
            >
              <svg viewBox="0 0 300 260" className="absolute right-[5%] top-[8%] w-72 h-60 opacity-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M150 240 C150 240 20 160 20 80 C20 36 52 12 90 12 C115 12 136 26 150 48 C164 26 185 12 210 12 C248 12 280 36 280 80 C280 160 150 240 150 240Z" stroke="#D98C9E" strokeWidth="3" fill="none" strokeDasharray="12 6"/>
              </svg>
            </div>
          )}
          {/* Left-to-right gradient — text stays readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #FEF0F4 0%, #FEF0F4 20%, rgba(254,240,244,0.88) 32%, rgba(254,240,244,0.55) 44%, rgba(254,240,244,0.15) 58%, transparent 72%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: 'linear-gradient(to top, #FEF0F4 0%, transparent 100%)' }} />
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="relative z-10 max-w-content mx-auto px-6 lg:px-10 lg:flex lg:items-center lg:min-h-[86vh]">
          <div className="w-full lg:max-w-[520px] py-8 sm:py-12 lg:py-28">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-7">
              <span
                className="text-[11px] font-dm-sans font-semibold tracking-[0.22em] uppercase"
                style={{ color: '#7A5C63' }}
              >
                Handmade with intention
              </span>
              <div className="w-7 h-px bg-current opacity-30" style={{ color: '#D98C9E' }} />
              <Heart className="h-3 w-3 fill-current" style={{ color: '#D98C9E' }} />
            </div>

            {/* Headline */}
            <h1 className="mb-6 leading-[1.05]">
              <span
                className="block font-fraunces font-bold text-plum"
                style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)' }}
              >
                Small gifts.
              </span>
              <span
                className="block font-fraunces font-bold"
                style={{
                  fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)',
                  color: '#D98C9E',
                  fontStyle: 'italic',
                }}
              >
                Big feelings.{' '}
                <svg
                  viewBox="0 0 24 22"
                  className="inline-block align-middle mb-1"
                  style={{ width: 'clamp(1.4rem, 2.5vw, 2rem)', height: 'auto' }}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20 C12 20 1 13 1 6 C1 2.5 3.5 1 7 1 C9.2 1 11 2.8 12 4.5 C13 2.8 14.8 1 17 1 C20.5 1 23 2.5 23 6 C23 13 12 20 12 20Z"
                    stroke="#D98C9E"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Body text */}
            <p
              className="font-dm-sans leading-relaxed mb-9"
              style={{ fontSize: '1rem', color: 'rgba(64,50,56,0.68)', maxWidth: '400px' }}
            >
              Handmade keepsakes for the people who make your days special.
              Pipe-cleaner dolls, bouquets &amp; custom gifts — made to order with care.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2.5 font-dm-sans font-semibold text-sm text-white rounded-full transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                style={{
                  background: '#403238',
                  padding: '14px 28px',
                }}
              >
                Explore the Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/shop?occasion=custom"
                className="inline-flex items-center gap-2.5 font-dm-sans font-semibold text-sm rounded-full transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
                style={{
                  color: '#403238',
                  border: '1.5px solid rgba(64,50,56,0.25)',
                  background: 'rgba(255,255,255,0.65)',
                  padding: '13px 28px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Custom Gift
                <Heart className="h-4 w-4" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
              {[
                { icon: Sparkles, text: '100% Handmade' },
                { icon: Package,  text: 'Made to Order' },
                { icon: Gift,     text: 'Gift-Ready Packaging' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 font-dm-sans text-sm"
                  style={{ color: 'rgba(64,50,56,0.55)' }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: '#D98C9E' }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SHOP BY COLLECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-y bg-white">
        <div className="max-w-content mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="label-sm text-muted-leaf mb-2">Explore</p>
            <h2 className="editorial-lg text-plum">Shop by collection</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {collections.map((col) => (
              <Link
                key={col.slug}
                to={`/collections/${col.slug}`}
                className={`${col.color} rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.025] hover:shadow-md focus-visible:ring-2 focus-visible:ring-dusty-pink focus-visible:outline-none group`}
              >
                <div className="aspect-square rounded-xl bg-white/50 flex items-center justify-center overflow-hidden p-4 group-hover:bg-white/70 transition-colors duration-200">
                  <col.Illustration />
                </div>
                <div>
                  <h3 className="font-fraunces font-medium text-plum text-[0.95rem] leading-snug">{col.name}</h3>
                  <p className="text-xs font-dm-sans mt-0.5" style={{ color: 'rgba(64,50,56,0.55)' }}>{col.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BESTSELLERS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-y" style={{ background: '#FAFAF8' }}>
        <div className="max-w-content mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-sm text-muted-leaf mb-2">Popular picks</p>
              <h2 className="editorial-lg text-plum">Bestsellers</h2>
            </div>
            <Link
              to="/shop"
              className="text-sm font-dm-sans font-medium flex items-center gap-1 transition-colors hover:text-plum"
              style={{ color: '#D98C9E' }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {productsLoading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : (products ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {!productsLoading && (!products || products.length === 0) && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎀</div>
              <p className="font-fraunces text-xl text-plum mb-2">New arrivals coming soon</p>
              <p className="text-sm font-dm-sans" style={{ color: 'rgba(64,50,56,0.55)' }}>
                Our collection is being lovingly handcrafted. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SHOP BY OCCASION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-y" style={{ background: '#FEF6F8' }}>
        <div className="max-w-content mx-auto px-6 lg:px-10">
          <div className="text-center mb-10">
            <p className="label-sm text-muted-leaf mb-2">Find the perfect gift</p>
            <h2 className="editorial-lg text-plum">Shop by occasion</h2>
            <p className="text-sm font-dm-sans mt-3 max-w-md mx-auto" style={{ color: 'rgba(64,50,56,0.6)' }}>
              Whether it's a birthday, 'just because', or something custom —
              we'll help you find the right thing.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {occasions.map((occ) => (
              <Link
                key={occ.slug}
                to={`/shop?occasion=${occ.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white hover:shadow-md border border-transparent hover:border-pink-100 transition-all duration-200 text-center focus-visible:ring-2 focus-visible:ring-dusty-pink focus-visible:outline-none"
              >
                <span className="text-2xl" aria-hidden>{occ.emoji}</span>
                <span className="text-xs font-dm-sans font-medium text-plum">{occ.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BRAND STORY TEASER
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-y bg-plum text-ivory">
        <div className="max-w-content mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="label-sm mb-4" style={{ color: '#D98C9E' }}>The story behind MANASARA</p>
              <h2 className="editorial-lg text-ivory mb-6">
                Made by two friends, one stitch at a time.
              </h2>
              <p className="body-lg mb-6" style={{ color: 'rgba(251,247,242,0.7)' }}>
                MANASARA started as a side project between two friends who believed small,
                handmade things carry enormous emotional weight. Every piece leaves our
                hands with intention.
              </p>
              <p className="text-sm mb-8 font-dm-sans italic" style={{ color: 'rgba(251,247,242,0.5)' }}>
                "A little something, made just for them."
              </p>
              <Link
                to="/our-story"
                className="inline-flex items-center gap-2 font-dm-sans font-medium text-sm text-ivory rounded-full px-6 py-3 border transition-all duration-200 hover:bg-white/10"
                style={{ borderColor: 'rgba(251,247,242,0.3)' }}
              >
                Read our story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Craft scene */}
            <div
              className="aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-6">
                <rect x="20" y="175" width="280" height="10" rx="4" fill="#C4A882" opacity="0.3"/>
                <ellipse cx="45" cy="174" rx="12" ry="8" fill="#D98C9E" opacity="0.5"/>
                <ellipse cx="45" cy="166" rx="12" ry="8" fill="#E8A5B0" opacity="0.4"/>
                <ellipse cx="72" cy="170" rx="10" ry="7" fill="#E8C77B" opacity="0.5"/>
                <ellipse cx="160" cy="176" rx="22" ry="5" fill="#C4A882" opacity="0.4"/>
                <rect x="142" y="140" width="22" height="35" rx="6" fill="#F8F4EE" opacity="0.6"/>
                <ellipse cx="153" cy="130" rx="12" ry="11" fill="#F5CBA7" opacity="0.8"/>
                <ellipse cx="153" cy="121" rx="13" ry="8" fill="#6B3A2A" opacity="0.7"/>
                <rect x="168" y="143" width="20" height="32" rx="5" fill="#1A1A1A" opacity="0.6"/>
                <ellipse cx="178" cy="133" rx="11" ry="10" fill="#F5CBA7" opacity="0.8"/>
                <ellipse cx="178" cy="124" rx="12" ry="7" fill="#5C3317" opacity="0.7"/>
                <path d="M162 157 C162 157 157 152 157 149 C157 147 159 146 162 149 C165 146 167 147 167 149 C167 152 162 157 162 157Z" fill="#C0392B" opacity="0.6"/>
                <rect x="52" y="110" width="32" height="65" rx="8" fill="white" opacity="0.08"/>
                <ellipse cx="68" cy="98" rx="17" ry="16" fill="#F5CBA7" opacity="0.7"/>
                <ellipse cx="68" cy="85" rx="18" ry="10" fill="#5C3317" opacity="0.6"/>
                <rect x="236" y="112" width="30" height="63" rx="8" fill="white" opacity="0.08"/>
                <ellipse cx="251" cy="100" rx="16" ry="15" fill="#C8956C" opacity="0.7"/>
                <ellipse cx="251" cy="87" rx="17" ry="10" fill="#1A1A2E" opacity="0.6"/>
                <text x="20" y="55" fontSize="14" fill="#E8C77B" opacity="0.4">✦</text>
                <text x="285" y="65" fontSize="10" fill="#D98C9E" opacity="0.4">✦</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TRUST STRIP
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-10 border-t border-black/5 bg-white">
        <div className="max-w-content mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            {[
              { icon: Sparkles, title: 'UPI Payments',    desc: 'Pay securely via any UPI app' },
              { icon: Package,  title: 'Made to Order',   desc: '2–5 day handcrafted production' },
              { icon: Gift,     title: 'Gift Packaging',  desc: 'Every order beautifully wrapped' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #F6E8EC, #FDE8ED)' }}
                >
                  <item.icon className="h-5 w-5" style={{ color: '#D98C9E' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold font-dm-sans text-plum">{item.title}</p>
                  <p className="text-xs font-dm-sans" style={{ color: 'rgba(64,50,56,0.55)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
