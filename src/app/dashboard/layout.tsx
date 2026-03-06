import Navbar from '@/components/Navbar'
import PlanGuard from '@/components/PlanGuard'
import InactivityLogout from '@/components/InactivityLogout'
import './dashboard.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-root" style={{ background: '#0B0B12' }}>
      <PlanGuard />
      <InactivityLogout />
      <div className="lg:flex lg:h-screen lg:overflow-hidden">
        <Navbar />
        <main className="flex-1 min-w-0 relative z-10 lg:overflow-y-auto lg:h-full">
          {children}
        </main>
      </div>
    </div>
  )
}
