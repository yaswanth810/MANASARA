import { Outlet } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { AnnouncementStrip } from '@/components/layout/AnnouncementStrip'

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementStrip />
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
