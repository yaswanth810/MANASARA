function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-fraunces text-xl font-medium text-plum mt-8 mb-3">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed text-plum/70 font-dm-sans">{children}</p>
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto section-padding py-12 sm:py-16">
      <p className="label-sm text-muted-leaf mb-2">Policy</p>
      <h1 className="editorial-lg text-plum mb-2">Privacy Policy</h1>
      <p className="text-xs text-plum/40 font-dm-sans mb-10">Last updated: November 2024</p>

      <div className="bg-blush/50 border border-soft-line rounded-sm p-4 mb-6">
        <p className="text-sm text-plum/70 font-dm-sans">
          We're a small, founder-run business. We collect only what we need to fulfil your order,
          and we won't sell or misuse your data.
        </p>
      </div>

      <div className="space-y-5">
        <H2>What we collect</H2>
        <P>When you place an order, we collect:</P>
        <ul className="list-disc pl-5 space-y-1 text-plum/70 font-dm-sans leading-relaxed">
          <li>Your name</li>
          <li>Your 10-digit Indian mobile number</li>
          <li>Your email address (optional, for order updates)</li>
          <li>Your delivery address (line, city, district, state, PIN code)</li>
          <li>Your order and payment details</li>
        </ul>

        <H2>Why we collect it</H2>
        <ul className="list-disc pl-5 space-y-1 text-plum/70 font-dm-sans leading-relaxed">
          <li>To process and fulfil your order</li>
          <li>To contact you about your order status</li>
          <li>To verify UPI payments</li>
          <li>To handle refund or cancellation requests</li>
        </ul>

        <H2>Who we share it with</H2>
        <P>
          We do not sell your personal data. Your delivery address is shared with our shipping/courier partner
          solely for delivery. We do not share your data with marketing companies, analytics platforms, or any
          third party except as necessary to fulfil your order.
        </P>

        <H2>How we store it</H2>
        <P>
          Your data is stored securely using Supabase (a cloud database provider based on PostgreSQL)
          with row-level security enabled. Payment references are stored as text strings — we do not store
          or process credit/debit card numbers.
        </P>

        <H2>How long we keep it</H2>
        <P>
          We retain order data for up to 2 years for accounting and dispute purposes. If you'd like your
          data removed sooner, contact us and we will delete it provided there are no outstanding orders.
        </P>

        <H2>Your rights</H2>
        <ul className="list-disc pl-5 space-y-1 text-plum/70 font-dm-sans leading-relaxed">
          <li>Request a copy of the data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion (subject to legal obligations)</li>
        </ul>

        <H2>Cookies & analytics</H2>
        <P>
          This website currently does not use third-party tracking cookies or analytics. If this changes,
          we will update this policy and add a consent mechanism before collecting any analytics data.
        </P>

        <H2>Contact</H2>
        <P>
          For any privacy-related questions, email us at{' '}
          <a href="mailto:hello@manasara.in" className="text-dusty-pink underline">hello@manasara.in</a>.
        </P>
      </div>
    </div>
  )
}
