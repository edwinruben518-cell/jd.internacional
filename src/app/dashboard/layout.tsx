import Navbar from '@/components/Navbar'
import PlanGuard from '@/components/PlanGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative" style={{ background: '#0B0C14' }}>
      <PlanGuard />
      <Navbar />
      <main className="relative z-10 pb-24 lg:pb-8 lg:pl-60">
        {children}
      </main>
    </div>
  )
}
