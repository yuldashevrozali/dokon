"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import styles from "@/app/(dashboard)/dashboard/dashboard.module.css"

function NavItem({
  icon,
  label,
  active,
  href,
  onNavigate,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  href: string
  onNavigate?: () => void
}) {
  return (
    <Link
      className={`${styles.navItem} ${active ? styles.navActive : ""}`}
      href={href}
      // ✅ navigatsiya bo‘lganda sidebar yopish
      onClick={onNavigate}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span className={styles.navLabel}>{label}</span>
    </Link>
  )
}

/* =========================
   Icons (simple inline SVG)
   ========================= */
function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconCash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16v10H4V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 17v2M17 17v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5V17l9 5 9-5V8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 14v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M16 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M22 21v-1a4 4 0 0 0-3-3.87"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 4.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconReport() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h10v18H7V3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 7h6M9 11h6M9 15h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.5-2-3.5-2.4.5a8 8 0 0 0-1.7-1l-.4-2.4H9l-.4 2.4a8 8 0 0 0-1.7 1L4.5 9 2.5 12.5 4.5 14a7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.5 2.4-.5a8 8 0 0 0 1.7 1l.4 2.4h6l.4-2.4a8 8 0 0 0 1.7-1l2.4.5 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 17 15 12 10 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21 21V3a2 2 0 0 0-2-2h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
          onClick={onClose}
        />
      )}

      <aside className={`${styles.sidebar} slide-in ${isOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>D</div>
          <div>
            <div className={styles.brandTitle}>DokonCRM</div>
            <div className={styles.brandSub}>1-do‘kon</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavItem active={pathname === "/dashboard"} icon={<IconHome />} label="Dashboard" href="/dashboard" onNavigate={onClose} />
          <NavItem active={pathname === "/savdo"} icon={<IconCash />} label="Savdo qilish" href="/savdo" onNavigate={onClose} />
          <NavItem active={pathname === "/mahsulotlar"} icon={<IconBox />} label="Mahsulotlar" href="/mahsulotlar" onNavigate={onClose} />
          <NavItem active={pathname === "/qarz"} icon={<IconUsers />} label="Mijozlar / Qarz" href="/qarz" onNavigate={onClose} />
          <NavItem active={pathname === "/hisobot"} icon={<IconReport />} label="Hisobot" href="/hisobot" onNavigate={onClose} />
          <NavItem active={pathname === "/sozlamalar"} icon={<IconSettings />} label="Sozlamalar" href="/sozlamalar" onNavigate={onClose} />
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>R</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>Ro‘zali</div>
              <div className={styles.userRole}>Admin</div>
            </div>
          </div>

          <button className={styles.logoutBtn} type="button">
            <IconLogout />
            Chiqish
          </button>
        </div>
      </aside>
    </>
  )
}
