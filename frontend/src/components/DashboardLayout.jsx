import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pneumodetect_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('pneumodetect_sidebar_collapsed', isCollapsed ? 'true' : 'false')
    } catch {
      // Storage unavailable or disabled
    }
  }, [isCollapsed])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased flex flex-col">
      {/* Vertical Navigation Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
        }`}
      >
        {/* Compact Dashboard Top Header */}
        <DashboardHeader
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setMobileOpen={setMobileOpen}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

