"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/app/components/Sidebar"
import styles from "./shell.module.css"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setSidebarOpen(prev => !prev)
    window.addEventListener('toggleSidebar', handleToggle)
    return () => window.removeEventListener('toggleSidebar', handleToggle)
  }, [])

  return (
    <div className={styles.shell}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}