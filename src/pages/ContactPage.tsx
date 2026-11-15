import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Instagram, Loader2, CheckCircle } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().refine(
    (v) => !v || /^[6-9]\d{9}$/.test(v.replace(/[\s\-+]/g, '').replace(/^91/, '')),
    { message: 'Enter a valid 10-digit Indian mobile number' }
  ),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type FormValues = z.infer<typeof schema>

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    // Open default mail client with pre-filled content
    const subject = encodeURIComponent(`MANASARA — Enquiry from ${data.name}`)
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone ?? 'Not provided'}\n\nMessage:\n${data.message}`
    )
    window.location.href = `mailto:hello@manasara.in?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <div className="max-w-content mx-auto section-padding py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="label-sm text-muted-leaf mb-2">Get in touch</p>
          <h1 className="editorial-lg text-plum mb-3">Contact Us</h1>
          <p className="text-plum/60 font-dm-sans">
            We'd love to hear from you — questions about products, custom orders, or anything else.
            We typically reply within 1–2 business days.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {/* Form */}
          <div className="sm:col-span-2 lg:col-span-1">
            {submitted ? (
              <div className="card-surface p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-leaf mx-auto mb-4" />
                <h2 className="editorial-sm text-plum mb-2">Your email app should open</h2>
                <p className="text-sm text-plum/60 font-dm-sans">
                  If it didn't, email us directly at{' '}
                  <a href="mailto:hello@manasara.in" className="text-dusty-pink underline">hello@manasara.in</a>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="card-surface p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Name *</label>
                  <input {...register('name')} placeholder="Your name" className="input-base" />
                  {errors.name && <p className="text-xs text-red-600 mt-1 font-dm-sans">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Email *</label>
                  <input {...register('email')} type="email" placeholder="you@example.com" className="input-base" />
                  {errors.email && <p className="text-xs text-red-600 mt-1 font-dm-sans">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">
                    Phone <span className="text-plum/40 font-normal">(optional)</span>
                  </label>
                  <input {...register('phone')} placeholder="10-digit Indian mobile" className="input-base" inputMode="numeric" />
                  {errors.phone && <p className="text-xs text-red-600 mt-1 font-dm-sans">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">Message *</label>
                  <textarea
                    {...register('message')}
                    placeholder="Tell us what you need…"
                    rows={5}
                    className="input-base resize-none"
                  />
                  {errors.message && <p className="text-xs text-red-600 mt-1 font-dm-sans">{errors.message.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send message
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <div className="card-surface p-5">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-4 w-4 text-dusty-pink" />
                <p className="text-sm font-medium text-plum font-dm-sans">Email</p>
              </div>
              <a href="mailto:hello@manasara.in" className="text-sm text-dusty-pink hover:underline font-dm-sans">
                hello@manasara.in
              </a>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center gap-3 mb-2">
                <Instagram className="h-4 w-4 text-dusty-pink" />
                <p className="text-sm font-medium text-plum font-dm-sans">Instagram</p>
              </div>
              <a
                href="https://instagram.com/manasara"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dusty-pink hover:underline font-dm-sans"
              >
                @manasara
              </a>
              <p className="text-xs text-plum/40 mt-1 font-dm-sans">DMs open for custom orders</p>
            </div>

            <div className="bg-blush/50 rounded-sm p-4">
              <p className="text-xs text-plum/60 font-dm-sans leading-relaxed">
                <strong className="font-medium">Custom orders:</strong> Tell us the occasion, your preferred colours,
                and any personalisation notes. We'll confirm availability and pricing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
