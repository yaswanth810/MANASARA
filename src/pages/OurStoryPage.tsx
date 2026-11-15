import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Sparkles, Package } from 'lucide-react'

const values = [
  { icon: Heart, title: 'Handmade', desc: 'Every piece is hand-shaped, one at a time. No shortcuts, no mass production.' },
  { icon: Sparkles, title: 'Thoughtful', desc: 'We make gifts people actually keep — small tokens that carry real weight.' },
  { icon: Package, title: 'Personalised', desc: 'Most pieces can be customised to colour, size, or a written note.' },
]

export default function OurStoryPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-plum text-ivory section-y">
        <div className="max-w-content mx-auto section-padding">
          <div className="max-w-2xl">
            <p className="label-sm text-dusty-pink mb-4">Our story</p>
            <h1 className="editorial-xl text-ivory mb-6">
              Made by two friends,<br />
              <em className="text-dusty-pink not-italic">one stitch at a time.</em>
            </h1>
            <p className="body-lg text-ivory/70">
              MANASARA started as a side project between two friends in Andhra Pradesh
              who believed that small, handmade things carry enormous emotional weight.
            </p>
          </div>
        </div>
      </section>

      {/* Story body */}
      <section className="section-y">
        <div className="max-w-content mx-auto section-padding">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 body-lg text-plum/80">
              <p>
                It started simply: one of us needed a thoughtful gift for a friend but couldn't find anything
                that felt personal without being expensive. So we made one — a small pipe-cleaner flower keychain,
                bent and shaped by hand until it looked right.
              </p>
              <p>
                The friend loved it. Others asked where it came from. We made more.
              </p>
              <p>
                MANASARA is the Telugu word for a feeling — the warmth that comes with a heartfelt gesture.
                We chose it because that's exactly what we're trying to put into every piece: something that makes
                the person who receives it feel genuinely seen.
              </p>
              <p>
                We're a small operation. Two founders, a lot of chenille stems, and an honest love for craft.
                Everything is made to order because we care about not wasting materials, and because it means
                your gift is made specifically for you.
              </p>
            </div>

            {/* Photo placeholder */}
            <div className="rounded-sm bg-blush aspect-[4/3] flex flex-col items-center justify-center gap-3 text-plum/30">
              <Package className="h-10 w-10" />
              <p className="text-sm font-dm-sans text-center px-8">
                Founder / workshop photo — replace with a candid, natural-light shot of the making process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-y bg-blush/40">
        <div className="max-w-content mx-auto section-padding">
          <div className="text-center mb-10">
            <h2 className="editorial-lg text-plum">What we stand for</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-surface p-6">
                <div className="h-10 w-10 rounded-sm bg-blush flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-dusty-pink" />
                </div>
                <h3 className="editorial-sm text-plum mb-2">{title}</h3>
                <p className="text-sm text-plum/60 font-dm-sans">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-y text-center">
        <div className="max-w-content mx-auto section-padding">
          <h2 className="editorial-lg text-plum mb-4">Find something for them</h2>
          <p className="text-plum/60 font-dm-sans mb-8">
            Browse keychains, flower stems, mini bouquets, and more — all handmade to order.
          </p>
          <Link to="/shop" className="btn-primary">
            Explore the collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
