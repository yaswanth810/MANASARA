import { useStoreSetting } from '@/hooks/useProducts'

export function AnnouncementStrip() {
  const { data: announcementText } = useStoreSetting<string>('announcement_text')
  const { data: announcementVisible } = useStoreSetting<boolean>('announcement_visible')

  if (!announcementVisible || !announcementText) {
    // Default announcement when not configured
    return (
      <div className="announcement-strip" role="banner">
        Free delivery on orders above ₹499 · Made to order · UPI payments accepted
      </div>
    )
  }

  return (
    <div className="announcement-strip" role="banner">
      {announcementText}
    </div>
  )
}
