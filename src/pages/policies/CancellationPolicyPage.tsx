function PolicyLayout({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto section-padding py-12 sm:py-16">
      <p className="label-sm text-muted-leaf mb-2">Policy</p>
      <h1 className="editorial-lg text-plum mb-2">{title}</h1>
      <p className="text-xs text-plum/40 font-dm-sans mb-10">Last updated: {lastUpdated}</p>
      <div className="font-dm-sans text-plum/80 space-y-5">
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

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout title="Cancellations & Refunds" lastUpdated="November 2024">
      <div className="bg-blush/60 border border-soft-line rounded-sm p-4 mb-2">
        <p className="text-sm font-medium text-plum font-dm-sans">
          Because every piece is handmade to order, cancellations must be requested before production begins.
        </p>
      </div>

      <H2>Cancellation window</H2>
      <P>
        You may cancel your order at any time before production has started. Once production is in progress
        (order status: In Production), we cannot guarantee cancellation, as materials have already been used.
      </P>
      <P>
        To request a cancellation, contact us immediately with your order code at hello@manasara.in or via Instagram DM.
      </P>

      <H2>Eligibility for refunds</H2>
      <ul className="list-disc pl-5 space-y-2 text-plum/70 leading-relaxed">
        <li>Order cancelled before production: full refund of verified payment.</li>
        <li>Order cancelled during production: partial refund may apply depending on materials used.</li>
        <li>Order arrived damaged or significantly different from description: eligible for replacement or refund.</li>
        <li>Personalised / custom items: not eligible for cancellation once production has started, unless defective.</li>
      </ul>

      <H2>Refund process</H2>
      <P>
        Approved refunds are processed via UPI to the original payment number within 3–5 business days of approval.
        We will confirm the UPI refund details with you before processing.
      </P>
      <P>
        Note: We only refund verified payments. If your payment was not yet confirmed by us, we will simply
        close the order without refund.
      </P>

      <H2>Non-refundable situations</H2>
      <ul className="list-disc pl-5 space-y-2 text-plum/70 leading-relaxed">
        <li>Buyer changed their mind after production started (without a defect).</li>
        <li>Incorrect address provided by the buyer leading to non-delivery.</li>
        <li>Minor colour or texture variations inherent to handmade products.</li>
      </ul>

      <H2>Contact us</H2>
      <P>
        For any cancellation or refund request, contact us at{' '}
        <a href="mailto:hello@manasara.in" className="text-dusty-pink underline">hello@manasara.in</a> with your
        order code and reason. We will respond within 1–2 business days.
      </P>
    </PolicyLayout>
  )
}
