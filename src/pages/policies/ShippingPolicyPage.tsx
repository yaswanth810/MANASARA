function PolicyLayout({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto section-padding py-12 sm:py-16">
      <p className="label-sm text-muted-leaf mb-2">Policy</p>
      <h1 className="editorial-lg text-plum mb-2">{title}</h1>
      <p className="text-xs text-plum/40 font-dm-sans mb-10">Last updated: {lastUpdated}</p>
      <div className="prose prose-sm max-w-none font-dm-sans text-plum/80 space-y-5">
        {children}
      </div>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-fraunces text-xl font-medium text-plum mt-8 mb-3">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed text-plum/70">{children}</p>
}

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping Policy" lastUpdated="November 2024">
      <H2>Handmade to order</H2>
      <P>
        Every MANASARA product is handcrafted after your order is confirmed. This means we do not hold finished inventory.
        Production begins once payment is verified, not before.
      </P>

      <H2>Production time</H2>
      <P>
        Most products take 2–5 business days to make, depending on the design and your customisation choices.
        The estimated lead time is shown on each product page. Complex bouquets or large quantities may take longer
        — we will contact you if that's the case.
      </P>

      <H2>Shipping time</H2>
      <P>
        After production, orders are shipped via standard courier. Delivery timelines depend on your location:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-plum/70">
        <li>Andhra Pradesh & Telangana: 1–3 business days after dispatch</li>
        <li>Rest of India: 3–7 business days after dispatch</li>
      </ul>

      <H2>Shipping charges</H2>
      <P>
        Shipping charges are calculated at checkout based on your delivery PIN code. Exact charges are shown
        before you place your order. We do not offer free shipping by default — any promotional free-shipping
        threshold will be announced on the website.
      </P>

      <H2>Serviceable areas</H2>
      <P>
        We currently serve Andhra Pradesh and Telangana. We are expanding to other Indian states — check at
        checkout if your PIN code is currently serviceable. If it's not, contact us and we'll try to help.
      </P>

      <H2>Tracking</H2>
      <P>
        Use the{' '}
        <a href="/track-order" className="text-dusty-pink underline">Track Order</a> page with your order code
        and phone number to check your order status.
      </P>

      <H2>Packaging</H2>
      <P>
        All orders are gift-ready by default — packaged with care in kraft paper or a small gift box, with a
        ribbon. If you have specific packaging requests, note them in the customisation field at checkout.
      </P>

      <H2>Delays</H2>
      <P>
        While we do our best to dispatch on time, delays can occasionally happen due to material availability,
        public holidays, or carrier issues. We will notify you if your order is significantly delayed.
      </P>

      <H2>Damaged in transit</H2>
      <P>
        If your order arrives damaged, please photograph the parcel and product within 24 hours of delivery
        and contact us at hello@manasara.in. We will assess and arrange a replacement or refund where appropriate.
      </P>
    </PolicyLayout>
  )
}
