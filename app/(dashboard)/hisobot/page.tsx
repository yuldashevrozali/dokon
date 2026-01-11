"use client"

import React, { useEffect, useMemo, useState } from "react"

type Unit = "dona" | "kg" | "litr" | "quti"
type Sale = {
  _id: string
  productId: string
  productName: string
  quantity: number
  unit: Unit
  sellPrice: number
  costPrice: number
  total: number
  profit: number
  timestamp: string
}


function formatUZS(n: number) {
  if (!Number.isFinite(n)) return "0"
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

function getStartOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getStartOfMonth(date: Date) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function HisobotPage() {
  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSales(data)
        }
      })
      .catch(err => console.error('Error fetching sales:', err))
  }, [])

  const now = new Date()
  const todayStart = getStartOfDay(now)
  const weekStart = getStartOfWeek(now)
  const monthStart = getStartOfMonth(now)

  const todaySales = useMemo(() => sales.filter(s => s.timestamp >= todayStart), [sales, todayStart])
  const weekSales = useMemo(() => sales.filter(s => s.timestamp >= weekStart), [sales, weekStart])
  const monthSales = useMemo(() => sales.filter(s => s.timestamp >= monthStart), [sales, monthStart])

  function calcStats(salesList: Sale[]) {
    const totalRevenue = salesList.reduce((sum, s) => sum + s.total, 0)
    const totalProfit = salesList.reduce((sum, s) => sum + s.profit, 0)
    const totalItems = salesList.reduce((sum, s) => sum + s.quantity, 0)
    return { totalRevenue, totalProfit, totalItems }
  }

  const todayStats = calcStats(todaySales)
  const weekStats = calcStats(weekSales)
  const monthStats = calcStats(monthSales)

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string, quantity: number, revenue: number }>()
    for (const s of sales) {
      const key = s.productName
      if (!map.has(key)) {
        map.set(key, { name: key, quantity: 0, revenue: 0 })
      }
      const item = map.get(key)!
      item.quantity += s.quantity
      item.revenue += s.total
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
  }, [sales])

  const styles: Record<string, React.CSSProperties> = {
    page: { padding: 22, background: "#f7f8fb", minHeight: "100vh" },
    header: { marginBottom: 20 },
    title: { margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" },
    sub: { margin: "6px 0 0", color: "#64748b", fontSize: 13 },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: 16,
      marginBottom: 24,
    },
    card: {
      background: "#fff",
      border: "1px solid #e8ebf3",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 10px 25px rgba(15,23,42,.04)",
    },
    cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a", marginBottom: 12 },
    stat: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
    statLabel: { color: "#64748b", fontSize: 14 },
    statValue: { fontWeight: 900, color: "#0f172a", fontSize: 16 },
    tableWrap: {
      background: "#fff",
      border: "1px solid #e8ebf3",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 10px 25px rgba(15,23,42,.04)",
    },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 },
    th: {
      textAlign: "left",
      color: "#667085",
      fontWeight: 900,
      padding: "12px 14px",
      borderBottom: "1px solid #eef2f7",
      background: "#fbfcff",
    },
    td: {
      padding: "12px 14px",
      borderBottom: "1px solid #f1f5f9",
      color: "#0f172a",
    },
    mono: {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  }

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <button
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 16,
            marginRight: 10,
          }}
          className="hamburger"
          onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
        >
          ☰
        </button>
        <div>
          <h1 style={styles.title}>📊 Hisobot</h1>
          <p style={styles.sub}>
            Savdo statistikasi: bugun, hafta, oy va eng ko‘p sotilgan mahsulotlar.
          </p>
        </div>
      </div>

      <div style={styles.grid} className="slide-in">
        <div style={styles.card} className="bounce-in">
          <div style={styles.cardTitle}>📅 Bugun</div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Savdo:</span>
            <span style={styles.statValue}>{formatUZS(todayStats.totalRevenue)} so‘m</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Foyda:</span>
            <span style={styles.statValue}>{formatUZS(todayStats.totalProfit)} so‘m</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Sotilgan:</span>
            <span style={styles.statValue}>{todayStats.totalItems} birlik</span>
          </div>
        </div>

        <div style={{ ...styles.card, animationDelay: '0.1s' }} className="bounce-in">
          <div style={styles.cardTitle}>📆 Bu hafta</div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Savdo:</span>
            <span style={styles.statValue}>{formatUZS(weekStats.totalRevenue)} so‘m</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Foyda:</span>
            <span style={styles.statValue}>{formatUZS(weekStats.totalProfit)} so‘m</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Sotilgan:</span>
            <span style={styles.statValue}>{weekStats.totalItems} birlik</span>
          </div>
        </div>

        <div style={{ ...styles.card, animationDelay: '0.2s' }} className="bounce-in">
          <div style={styles.cardTitle}>📊 Bu oy</div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Savdo:</span>
            <span style={styles.statValue}>{formatUZS(monthStats.totalRevenue)} so‘m</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Foyda:</span>
            <span style={styles.statValue}>{formatUZS(monthStats.totalProfit)} so‘m</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Sotilgan:</span>
            <span style={styles.statValue}>{monthStats.totalItems} birlik</span>
          </div>
        </div>
      </div>

      <div style={{ ...styles.tableWrap, animationDelay: '0.6s' }} className="fade-in">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mahsulot</th>
              <th style={styles.th}>Sotilgan</th>
              <th style={styles.th}>Savdo</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr>
                <td style={{ ...styles.td, color: "#64748b" }} colSpan={3}>
                  Hali savdo yo‘q.
                </td>
              </tr>
            ) : (
              topProducts.map((p) => (
                <tr key={p.name}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={{ ...styles.td, ...styles.mono }}>{p.quantity} birlik</td>
                  <td style={{ ...styles.td, ...styles.mono }}>{formatUZS(p.revenue)} so‘m</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}